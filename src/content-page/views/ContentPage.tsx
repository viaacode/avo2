import classnames from 'classnames';
import { cloneDeep, compact, intersection, noop, set } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockImageProps } from '@viaa/avo2-components';

import { ContentBlockPreview } from '../../admin/content-block/components';
import { ContentService } from '../../admin/content/content.service';
import { BlockClickHandler, ContentPageInfo } from '../../admin/content/content.types';
import { ContentBlockConfig, ContentBlockType } from '../../admin/shared/types';
import { getUserGroupIds } from '../../authentication/authentication.service';
import { InteractiveTour, LoadingErrorLoadedComponent, LoadingInfo } from '../../shared/components';
import { CustomError } from '../../shared/helpers';
import withUser, { UserProps } from '../../shared/hocs/withUser';
import { ContentPageService } from '../../shared/services/content-page-service';

import './ContentPage.scss';

type ContentPageDetailProps =
	| {
			contentPageInfo: Partial<ContentPageInfo>;
			activeBlockPosition?: number | null;
			onBlockClicked?: BlockClickHandler;
	  }
	| { path: string };

const ContentPage: FunctionComponent<ContentPageDetailProps & UserProps> = (props) => {
	const [t] = useTranslation();
	const [contentPageInfo, setContentPageInfo] = useState<ContentPageInfo | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });

	const fetchContentPage = useCallback(async () => {
		try {
			if ((props as any).path) {
				setContentPageInfo(
					await ContentPageService.getContentPageByPath((props as any).path)
				);
			} else if ((props as any).contentPageInfo) {
				setContentPageInfo((props as any).contentPageInfo);
			} else {
				console.error(
					new CustomError(
						'Failed to load content page because neither path not content page info was passed to ContentPage component',
						null,
						{ props }
					)
				);
				setLoadingInfo({
					state: 'error',
					message: t(
						'content-page/views/content-page___het-laden-van-deze-content-pagina-is-mislukt'
					),
				});
			}
		} catch (err) {
			console.error(new CustomError('Failed to load content page', err, { props }));
			setLoadingInfo({
				state: 'error',
				message: t(
					'content-page/views/content-page___het-laden-van-deze-content-pagina-is-mislukt'
				),
			});
		}
	}, [props, t]);

	useEffect(() => {
		fetchContentPage();
	}, [fetchContentPage]);

	useEffect(() => {
		if (contentPageInfo) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [contentPageInfo]);

	const getContentBlocks = (contentPageInfo: ContentPageInfo) => {
		// Convert editor states to html
		let contentBlockBlockConfigs = ContentService.convertRichTextEditorStatesToHtml(
			contentPageInfo.contentBlockConfigs || []
		);

		// images can have a setting to go full width
		// so we need to set the block prop: fullWidth to true if we find an image block with size setting: pageWidth
		contentBlockBlockConfigs = contentBlockBlockConfigs.map((contentBlockConfig) => {
			const width = (contentBlockConfig.components.state as BlockImageProps).width;
			if (
				contentBlockConfig.type === ContentBlockType.Image &&
				width &&
				!width.endsWith('%') &&
				!width.endsWith('px')
			) {
				return set(cloneDeep(contentBlockConfig), 'block.state.fullWidth', true);
			}
			return contentBlockConfig;
		});

		// Add page title as header block for faq items
		if (contentPageInfo.content_type === 'FAQ_ITEM') {
			contentBlockBlockConfigs = [
				({
					position: 0,
					name: 'Titel',
					type: 'HEADING',
					components: {
						state: {
							children: contentPageInfo.title,
							type: 'h1',
							align: 'left',
						},
					},
					block: {
						state: {
							blockType: 'HEADING',
							position: 2,
							backgroundColor: '#FFF',
							headerBackgroundColor: '#FFF',
							padding: {
								top: 'top-extra-large',
								bottom: 'bottom-small',
							},
						},
					},
				} as unknown) as ContentBlockConfig,
				...contentBlockBlockConfigs,
			];
		}

		// Only accept content blocks for which the user is authorized
		contentBlockBlockConfigs = compact(
			contentBlockBlockConfigs.map(
				(contentBlockConfig: ContentBlockConfig): ContentBlockConfig | null => {
					const blockUserGroupIds: number[] =
						contentBlockConfig.block.state.userGroupIds || [];
					const userGroupIds = getUserGroupIds(props.user);
					if (blockUserGroupIds.length) {
						// Block has special restrictions set
						if (!intersection(blockUserGroupIds, userGroupIds).length) {
							// The user doesn't have the right permissions to see this block
							return null;
						}
					}
					// The user has the right permissions or there are no permissions defined for this block
					return contentBlockConfig;
				}
			)
		);

		return contentBlockBlockConfigs;
	};

	const renderContentPage = () => {
		return (
			<>
				<InteractiveTour showButton={false} />
				{getContentBlocks(contentPageInfo as ContentPageInfo).map(
					(contentBlockConfig: ContentBlockConfig) => {
						return (
							<ContentBlockPreview
								key={contentBlockConfig.id}
								contentBlockConfig={contentBlockConfig}
								contentPageInfo={contentPageInfo as ContentPageInfo}
								className={classnames(
									`content-block-preview-${contentBlockConfig.position}`,
									{
										'c-content-block__active':
											contentBlockConfig.position ===
											(props as any).activeBlockPosition,
									}
								)}
								onClick={() =>
									((props as any).onBlockClicked || noop)(
										contentBlockConfig.position,
										'preview'
									)
								}
							/>
						);
					}
				)}
			</>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={contentPageInfo}
			render={renderContentPage}
		/>
	);
};

export default withUser(ContentPage) as FunctionComponent<ContentPageDetailProps>;
