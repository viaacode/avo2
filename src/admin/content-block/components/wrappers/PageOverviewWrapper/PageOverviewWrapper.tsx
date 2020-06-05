import { get, isString } from 'lodash-es';
import queryString from 'query-string';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { compose } from 'redux';

import {
	BlockPageOverview,
	ButtonAction,
	ContentItemStyle,
	ContentPageInfo,
	ContentTabStyle,
	LabelObj,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { getUserGroupIds } from '../../../../../authentication/authentication.service';
import { DefaultSecureRouteProps } from '../../../../../authentication/components/SecuredRoute';
import { ContentPage } from '../../../../../content-page/views';
import { CustomError, navigateToContentType, sanitizeHtml } from '../../../../../shared/helpers';
import withUser from '../../../../../shared/hocs/withUser';
import { useDebounce } from '../../../../../shared/hooks';
import { dataService, ToastService } from '../../../../../shared/services';
import i18n from '../../../../../shared/translations/i18n';
import { GET_CONTENT_PAGES, GET_CONTENT_PAGES_WITH_BLOCKS } from '../../../../content/content.gql';
import { ContentService } from '../../../../content/content.service';
import { DbContent } from '../../../../content/content.types';
import { ContentTypeAndLabelsValue } from '../../../../shared/components/ContentTypeAndLabelsPicker/ContentTypeAndLabelsPicker';

interface PageOverviewWrapperProps {
	contentTypeAndTabs: ContentTypeAndLabelsValue;
	tabStyle?: ContentTabStyle;
	allowMultiple?: boolean;
	centerHeader?: boolean;
	itemStyle?: ContentItemStyle;
	showTitle?: boolean;
	showDescription?: boolean;
	showDate?: boolean;
	buttonLabel?: string;
	itemsPerPage?: number;
}

const PageOverviewWrapper: FunctionComponent<PageOverviewWrapperProps &
	DefaultSecureRouteProps> = ({
	contentTypeAndTabs = {
		selectedContentType: 'PROJECT',
		selectedLabels: [],
	},
	tabStyle = 'MENU_BAR',
	allowMultiple = false,
	centerHeader = false,
	itemStyle = 'LIST',
	showTitle = true,
	showDescription = true,
	showDate = false,
	buttonLabel = i18n.t(
		'admin/content-block/components/page-overview-wrapper/page-overview-wrapper___lees-meer'
	),
	itemsPerPage = 20,
	history,
	location,
	user,
}) => {
	const [t] = useTranslation();

	const [currentPage, setCurrentPage] = useState<number>(0);
	const [selectedTabs, setSelectedTabs] = useState<LabelObj[]>([]);
	const [pages, setPages] = useState<DbContent[]>([]);
	const [pageCount, setPageCount] = useState<number>(1);
	const [focusedPageId, setFocusedPageId] = useState<number | undefined>(undefined);

	const debouncedItemsPerPage = useDebounce(itemsPerPage || 1000, 200); // Default to 1000 if itemsPerPage is zero

	const dbToPageOverviewContentPage = (dbContentPage: DbContent): ContentPageInfo => {
		return {
			thumbnail_path: dbContentPage.thumbnail_path || '/images/placeholder-wide.png',
			labels: dbContentPage.content_content_labels.map(cl => {
				const contentLabel = (cl.content_label as unknown) as Avo.Content.ContentLabel; // TODO remove cast after typings v2.18.0
				return {
					id: contentLabel.id,
					label: contentLabel.label,
				};
			}),
			created_at: dbContentPage.created_at,
			description: dbContentPage.description
				? sanitizeHtml(dbContentPage.description, 'full')
				: null,
			title: dbContentPage.title,
			id: dbContentPage.id,
			blocks: dbContentPage.contentBlockssBycontentId ? (
				<ContentPage contentPage={dbContentPage} />
			) : null,
			content_width: dbContentPage.content_width,
			path: dbContentPage.path as string, // TODO enforce path in database
		};
	};

	const getLabelFilter = useCallback((): any[] => {
		const selectedLabelIds = selectedTabs.map(labelObj => labelObj.id);
		const blockLabelIds = ((get(contentTypeAndTabs, 'selectedLabels') ||
			[]) as Avo.Content.ContentLabel[]).map(labelObj => labelObj.id);
		if (selectedLabelIds.length) {
			// The user selected some block labels at the top of the page overview component
			return [
				{
					content_content_labels: {
						content_label: { id: { _in: selectedLabelIds } },
					},
				},
			];
		}
		if (blockLabelIds.length) {
			// If the "all" label is selected, we want to get content pages with any of the block labels
			return [
				{
					content_content_labels: {
						content_label: { id: { _in: blockLabelIds } },
					},
				},
			];
		}
		return [];
	}, [selectedTabs, contentTypeAndTabs]);

	const fetchPages = useCallback(async () => {
		try {
			const userGroupIds: number[] = getUserGroupIds(user);

			const response = await dataService.query({
				query:
					itemStyle === 'ACCORDION' ? GET_CONTENT_PAGES_WITH_BLOCKS : GET_CONTENT_PAGES,
				variables: {
					where: {
						_and: [
							{
								// Get content pages with the selected content type
								content_type: { _eq: contentTypeAndTabs.selectedContentType },
							},
							{
								// Get pages that are visible to the current user
								_or: userGroupIds.map(userGroupId => ({
									user_group_ids: { _contains: userGroupId },
								})),
							},
							...getLabelFilter(),
						],
					},
					offset: currentPage * debouncedItemsPerPage,
					limit: debouncedItemsPerPage,
				},
			});
			setPages(get(response, 'data.app_content', []));
			setPageCount(
				Math.ceil(
					get(response, 'data.app_content_aggregate.aggregate.count', 0) /
						debouncedItemsPerPage
				)
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to fetch pages', err, {
					query: 'GET_CONTENT',
					variables: {
						offset: currentPage * debouncedItemsPerPage,
						limit: debouncedItemsPerPage,
					},
				})
			);
			ToastService.danger(
				t(
					'admin/content-block/components/page-overview-wrapper/page-overview-wrapper___het-ophalen-van-de-paginas-is-mislukt'
				)
			);
		}
	}, [
		itemStyle,
		currentPage,
		debouncedItemsPerPage,
		setPages,
		setPageCount,
		contentTypeAndTabs,
		getLabelFilter,
		user,
		t,
	]);

	const checkFocusedPage = useCallback(async () => {
		try {
			const queryParams = queryString.parse(location.search);
			if (queryParams.focus && isString(queryParams.focus)) {
				const contentPage = await ContentService.fetchContentPageByPath(queryParams.focus);
				if (!contentPage) {
					throw new CustomError('No pages were found with the provided path');
				}
				setFocusedPageId(contentPage.id);
			}
		} catch (err) {
			console.error('Failed to fetch content page by path', err, {
				queryParams: location.search,
			});
			ToastService.danger(t('Het ophalen van het te focussen item is mislukt'));
		}
	}, [location.search, setFocusedPageId, t]);

	useEffect(() => {
		fetchPages();
		checkFocusedPage();
	}, [fetchPages, checkFocusedPage]);

	const handleCurrentPageChanged = (pageIndex: number) => {
		setCurrentPage(pageIndex);
	};

	const handleSelectedTabsChanged = (tabs: LabelObj[]) => {
		setSelectedTabs(tabs);
		setCurrentPage(0);
	};

	return (
		<BlockPageOverview
			tabs={contentTypeAndTabs.selectedLabels}
			selectedTabs={selectedTabs}
			onSelectedTabsChanged={handleSelectedTabsChanged}
			currentPage={currentPage}
			onCurrentPageChanged={handleCurrentPageChanged}
			pageCount={pageCount}
			pages={pages.map(dbToPageOverviewContentPage)}
			tabStyle={tabStyle}
			itemStyle={itemStyle}
			allowMultiple={allowMultiple}
			centerHeader={centerHeader}
			showTitle={showTitle}
			showDescription={showDescription}
			showDate={showDate}
			dateString={t(
				'admin/content-block/components/page-overview-wrapper/page-overview-wrapper___geplaatst-in-label-op-date'
			)}
			allLabel={t(
				'admin/content-block/components/page-overview-wrapper/page-overview-wrapper___alle'
			)}
			noLabel={t(
				'admin/content-block/components/page-overview-wrapper/page-overview-wrapper___overige'
			)}
			buttonLabel={buttonLabel}
			activePageId={focusedPageId}
			navigate={(buttonAction: ButtonAction) => navigateToContentType(buttonAction, history)}
		/>
	);
};

export default compose(withRouter, withUser)(PageOverviewWrapper) as FunctionComponent<
	PageOverviewWrapperProps
>;
