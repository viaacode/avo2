import { cloneDeep, every, get, isArray, isEmpty, isEqual, isNil, isPlainObject, pickBy, set, } from 'lodash-es';
import React, { FunctionComponent, ReactText, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { JsonParam, StringParam, UrlUpdateType, useQueryParams } from 'use-query-params';

import {
	Button,
	Container,
	Flex,
	Form,
	FormGroup,
	Navbar,
	Select,
	Spacer,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
	ToolbarTitle,
	useKeyPress,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';
import { SearchResultItem } from '@viaa/avo2-types/types/search';

import { PermissionGuard, PermissionGuardFail, PermissionGuardPass, } from '../../authentication/components';
import { PermissionName } from '../../authentication/helpers/permission-names';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import { ErrorView } from '../../error/views';
import { InteractiveTour } from '../../shared/components';
import MoreOptionsDropdown from '../../shared/components/MoreOptionsDropdown/MoreOptionsDropdown';
import { copyToClipboard, CustomError, isMobileWidth, navigate } from '../../shared/helpers';
import { BookmarksViewsPlaysService, ToastService } from '../../shared/services';
import {
	CONTENT_TYPE_TO_EVENT_CONTENT_TYPE,
	CONTENT_TYPE_TO_EVENT_CONTENT_TYPE_SIMPLIFIED,
} from '../../shared/services/bookmarks-views-plays-service';
import {
	BookmarkRequestInfo,
	BookmarkStatusLookup,
} from '../../shared/services/bookmarks-views-plays-service/bookmarks-views-plays-service.types';
import { AppState } from '../../store';
import { SearchFilterControls, SearchResults } from '../components';
import { DEFAULT_FILTER_STATE, DEFAULT_SORT_ORDER, ITEMS_PER_PAGE } from '../search.const';
import { fetchSearchResults } from '../search.service';
import { FilterState, SearchFilterFieldValues, SearchFilterMultiOptions, SearchProps, } from '../search.types';
import { getSearchResults } from '../store/actions';
import { selectSearchError, selectSearchLoading, selectSearchResults } from '../store/selectors';

import './Search.scss';
import { PermissionService } from '../../authentication/helpers/permission-service';

const Search: FunctionComponent<SearchProps> = ({
	searchResults,
	searchResultsLoading,
	searchResultsError,
	search,
	user,
	history,
}) => {
	const [t] = useTranslation();

	const queryParamConfig = {
		filters: JsonParam,
		orderProperty: StringParam,
		orderDirection: StringParam,
	};
	const [filterState, setFilterState] = useQueryParams(queryParamConfig) as [
		FilterState,
		(FilterState: FilterState, updateType?: UrlUpdateType) => void
	];

	const [multiOptions, setMultiOptions] = useState({} as SearchFilterMultiOptions);
	const [currentPage, setCurrentPage] = useState(0);
	const [searchTerms, setSearchTerms] = useState('');
	const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
	const [bookmarkStatuses, setBookmarkStatuses] = useState<BookmarkStatusLookup | null>(null);

	const urlUpdateType: UrlUpdateType = 'push';

	/**
	 * Update the search results when the filterState or the currentPage changes
	 */
	const onFilterStateChanged = useCallback(() => {
		const orderProperty: Avo.Search.OrderProperty =
			(filterState.orderProperty as Avo.Search.OrderProperty | undefined) ||
			DEFAULT_SORT_ORDER.orderProperty;

		const orderDirection: Avo.Search.OrderDirection =
			(filterState.orderDirection as Avo.Search.OrderDirection | undefined) ||
			DEFAULT_SORT_ORDER.orderDirection;

		search(
			orderProperty,
			orderDirection,
			currentPage * ITEMS_PER_PAGE,
			ITEMS_PER_PAGE,
			cleanupFilterState(filterState).filters,
			{}
		);
	}, [filterState, currentPage, search]);

	const updateSearchTerms = useCallback(() => {
		const query = get(filterState, 'filters.query', '');
		if (query) {
			setSearchTerms(query);
		}
	}, [setSearchTerms, filterState]);

	useEffect(() => {
		if (!PermissionService.hasPerm(user, PermissionName.SEARCH)) {
			return;
		}
		onFilterStateChanged();
		updateSearchTerms();
	}, [onFilterStateChanged, updateSearchTerms, user]);

	/**
	 * Update the filter values and scroll to the top
	 */
	useEffect(() => {
		if (searchResults) {
			// Update the checkbox items and counts
			setMultiOptions(searchResults.aggregations);

			//  Scroll to the first search result
			window.scrollTo(0, 0);
		}
	}, [searchResults]);

	const getBookmarkStatuses = useCallback(async () => {
		try {
			const results = get(searchResults, 'results');
			const profileId = get(user, 'profile.id');

			if (!results || !profileId) {
				// search results or user hasn't been loaded yet
				return;
			}

			const objectInfos = results.map(
				(result: Avo.Search.ResultItem): BookmarkRequestInfo => {
					const type =
						CONTENT_TYPE_TO_EVENT_CONTENT_TYPE_SIMPLIFIED[result.administrative_type];
					return {
						type,
						uuid: result.uid,
					};
				}
			);
			setBookmarkStatuses(
				await BookmarksViewsPlaysService.getBookmarkStatuses(profileId, objectInfos)
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to get bookmark statuses', err, {
					searchResults,
					user,
				})
			);
			ToastService.danger(
				t('search/views/search___het-ophalen-van-de-bladwijzer-statusen-is-mislukt')
			);
		}
	}, [t, setBookmarkStatuses, searchResults, user]);

	useEffect(() => {
		if (PermissionService.hasPerm(user, PermissionName.CREATE_BOOKMARKS)) {
			getBookmarkStatuses();
		}
	}, [getBookmarkStatuses, user]);

	const handleFilterFieldChange = async (
		value: SearchFilterFieldValues,
		id: Avo.Search.FilterProp
	) => {
		let newFilterState: any;
		if (value) {
			newFilterState = {
				...filterState,
				filters: {
					...filterState.filters,
					[id]: value,
					query: searchTerms,
				},
			};
		} else {
			newFilterState = {
				...filterState,
				filters: {
					...filterState.filters,
					[id]: DEFAULT_FILTER_STATE[id],
					query: searchTerms,
				},
			};
		}
		setFilterState(cleanupFilterState(newFilterState), urlUpdateType);

		// Reset to page 1 when search is triggered
		setCurrentPage(0);
	};

	const handleOrderChanged = async (value: string = 'relevance_desc') => {
		const valueParts: string[] = value.split('_');
		setFilterState(
			{
				...filterState,
				orderProperty: valueParts[0] as Avo.Search.OrderProperty,
				orderDirection: valueParts[1] as Avo.Search.OrderDirection,
			},
			urlUpdateType
		);

		// Reset to page 1 when search is triggered
		setCurrentPage(0);
	};

	const cleanupFilterState = (filterState: FilterState): FilterState => {
		return {
			...filterState,
			filters: pickBy(filterState.filters, (value: string) => {
				const isEmptyString: boolean = value === '';
				const isUndefinedOrNull: boolean = isNil(value);
				const isEmptyObjectOrArray: boolean =
					(isPlainObject(value) || isArray(value)) && isEmpty(value);
				const isArrayWithEmptyValues: boolean =
					isArray(value) && every(value, (arrayValue) => arrayValue === '');
				const isEmptyRangeObject: boolean =
					isPlainObject(value) && !(value as any).gte && !(value as any).lte;

				return (
					!isEmptyString &&
					!isUndefinedOrNull &&
					!isEmptyObjectOrArray &&
					!isArrayWithEmptyValues &&
					!isEmptyRangeObject
				);
			}),
		};
	};

	const deleteAllFilters = () => {
		setSearchTerms('');
		setFilterState({}, urlUpdateType);
	};

	const setPage = async (pageIndex: number): Promise<void> => {
		setCurrentPage(pageIndex);
	};

	const handleBookmarkToggle = async (uuid: string, active: boolean) => {
		try {
			const results = get(searchResults, 'results', []);
			const resultItem: SearchResultItem | undefined = results.find(
				(result) => result.uid === uuid
			);
			if (!resultItem) {
				throw new CustomError('Failed to find search result by id');
			}
			const type = CONTENT_TYPE_TO_EVENT_CONTENT_TYPE[resultItem.administrative_type];
			await BookmarksViewsPlaysService.toggleBookmark(uuid, user, type, !active);

			// Update the local cache of bookmark statuses
			const bookmarkStatusesTemp = cloneDeep(bookmarkStatuses) || {
				item: {},
				collection: {},
			};
			set(bookmarkStatusesTemp, `[${type}][${uuid}]`, active);
			setBookmarkStatuses(bookmarkStatusesTemp);
			ToastService.success(
				active
					? t('search/views/search___de-bladwijzer-is-aangemaakt')
					: t('search/views/search___de-bladwijzer-is-verwijderd')
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to toggle bookmark', err, {
					uuid,
					user,
					searchResults,
					isBookmarked: !active,
				})
			);
			ToastService.danger(
				active
					? t('search/views/search___het-aanmaken-van-de-bladwijzer-is-mislukt')
					: t('search/views/search___het-verwijderen-van-de-bladwijzer-is-mislukt')
			);
		}
	};

	const handleTagClicked = (tagId: string) => {
		setFilterState(
			{
				...filterState,
				filters: {
					...DEFAULT_FILTER_STATE,
					collectionLabel: [tagId],
				},
			},
			urlUpdateType
		);
	};

	// @ts-ignore
	const handleOriginalCpLinkClicked = async (id: string, originalCp: string | undefined) => {
		if (originalCp) {
			setFilterState({
				...filterState,
				filters: {
					...DEFAULT_FILTER_STATE,
					provider: [originalCp],
				},
			});
		}
	};

	/**
	 * Only copy search terms when the user clicks the search button or when enter is pressed
	 * Otherwise we would trigger a search for every letter that is typed
	 */
	const copySearchTermsToFormState = async () => {
		setFilterState(
			{
				...filterState,
				filters: {
					...filterState.filters,
					query: searchTerms,
				},
			},
			urlUpdateType
		);

		// Reset to page 1 when search is triggered
		setCurrentPage(0);
	};
	useKeyPress('Enter', copySearchTermsToFormState);

	const copySearchLink = () => {
		copyToClipboard(window.location.href);
	};

	const onCopySearchLinkClicked = () => {
		copySearchLink();
		setIsOptionsMenuOpen(false);
		ToastService.success(t('search/views/search___de-link-is-succesvol-gekopieerd'));
	};

	const orderOptions = [
		{ label: t('search/views/search___meest-relevant'), value: 'relevance_desc' },
		{ label: t('search/views/search___meest-bekeken'), value: 'views_desc' },
		{ label: t('search/views/search___uitzenddatum-aflopend'), value: 'broadcastDate_desc' },
		{ label: t('search/views/search___uitzenddatum-oplopend'), value: 'broadcastDate_asc' },
		{
			label: t('search/views/search___laatst-toegevoegd'),
			value: 'createdAt_desc',
		},
		{ label: t('search/views/search___laatst-gewijzigd'), value: 'updatedAt_desc' },
	];
	const defaultOrder = `${filterState.orderProperty || 'relevance'}_${
		filterState.orderDirection || 'desc'
	}`;
	const hasFilters = !isEqual(filterState.filters, DEFAULT_FILTER_STATE);
	const resultsCount = get(searchResults, 'count', 0);
	// elasticsearch can only handle 10000 results efficiently
	const pageCount = Math.ceil(Math.min(resultsCount, 10000) / ITEMS_PER_PAGE);
	const resultStart = currentPage * ITEMS_PER_PAGE + 1;
	const resultEnd = Math.min(resultStart + ITEMS_PER_PAGE - 1, resultsCount);

	const navigateToUserRequestForm = () =>
		navigate(history, APP_PATH.USER_ITEM_REQUEST_FORM.route);

	const onSearchInSearchFilter = async (id: string) => {
		const orderProperty: Avo.Search.OrderProperty =
			(filterState.orderProperty as Avo.Search.OrderProperty | undefined) ||
			DEFAULT_SORT_ORDER.orderProperty;

		const orderDirection: Avo.Search.OrderDirection =
			(filterState.orderDirection as Avo.Search.OrderDirection | undefined) ||
			DEFAULT_SORT_ORDER.orderDirection;

		const response = await fetchSearchResults(
			orderProperty,
			orderDirection,
			0,
			0, // We are only interested in aggs
			cleanupFilterState(filterState).filters,
			{},
			[id as Avo.Search.FilterProp],
			1000
		);

		setMultiOptions({
			...multiOptions,
			...response.aggregations,
		});
	};

	const handleOptionClicked = (optionId: string | number | ReactText) => {
		setIsOptionsMenuOpen(false);

		switch (optionId) {
			case 'copy_link':
				onCopySearchLinkClicked();
				return;

			case 'save':
				ToastService.info(t('search/views/search___nog-niet-geimplementeerd'));
				return;
		}
	};

	const renderSearchPage = () => (
		<div className="c-search-view">
			<Navbar>
				<Container mode="horizontal">
					<Toolbar className="c-toolbar--results">
						<ToolbarLeft>
							<ToolbarItem>
								<ToolbarTitle>
									<Trans i18nKey="search/views/search___zoekresultaten">
										Zoekresultaten
									</Trans>
								</ToolbarTitle>
							</ToolbarItem>
							<ToolbarItem>
								<p className="c-body-1 u-text-muted">
									{resultStart}-{resultEnd} van {resultsCount} resultaten
								</p>
							</ToolbarItem>
						</ToolbarLeft>
						<ToolbarRight>
							<Flex spaced="regular">
								<Form type="inline">
									<FormGroup
										label={t('search/views/search___sorteer-op')}
										labelFor="sortBy"
									>
										<Select
											className="c-search-view__sort-select"
											id="sortBy"
											options={orderOptions}
											value={defaultOrder}
											onChange={(value) => handleOrderChanged(value)}
										/>
									</FormGroup>
								</Form>
								<MoreOptionsDropdown
									isOpen={isOptionsMenuOpen}
									onOpen={() => setIsOptionsMenuOpen(true)}
									onClose={() => setIsOptionsMenuOpen(false)}
									menuItems={[
										{
											icon: 'link',
											id: 'copy_link',
											label: t(
												'search/views/search___kopieer-vaste-link-naar-deze-zoekopdracht'
											),
										},
										// {
										// 	id: 'save',
										// 	label: t(
										// 		'search/views/search___maak-van-deze-zoekopdracht-een-opdracht'
										// 	),
										// },
									]}
									onOptionClicked={handleOptionClicked}
								/>
								<InteractiveTour showButton />
							</Flex>
						</ToolbarRight>
					</Toolbar>
				</Container>
			</Navbar>
			<Navbar autoHeight>
				<Container mode="horizontal">
					<Spacer margin="top-large">
						<Spacer margin="bottom-large">
							<div className="u-limit-width-bp3">
								<Form type="inline">
									<FormGroup inlineMode="grow">
										<TextInput
											id="query"
											placeholder={t(
												'search/views/search___vul-uw-zoekterm-in'
											)}
											value={searchTerms}
											className="c-search-term-input-field"
											icon="search"
											onChange={setSearchTerms}
										/>
									</FormGroup>
									<FormGroup inlineMode="shrink">
										<Button
											label={t('search/views/search___zoeken')}
											type="primary"
											className="c-search-button"
											onClick={copySearchTermsToFormState}
										/>
									</FormGroup>
									{hasFilters && (
										<FormGroup inlineMode="shrink">
											<Button
												label={
													isMobileWidth()
														? ''
														: t(
																'search/views/search___verwijder-alle-filters'
														  )
												}
												ariaLabel={t(
													'search/views/search___verwijder-alle-filters'
												)}
												icon={isMobileWidth() ? 'trash-2' : undefined}
												type={isMobileWidth() ? 'borderless' : 'link'}
												onClick={deleteAllFilters}
											/>
										</FormGroup>
									)}
								</Form>
							</div>
						</Spacer>
						<SearchFilterControls
							filterState={filterState.filters || DEFAULT_FILTER_STATE}
							handleFilterFieldChange={handleFilterFieldChange}
							multiOptions={multiOptions}
							onSearch={onSearchInSearchFilter}
						/>
					</Spacer>
				</Container>
			</Navbar>
			{searchResultsError ? (
				<ErrorView
					message={t(
						'search/views/search___er-ging-iets-mis-tijdens-het-ophalen-van-de-zoek-resultaten-br-probeer-later-opnieuw-of-rapporteer-het-probleem-via-de-feedback-knop'
					)}
					actionButtons={['home']}
				/>
			) : (
				<SearchResults
					currentPage={currentPage}
					data={searchResults}
					handleBookmarkToggle={handleBookmarkToggle}
					handleTagClicked={handleTagClicked}
					handleOriginalCpLinkClicked={handleOriginalCpLinkClicked}
					loading={searchResultsLoading}
					pageCount={pageCount}
					setPage={setPage}
					bookmarkStatuses={bookmarkStatuses}
					navigateUserRequestForm={navigateToUserRequestForm}
				/>
			)}
		</div>
	);

	return (
		<>
			<MetaTags>
				<title>{GENERATE_SITE_TITLE(t('search/views/search___zoeken-pagina-titel'))}</title>
				<meta
					name="description"
					content={t('search/views/search___zoeken-pagina-beschrijving')}
				/>
			</MetaTags>
			<PermissionGuard permissions={PermissionName.SEARCH} user={user}>
				<PermissionGuardPass>{renderSearchPage()}</PermissionGuardPass>
				<PermissionGuardFail>
					<ErrorView
						message={t(
							'search/views/search___je-hebt-geen-rechten-om-de-zoek-pagina-te-bekijken'
						)}
						icon={'lock'}
						actionButtons={['home']}
					/>
				</PermissionGuardFail>
			</PermissionGuard>
		</>
	);
};

const mapStateToProps = (state: AppState) => ({
	searchResults: selectSearchResults(state),
	searchResultsLoading: selectSearchLoading(state),
	searchResultsError: selectSearchError(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => {
	return {
		search: (
			orderProperty: Avo.Search.OrderProperty,
			orderDirection: Avo.Search.OrderDirection,
			from: number,
			size: number,
			filters?: Partial<Avo.Search.Filters>,
			filterOptionSearch?: Partial<Avo.Search.FilterOption>
		) =>
			dispatch(
				getSearchResults(
					orderProperty,
					orderDirection,
					from,
					size,
					filters,
					filterOptionSearch
				) as any
			),
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(Search);
