import { debounce } from 'lodash-es';
import { parse } from 'querystring';
import React, {
	createRef,
	FunctionComponent,
	MouseEvent,
	ReactNode,
	RefObject,
	useEffect,
	useState,
} from 'react';
import { Trans } from 'react-i18next';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import { Scrollbar } from 'react-scrollbars-custom';
import { compose } from 'redux';

import {
	BlockHeading,
	Column,
	convertToHtml,
	ExpandableContainer,
	Grid,
	Spacer,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { Color } from '../../admin/shared/types';
import { FlowPlayerWrapper } from '../../shared/components';
import { CuePoints } from '../../shared/components/FlowPlayerWrapper/FlowPlayerWrapper';
import Html from '../../shared/components/Html/Html';
import { parseDuration, stripHtml } from '../../shared/helpers';
import withUser from '../../shared/hocs/withUser';

import './ItemVideoDescription.scss';

interface ItemVideoDescriptionProps {
	itemMetaData: Avo.Item.Item;
	showTitleOnVideo?: boolean;
	showDescription?: boolean;
	collapseDescription?: boolean;
	showTitle?: boolean;
	title?: string;
	description?: string;
	src?: string;
	poster?: string;
	cuePoints?: CuePoints;
	seekTime?: number;
	canPlay?: boolean; // If video is behind modal or inside a closed modal this value will be false
	verticalLayout?: boolean;
	titleLink?: string;
	onPlay?: () => void;
}

const DEFAULT_VIDEO_HEIGHT = 421;

const ItemVideoDescription: FunctionComponent<ItemVideoDescriptionProps & RouteComponentProps> = ({
	itemMetaData,
	showTitle = false,
	showDescription = true,
	collapseDescription = true,
	title = itemMetaData.title,
	description = itemMetaData.description,
	src,
	poster,
	cuePoints,
	seekTime = 0,
	canPlay = true,
	verticalLayout = false,
	titleLink,
	location,
	onPlay,
}) => {
	const TIMESTAMP_REGEX = /([0-9]{2}:[0-9]{2}:[0-9]{2})/g;

	const videoRef: RefObject<HTMLVideoElement> = createRef();

	const [time, setTime] = useState<number>(seekTime);
	const [videoHeight, setVideoHeight] = useState<number>(DEFAULT_VIDEO_HEIGHT); // correct height for desktop screens

	useEffect(() => {
		// Set video current time from the query params once the video has loaded its meta data
		// If this happens sooner, the time will be ignored by the video player
		const queryParams = parse(location.search);

		setTime(parseInt((queryParams.time as string) || String(seekTime || 0), 10));
	}, [location.search, setTime, seekTime]);

	useEffect(() => {
		if (seekTime) {
			setTime(seekTime);
		}
	}, [seekTime, setTime]);

	useEffect(() => {
		// Register window listener when the component mounts
		const onResizeHandler = debounce(
			() => {
				if (videoRef.current) {
					const vidHeight = videoRef.current.getBoundingClientRect().height;
					setVideoHeight(vidHeight);
				} else {
					setVideoHeight(DEFAULT_VIDEO_HEIGHT);
				}
			},
			300,
			{ leading: false, trailing: true }
		);

		window.addEventListener('resize', onResizeHandler);
		onResizeHandler();

		return () => {
			window.removeEventListener('resize', onResizeHandler);
		};
	}, [videoRef]);

	const isTimeCode = (text: string): boolean => {
		return TIMESTAMP_REGEX.test(text);
	};

	const handleTimeLinkClicked = async (timestamp: string) => {
		const seconds = parseDuration(timestamp);
		setTime(seconds);
	};

	const handleDescriptionClicked = (evt: MouseEvent<HTMLDivElement>) => {
		const clickedText = (evt.target as any).innerText;
		if (isTimeCode(clickedText)) {
			handleTimeLinkClicked(clickedText);
		}
	};

	/**
	 * Split string by time markers and adds links to those times into the output jsx code
	 */
	const formatTimestamps = (description: string = ''): ReactNode => {
		const formattedDescription = description
			.replace(/[\n\r]+/, '')
			.replace(TIMESTAMP_REGEX, (match) => {
				return `<span class="c-description-timecode">${match}</span>`;
			});

		return <Html content={formattedDescription} type="span" sanitizePreset="full" />;
	};

	const renderMedia = () => {
		return (
			<FlowPlayerWrapper
				src={src}
				poster={poster}
				item={itemMetaData}
				canPlay={canPlay}
				cuePoints={cuePoints}
				seekTime={time}
				onPlay={onPlay}
			/>
		);
	};

	const renderTitle = () => {
		const titleElement = (
			<BlockHeading
				type="h3"
				className={titleLink ? 'u-clickable' : ''}
				color={titleLink ? Color.TealBright : undefined}
			>
				{title}
			</BlockHeading>
		);

		if (titleLink) {
			return (
				<Link to={titleLink} className="a-link__no-styles">
					{titleElement}
				</Link>
			);
		} 
			return titleElement;
		
	};

	const renderDescription = () => {
		return (
			<>
				{showTitle ? (
					renderTitle()
				) : (
					<BlockHeading type="h4">
						<Trans i18nKey="item/components/item-video-description___beschrijving">
							Beschrijving
						</Trans>
					</BlockHeading>
				)}
				<p className="c-content">{formatTimestamps(convertToHtml(description))}</p>
			</>
		);
	};

	const renderDescriptionWrapper = () => {
		if (collapseDescription) {
			if (verticalLayout) {
				if (stripHtml(convertToHtml(description)).length < 444) {
					// The description is short enough so we don't need to collapse it, and we can make the height auto
					return renderDescription();
				}
				// The height is too large, we need to wrap the description in a collapsable container
				return (
					<ExpandableContainer collapsedHeight={300 - 36 - 18}>
						{renderDescription()}
					</ExpandableContainer>
				);
			}
			// The description is rendered next to the video
			// We need to make the height of the description collapsable container the same as the video height
			return (
				<Scrollbar
					style={{
						width: '100%',
						height: `${videoHeight}px`, // Height of button
						overflowY: 'auto',
					}}
				>
					{/* TODO: Fix label height - read more button (36) - additional margin (18) */}
					<ExpandableContainer collapsedHeight={videoHeight - 36 - 18}>
						{renderDescription()}
					</ExpandableContainer>
				</Scrollbar>
			);
		}

		return renderDescription();
	};

	return (
		<Grid className="c-item-video-description">
			{showDescription ? (
				<>
					<Column size={verticalLayout ? '2-12' : '2-7'} className="c-video-column">
						{renderMedia()}
					</Column>
					<Column size={verticalLayout ? '2-12' : '2-5'}>
						<Spacer margin={verticalLayout ? ['top'] : []}>
							<div onClick={handleDescriptionClicked}>
								{renderDescriptionWrapper()}
							</div>
						</Spacer>
					</Column>
				</>
			) : (
				<>
					<Column size={verticalLayout ? '2-12' : '2-3'}>
						<></>
					</Column>
					<Column size={verticalLayout ? '2-12' : '2-6'}>{renderMedia()}</Column>
					<Column size={verticalLayout ? '2-12' : '2-3'}>
						<></>
					</Column>
				</>
			)}
		</Grid>
	);
};

export default compose(withRouter, withUser)(ItemVideoDescription) as FunctionComponent<
	ItemVideoDescriptionProps
>;
