import classnames from 'classnames';
import { get, noop, omit } from 'lodash-es';
import React, { FunctionComponent, RefObject, useCallback, useEffect, useRef } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { Container, Spacer } from '@viaa/avo2-components';

import { generateSmartLink } from '../../../../shared/helpers';
import withUser, { UserProps } from '../../../../shared/hocs/withUser';
import { ContentPageInfo } from '../../../content/content.types';
import { Color, ContentBlockConfig } from '../../../shared/types';
import { GET_DARK_BACKGROUND_COLOR_OPTIONS } from '../../content-block.const';

import {
	COMPONENT_PREVIEW_MAP,
	CONTENT_PAGE_ACCESS_BLOCKS,
	IGNORE_BLOCK_LEVEL_PROPS,
	NAVIGABLE_CONTENT_BLOCKS,
	REPEATABLE_CONTENT_BLOCKS,
} from './ContentBlockPreview.const';
import './ContentBlockPreview.scss';

interface ContentBlockPreviewProps {
	contentBlockConfig: ContentBlockConfig;
	contentPageInfo: Partial<ContentPageInfo>;
	onClick: () => void;
	className?: string;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
enum ContentWidthMap {
	REGULAR = 'regular',
	LARGE = 'large',
	MEDIUM = 'medium',
}

/* eslint-enable @typescript-eslint/no-unused-vars */

const ContentBlockPreview: FunctionComponent<
	ContentBlockPreviewProps & UserProps & RouteComponentProps
> = ({ contentBlockConfig, contentPageInfo, onClick = noop, className, user }) => {
	const blockState = get(contentBlockConfig, 'block.state');
	const componentState = get(contentBlockConfig, 'components.state');
	const containerSize = ContentWidthMap[contentPageInfo.content_width || 'REGULAR'];
	const PreviewComponent = COMPONENT_PREVIEW_MAP[contentBlockConfig.type];
	const needsElements = REPEATABLE_CONTENT_BLOCKS.includes(contentBlockConfig.type);
	const componentStateProps: any = needsElements ? { elements: componentState } : componentState;

	const blockRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
	const headerBgRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

	const blockStateProps: { [key: string]: any } = omit(blockState, IGNORE_BLOCK_LEVEL_PROPS);

	const getHeaderHeight = useCallback((): string | null => {
		if (!blockRef.current) {
			return null;
		}
		const header: HTMLElement | null = blockRef.current.querySelector(
			'.c-content-page-overview-block__header'
		);
		if (!header) {
			return null;
		}
		header.style.opacity = '1';
		const height = header.getBoundingClientRect().height || 0;
		if (height) {
			return `${height + 16}px`;
		}
		return '0';
	}, [blockRef]);

	useEffect(() => {
		const timerId = setInterval(() => {
			if (headerBgRef && headerBgRef.current) {
				const height = getHeaderHeight();
				headerBgRef.current.style.height = height || '0';
			}
		}, 300);

		return () => {
			clearInterval(timerId);
		};
	}, [blockState.headerBackgroundColor, getHeaderHeight, headerBgRef]);

	if (NAVIGABLE_CONTENT_BLOCKS.includes(contentBlockConfig.type)) {
		// Pass a function to the block so it can render links without needing to know anything about the app routes
		// You pass in the buttonAction and the children of the link
		// And you receive a ReactNode that wraps the children in the correct link tag
		blockStateProps.renderLink = generateSmartLink;
	}

	// Pass the content page object to the block
	if (CONTENT_PAGE_ACCESS_BLOCKS.includes(contentBlockConfig.type)) {
		// Set profile to current user for unsaved pages
		blockStateProps.contentPageInfo = {
			...contentPageInfo,
			profile: contentPageInfo.profile || ({ ...get(user, 'profile', {}), user } as any),
		};
	}

	const hasDarkBg = GET_DARK_BACKGROUND_COLOR_OPTIONS().includes(blockState.backgroundColor);

	return (
		<div
			className={classnames('c-content-block', className)}
			style={{
				backgroundColor: blockState.backgroundColor,
				...(blockState.headerBackgroundColor !== Color.Transparent ? { zIndex: 1 } : {}),
			}}
			id={blockState.anchor}
			data-anchor={blockState.anchor}
			ref={blockRef}
			onClick={onClick}
		>
			<Spacer
				className={classnames('c-content-block-preview', {
					'c-content-block-preview--dark': hasDarkBg,
					'u-color-white': hasDarkBg,
				})}
				margin={[
					get(blockState, 'margin.top', 'none'),
					get(blockState, 'margin.bottom', 'none'),
				]}
				padding={[
					get(blockState, 'padding.top', 'none'),
					get(blockState, 'padding.bottom', 'none'),
				]}
			>
				<div
					className="c-content-block__header-bg-color"
					ref={headerBgRef}
					style={{
						backgroundColor: blockState.headerBackgroundColor,
					}}
				/>
				{blockState.fullWidth ? (
					<PreviewComponent {...componentStateProps} {...blockStateProps} />
				) : (
					<Container
						mode="horizontal"
						size={containerSize === ContentWidthMap.REGULAR ? undefined : containerSize}
					>
						<PreviewComponent {...componentStateProps} {...blockStateProps} />
					</Container>
				)}
			</Spacer>
		</div>
	);
};

export default compose(withRouter, withUser)(ContentBlockPreview) as FunctionComponent<
	ContentBlockPreviewProps
>;
