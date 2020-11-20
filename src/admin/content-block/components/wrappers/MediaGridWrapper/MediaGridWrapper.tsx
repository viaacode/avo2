import { get, isEmpty } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
	BlockMediaGrid,
	ButtonAction,
	MediaListItem,
	RenderLinkFunction,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import {
	ContentTypeString,
	toEnglishContentType,
} from '../../../../../collection/collection.types';
import { ItemVideoDescription } from '../../../../../item/components';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../../../shared/components';
import { formatDate, isMobileWidth } from '../../../../../shared/helpers';
import { parseIntOrDefault } from '../../../../../shared/helpers/parsers/number';
import withUser, { UserProps } from '../../../../../shared/hocs/withUser';
import { ContentPageService } from '../../../../../shared/services/content-page-service';
import { MediaGridBlockComponentState, MediaGridBlockState } from '../../../../shared/types';

import { ResolvedItemOrCollection } from './MediaGridWrapper.types';

interface MediaGridWrapperProps extends MediaGridBlockState {
	searchQuery?: ButtonAction;
	searchQueryLimit: string;
	elements: { mediaItem: ButtonAction }[];
	results: ResolvedItemOrCollection[];
	renderLink?: RenderLinkFunction;
}

const MediaGridWrapper: FunctionComponent<
	MediaGridWrapperProps & RouteComponentProps & UserProps
> = ({
	title,
	buttonLabel,
	buttonAction,
	ctaTitle,
	ctaTitleColor,
	ctaTitleSize,
	ctaContent,
	ctaContentColor,
	ctaButtonLabel,
	ctaButtonType,
	ctaButtonIcon,
	ctaBackgroundColor,
	ctaBackgroundImage,
	ctaWidth,
	openMediaInModal,
	ctaButtonAction,
	searchQuery,
	searchQueryLimit,
	elements,
	results,
	user,
	renderLink,
}) => {
	const [t] = useTranslation();

	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [resolvedResults, setResolvedResults] = useState<ResolvedItemOrCollection[] | null>(null);

	// cache search results
	const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
	const [lastSearchQueryLimit, setLastSearchQueryLimit] = useState<number | null>(null);

	const resolveMediaResults = useCallback(async () => {
		try {
			if (results && results.length) {
				// Results are filled in, we can render the block
				setResolvedResults(results);
				return;
			}
			if (results && elements && !elements.length) {
				// Results is empty, but elements is also empty, so we don't need to render anything
				setResolvedResults(results);
				return;
			}
			if (user) {
				// If we are logged in and get no results, but we do get elements, then the block is loaded in preview mode,
				// and we should resolve the results ourselves using a separate route on the server
				const searchQueryLimitNumber =
					parseIntOrDefault<undefined>(searchQueryLimit, undefined) || 8;
				const searchQueryValue = get(searchQuery, 'value') as string | undefined;

				if (
					searchQueryValue !== lastSearchQuery ||
					searchQueryLimitNumber > (lastSearchQueryLimit || 0)
				) {
					// Only fetch items from the server if the search query changed or if the number of items increased
					setLastSearchQuery(searchQueryValue || null);
					setLastSearchQueryLimit(searchQueryLimitNumber);
					const searchResults = await ContentPageService.resolveMediaItems(
						searchQueryValue,
						searchQueryLimitNumber,
						elements.filter((element) => !isEmpty(element) && element.mediaItem)
					);

					setResolvedResults((r) => {
						if (
							r &&
							r.length &&
							searchResults.length !== (searchQueryLimitNumber || 8)
						) {
							// older request that we should ignore
							return r;
						}
						return searchResults;
					});
				} else if (
					searchQueryValue === lastSearchQuery ||
					searchQueryLimitNumber < (lastSearchQueryLimit || 0)
				) {
					// If the next query requests less items, we can resolve it without going to the server
					// by just trimming the items in the cache
					setResolvedResults((r) => (r || []).slice(0, searchQueryLimitNumber));
					setLastSearchQueryLimit(searchQueryLimitNumber);
				}
			}
		} catch (err) {
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/content-block/components/wrappers/media-grid-wrapper/media-grid-wrapper___het-laden-van-deze-media-tegel-grid-is-mislukt'
				),
				actionButtons: [],
			});
		}
	}, [
		results,
		elements,
		user,
		searchQuery,
		searchQueryLimit,
		lastSearchQuery,
		lastSearchQueryLimit,
		setResolvedResults,
		setLoadingInfo,
		t,
	]);

	useEffect(() => {
		resolveMediaResults();
	}, [resolveMediaResults]);

	useEffect(() => {
		if (resolvedResults) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [resolvedResults]);

	const mapCollectionOrItemData = (
		itemOrCollection: ResolvedItemOrCollection,
		index: number
	): MediaListItem => {
		const itemLabel = get(itemOrCollection, 'type.label', 'item');
		const isItem =
			itemLabel === ContentTypeString.video || itemLabel === ContentTypeString.audio;
		const isCollection = itemLabel === ContentTypeString.collection;
		const itemDuration = get(itemOrCollection, 'duration', 0);
		const collectionItems = get(
			itemOrCollection,
			'collection_fragments_aggregate.aggregate.count',
			0
		); // TODO add fragment count to elasticsearch index
		const viewCount = get(itemOrCollection, 'view_counts_aggregate.aggregate.sum.count', 0);

		const element: MediaGridBlockComponentState = (elements || [])[index] || ({} as any);

		return {
			category: isItem
				? itemLabel
				: isCollection
				? toEnglishContentType(ContentTypeString.collection)
				: toEnglishContentType(ContentTypeString.bundle),
			metadata: [
				{ icon: 'eye', label: String(viewCount || 0) },
				{ label: formatDate(itemOrCollection.created_at) },
			],
			buttonLabel: element.buttonLabel,
			buttonType: element.buttonType,
			buttonIcon: element.buttonIcon,
			itemAction:
				element.mediaItem ||
				({
					type: isItem ? 'ITEM' : isCollection ? 'COLLECTION' : 'BUNDLE',
					value: itemOrCollection.external_id || itemOrCollection.id,
					target: get(searchQuery, 'target') || '_self',
				} as ButtonAction),
			buttonAction: element.buttonAction,
			title: itemOrCollection.title || '',
			description: itemOrCollection.description || '',
			issued: get(itemOrCollection, 'issued') || '',
			organisation: itemOrCollection.organisation || '',
			thumbnail: {
				label: itemLabel,
				meta: isItem
					? itemDuration
					: `${collectionItems} ${isCollection ? 'items' : 'collecties'}`,
				src: itemOrCollection.thumbnail_path || '',
			},
			src: itemOrCollection.src,
			item_collaterals: get(itemOrCollection, 'item_collaterals', null),
		} as any;
	};

	const renderPlayerModalBody = (item: MediaListItem) => {
		return (
			!!item &&
			!!(item as any).src && ( // TODO remove cast after update to components v1.47.0
				<ItemVideoDescription
					src={(item as any).src} // TODO remove cast after update to components v1.47.0
					poster={get(item, 'thumbnail.src')}
					itemMetaData={(item as unknown) as Avo.Item.Item}
					verticalLayout
					showTitle
					collapseDescription={false}
				/>
			)
		);
	};

	// Render
	const renderMediaGridBlock = () => {
		return (
			<BlockMediaGrid
				title={title}
				buttonLabel={buttonLabel}
				buttonAction={buttonAction || searchQuery}
				ctaTitle={ctaTitle}
				ctaTitleColor={ctaTitleColor}
				ctaTitleSize={ctaTitleSize}
				ctaContent={ctaContent}
				ctaContentColor={ctaContentColor}
				ctaButtonLabel={ctaButtonLabel}
				ctaButtonType={ctaButtonType}
				ctaButtonIcon={ctaButtonIcon}
				ctaBackgroundColor={ctaBackgroundColor}
				ctaBackgroundImage={ctaBackgroundImage}
				ctaWidth={ctaWidth}
				openMediaInModal={openMediaInModal}
				ctaButtonAction={ctaButtonAction}
				fullWidth={isMobileWidth()}
				elements={(resolvedResults || []).map(mapCollectionOrItemData)}
				renderLink={renderLink}
				renderPlayerModalBody={renderPlayerModalBody}
			/>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={resolvedResults}
			render={renderMediaGridBlock}
		/>
	);
};

export default compose(withRouter, withUser)(MediaGridWrapper) as FunctionComponent<
	MediaGridWrapperProps
>;
