import { get, isNil } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AspectRatioWrapper, FlowPlayer, formatDuration, Icon } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { getProfileName } from '../../../authentication/helpers/get-profile-info';
import { CustomError, getEnv, reorderDate, toSeconds } from '../../helpers';
import { getValidStartAndEnd } from '../../helpers/cut-start-and-end';
import { getSubtitles } from '../../helpers/get-subtitles';
import withUser, { UserProps } from '../../hocs/withUser';
import { BookmarksViewsPlaysService, ToastService } from '../../services';
import { trackEvents } from '../../services/event-logging-service';
import { fetchPlayerTicket } from '../../services/player-ticket-service';

import './FlowPlayerWrapper.scss';

export interface CuePoints {
	start: number | null;
	end: number | null;
}

type FlowPlayerWrapperProps = {
	item?: Avo.Item.Item;
	src?: string;
	poster?: string;
	organisationName?: string;
	organisationLogo?: string;
	issuedDate?: string;
	annotationTitle?: string;
	annotationText?: string;
	canPlay?: boolean;
	cuePoints?: CuePoints;
	seekTime?: number;
	autoplay?: boolean;
	onPlay?: () => void;
};

/**
 * Handle flowplayer play events for the whole app, so we track play count
 * @param props
 * @constructor
 */
const FlowPlayerWrapper: FunctionComponent<FlowPlayerWrapperProps & UserProps> = (props) => {
	const [t] = useTranslation();

	const item: Avo.Item.Item | undefined = props.item;
	const poster: string | undefined = props.poster || get(item, 'thumbnail_path');

	const [triggeredForUrl, setTriggeredForUrl] = useState<string | null>(null);
	const [clickedThumbnail, setClickedThumbnail] = useState<boolean>(false);
	const [src, setSrc] = useState<string | undefined>(props.src);

	useEffect(() => {
		// reset token when item changes
		setSrc(props.src);
		setClickedThumbnail(false);
	}, [item, props.src, setSrc, setClickedThumbnail]);

	const initFlowPlayer = useCallback(async () => {
		try {
			if (!item) {
				throw new CustomError('Failed to init flowplayer since item is undefined');
			}
			setSrc(await fetchPlayerTicket(item.external_id));
		} catch (err) {
			console.error(
				new CustomError('Failed to initFlowlayer in FlowPlayerWrapper', err, {
					item,
				})
			);
			ToastService.danger(
				t(
					'item/components/item-video-description___het-ophalen-van-de-mediaplayer-ticket-is-mislukt'
				)
			);
		}
	}, [item, setSrc, t]);

	useEffect(() => {
		if (props.autoplay && item) {
			initFlowPlayer();
		}
	}, [props.autoplay, item, initFlowPlayer]);

	const handlePlay = () => {
		// Only trigger once per video
		if (item && item.uid && triggeredForUrl !== src) {
			BookmarksViewsPlaysService.action('play', 'item', item.uid, undefined).catch((err) => {
				console.error(
					new CustomError('Failed to track item play event', err, { itemUuid: item.uid })
				);
			});
			if (props.user) {
				trackEvents(
					{
						object: item.external_id,
						object_type: 'item',
						message: `Gebruiker ${getProfileName(props.user)} heeft het item ${
							item.external_id
						} afgespeeld`,
						action: 'view',
					},
					props.user
				);
				if (props.onPlay) {
					props.onPlay();
				}
			}
			setTriggeredForUrl(src || null);
		}
	};

	const handlePosterClicked = () => {
		setClickedThumbnail(true);
		if (!src) {
			initFlowPlayer();
		}
	};

	const hasHlsSupport = (): boolean => {
		try {
			new MediaSource();
			return true;
		} catch (err) {
			return false;
		}
	};

	const getBrowserSafeUrl = (src: string): string => {
		if (hasHlsSupport()) {
			return src;
		}
		if (src.includes('flowplayer')) {
			return src.replace('/hls/', '/v-').replace('/playlist.m3u8', '_original.mp4');
		} else {
			ToastService.danger(
				t(
					'shared/components/flow-player-wrapper/flow-player-wrapper___deze-video-kan-niet-worden-afgespeeld-probeer-een-andere-browser'
				)
			);
			return src;
		}
	};

	const [start, end] = getValidStartAndEnd(
		props.cuePoints?.start,
		props.cuePoints?.end,
		toSeconds(item?.duration)
	);

	return (
		<div className="c-video-player t-player-skin--dark">
			{src && (props.autoplay || clickedThumbnail || !item) ? (
				<FlowPlayer
					src={getBrowserSafeUrl(src)}
					seekTime={props.seekTime}
					poster={poster}
					title={get(item, 'title')}
					metadata={
						item
							? [
									props.issuedDate || reorderDate(item.issued || null, '.'),
									props.organisationName || get(item, 'organisation.name', ''),
							  ]
							: undefined
					}
					token={getEnv('FLOW_PLAYER_TOKEN')}
					dataPlayerId={getEnv('FLOW_PLAYER_ID')}
					logo={props.organisationLogo || get(item, 'organisation.logo_url')}
					start={item ? start : null}
					end={item ? end : null}
					autoplay={(!!item && !!src) || props.autoplay}
					canPlay={props.canPlay}
					subtitles={getSubtitles(item)}
					onPlay={handlePlay}
				/>
			) : (
				<div className="c-video-player__overlay" onClick={handlePosterClicked}>
					<AspectRatioWrapper
						className="c-video-player__item c-video-player__thumbnail"
						style={{ backgroundImage: `url(${poster})` }}
					/>
					<div className="c-play-overlay">
						<div className="c-play-overlay__inner">
							<Icon name="play" className="c-play-overlay__button" />
						</div>
					</div>
					{!isNil(start) &&
						!isNil(end) &&
						(start !== 0 || end !== toSeconds(item?.duration)) && (
							<div className="c-cut-overlay">
								<Icon name="scissors" />
								{`${formatDuration(start)} - ${formatDuration(end)}`}
							</div>
						)}
				</div>
			)}
			{(!!props.annotationTitle || !!props.annotationText) && (
				<div className="a-block-image__annotation">
					{props.annotationTitle && <h3>&#169; {props.annotationTitle}</h3>}
					{props.annotationText && (
						<p className="a-flowplayer__text">{props.annotationText}</p>
					)}
				</div>
			)}
		</div>
	);
};

export default withUser(FlowPlayerWrapper) as FunctionComponent<FlowPlayerWrapperProps>;
