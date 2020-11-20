import classnames from 'classnames';
import { get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonAction } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import {
	FlowPlayerWrapper,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../../../shared/components';
import { CustomError } from '../../../../../shared/helpers';
import { ToastService } from '../../../../../shared/services';
import { ItemsService } from '../../../../items/items.service';

interface MediaPlayerWrapperProps {
	item?: ButtonAction;
	src?: string;
	poster?: string;
	title: string;
	annotationTitle?: string;
	annotationText?: string;
	issued?: string;
	organisation?: Avo.Organization.Organization;
	width?: string;
	autoplay?: boolean;
}

const MediaPlayerWrapper: FunctionComponent<MediaPlayerWrapperProps> = ({
	item,
	src,
	poster,
	title,
	annotationTitle,
	annotationText,
	issued,
	organisation,
	width,
	autoplay,
}) => {
	const [t] = useTranslation();

	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [videoStill, setVideoStill] = useState<string>();
	const [mediaItem, setMediaItem] = useState<Avo.Item.Item | null>(null);

	const retrieveMediaItem = useCallback(async () => {
		try {
			if (item && !src) {
				// !src since the proxy can resolve the src already for users without an account
				// Video from MAM
				const mediaItemTemp = await ItemsService.fetchItemByExternalId(
					item.value.toString()
				);
				setMediaItem(mediaItemTemp);
				setVideoStill(poster || get(mediaItemTemp, 'thumbnail_path'));
			} else {
				// Custom video
				setVideoStill(poster);
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to fetch item info from the database', err, { item })
			);
			ToastService.danger(
				t(
					'admin/content-block/components/wrappers/media-player-wrapper/media-player-wrapper___het-ophalen-van-het-fragment-is-mislukt'
				)
			);
		}
	}, [item, src, poster, t]);

	useEffect(() => {
		retrieveMediaItem();
	}, [retrieveMediaItem]);

	useEffect(() => {
		if (src || mediaItem) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [src, mediaItem, setLoadingInfo]);

	const renderVideoPlayer = () => {
		return (
			<div
				className={classnames('c-video-player t-player-skin--dark', 'u-center-m')}
				style={{ width }}
			>
				<FlowPlayerWrapper
					item={
						mediaItem
							? ({
									...(mediaItem || {}),
									title: title || get(mediaItem, 'title') || '',
									issued: issued || get(mediaItem, 'issued') || '',
									organisation:
										organisation || get(mediaItem, 'organisation') || '',
							  } as any)
							: undefined
					}
					src={src}
					poster={videoStill}
					organisationName={get(organisation || get(mediaItem, 'organisation'), 'name')}
					organisationLogo={get(
						organisation || get(mediaItem, 'organisation'),
						'logo_url'
					)}
					issuedDate={issued || get(mediaItem, 'issued')}
					autoplay={autoplay}
					annotationTitle={annotationTitle}
					annotationText={annotationText}
				/>
			</div>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={item || src}
			render={renderVideoPlayer}
		/>
	);
};

export default MediaPlayerWrapper;
