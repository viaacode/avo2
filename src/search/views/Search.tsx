import React, { FunctionComponent, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import {
	Button,
	Container,
	Dropdown,
	DropdownButton,
	DropdownContent,
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
import {
	cloneDeep,
	compact,
	every,
	get,
	isArray,
	isEmpty,
	isEqual,
	isNil,
	isPlainObject,
	pickBy,
} from 'lodash-es';
import queryString from 'query-string';

import {
	PermissionGuard,
	PermissionGuardFail,
	PermissionGuardPass,
} from '../../authentication/components';
import { copyToClipboard, navigate } from '../../shared/helpers';
import toastService from '../../shared/services/toast-service';

import { SearchFilterControls, SearchResults } from '../components';
import {
	DEFAULT_FORM_STATE,
	DEFAULT_SORT_ORDER,
	ITEMS_PER_PAGE,
	SEARCH_PATH,
} from '../search.const';
import {
	SearchFilterFieldValues,
	SearchFilterMultiOptions,
	SearchProps,
	SortOrder,
} from '../search.types';
import { getSearchResults } from '../store/actions';
import { selectSearchError, selectSearchLoading, selectSearchResults } from '../store/selectors';

import { PermissionNames } from '../../authentication/helpers/permission-service';
import { ErrorView } from '../../error/views';
import './Search.scss';

const Search: FunctionComponent<SearchProps> = ({
	searchResults,
	searchResultsLoading,
	searchResultsError,
	search,
	history,
	location,
	user,
}) => {
	const [t] = useTranslation();
	const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
	const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);
	const [multiOptions, setMultiOptions] = useState({} as SearchFilterMultiOptions);
	const [currentPage, setCurrentPage] = useState(0);
	const [searchTerms, setSearchTerms] = useState('');
	const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
	const [queryParamsAnalysed, setQueryParamsAnalysed] = useState(false);

	/**
	 * Update the search results when the formState, sortOrder or the currentPage changes
	 */
	useEffect(() => {
		// Only do initial search after query params have been analysed and have been added to the state
		if (queryParamsAnalysed) {
			// Parse values from formState into a parsed object that we'll send to the proxy search endpoint
			const filterOptions: Partial<Avo.Search.Filters> = cleanupFilterObject(cloneDeep(formState));

			// TODO: do the search by dispatching a redux action
			search(
				sortOrder.orderProperty,
				sortOrder.orderDirection,
				currentPage * ITEMS_PER_PAGE,
				ITEMS_PER_PAGE,
				filterOptions,
				{}
			);
		}
	}, [formState, sortOrder, currentPage, history, search, queryParamsAnalysed]);

	/**
	 * display the search results on the page and in the url when the results change
	 */
	useEffect(() => {
		if (searchResults) {
			const filterOptions: Partial<Avo.Search.Filters> = cleanupFilterObject(cloneDeep(formState));

			// Copy the searchterm to the search input field
			setSearchTerms(formState.query);

			// Update the checkbox items and counts
			setMultiOptions(searchResults.aggregations);

			// Remember this search by adding it to the query params in the url
			const filters = isEmpty(filterOptions) ? null : `filters=${JSON.stringify(filterOptions)}`;
			const orderProperty =
				sortOrder.orderProperty === 'relevance' ? null : `orderProperty=${sortOrder.orderProperty}`;
			const orderDirection =
				sortOrder.orderDirection === 'desc' ? null : `orderDirection=${sortOrder.orderDirection}`;
			const page = currentPage === 0 ? null : `page=${currentPage + 1}`;

			const queryParams: string = compact([filters, orderProperty, orderDirection, page]).join('&');
			navigate(history, SEARCH_PATH.SEARCH, {}, queryParams.length ? queryParams : '');

			//  Scroll to the first search result
			window.scrollTo(0, 0);
		}
	}, [searchResults, currentPage, formState, history, sortOrder]);

	const getFiltersFromQueryParams = () => {
		// Check if current url already has a query param set
		const queryParams = queryString.parse(location.search);
		let newFormState: Avo.Search.Filters = cloneDeep(formState);
		let newSortOrder: SortOrder = cloneDeep(sortOrder);
		let newCurrentPage: number = currentPage;
		try {
			if (
				queryParams.filters ||
				queryParams.orderProperty ||
				queryParams.orderDirection ||
				queryParams.page
			) {
				// Extract info from filter query params
				if (queryParams.filters) {
					newFormState = JSON.parse(queryParams.filters as string);
				}
				newSortOrder.orderProperty = (queryParams.orderProperty ||
					'relevance') as Avo.Search.OrderProperty;
				newSortOrder.orderDirection = (queryParams.orderDirection ||
					'desc') as Avo.Search.OrderDirection;
				newCurrentPage = parseInt((queryParams.page as string) || '1', 10) - 1;
			} else {
				// No filter query params present => reset state
				newFormState = DEFAULT_FORM_STATE;
				newSortOrder = DEFAULT_SORT_ORDER;
				newCurrentPage = 0;
			}

			if (
				!isEqual(newFormState, formState) ||
				!isEqual(newSortOrder, sortOrder) ||
				!isEqual(newCurrentPage, currentPage)
			) {
				// Only rerender if query params actually changed
				setFormState(newFormState);
				setSortOrder(newSortOrder);
				setCurrentPage(newCurrentPage);
			}
		} catch (err) {
			toastService.danger(t('search/views/search___ongeldige-zoek-query'));
			console.error(err);
		}
		setQueryParamsAnalysed(true);
	};

	// Only execute this effect once after the first render (componentDidMount)
	useEffect(getFiltersFromQueryParams, []);

	const handleFilterFieldChange = async (
		value: SearchFilterFieldValues,
		id: Avo.Search.FilterProp
	) => {
		if (value) {
			setFormState({
				...formState,
				[id]: value,
				query: searchTerms,
			});
		} else {
			setFormState({
				...formState,
				[id]: DEFAULT_FORM_STATE[id],
				query: searchTerms,
			});
		}

		// Reset to page 1 when search is triggered
		setCurrentPage(0);
	};

	const handleOrderChanged = async (value: string = 'relevance_desc') => {
		const valueParts: string[] = value.split('_');
		const orderProperty = valueParts[0] as Avo.Search.OrderProperty;
		const orderDirection = valueParts[1] as Avo.Search.OrderDirection;
		setSortOrder({ orderProperty, orderDirection });

		// Reset to page 1 when search is triggered
		setCurrentPage(0);
	};

	const cleanupFilterObject = (obj: any): any => {
		return pickBy(obj, (value: string) => {
			const isEmptyString: boolean = value === '';
			const isUndefinedOrNull: boolean = isNil(value);
			const isEmptyObjectOrArray: boolean =
				(isPlainObject(value) || isArray(value)) && isEmpty(value);
			const isArrayWithEmptyValues: boolean =
				isArray(value) && every(value, arrayValue => arrayValue === '');
			const isEmptyRangeObject: boolean =
				isPlainObject(value) && !(value as any).gte && !(value as any).lte;

			return (
				!isEmptyString &&
				!isUndefinedOrNull &&
				!isEmptyObjectOrArray &&
				!isArrayWithEmptyValues &&
				!isEmptyRangeObject
			);
		});
	};

	const deleteAllFilters = () => {
		setFormState({
			...DEFAULT_FORM_STATE,
		});
	};

	const setPage = async (pageIndex: number): Promise<void> => {
		setCurrentPage(pageIndex);
	};

	// TODO: FEATURE - handle search result bookmark button toggle
	const handleBookmarkToggle = (id: string, active: boolean) => {};

	const handleOriginalCpLinkClicked = async (id: string, originalCp: string | undefined) => {
		if (originalCp) {
			setFormState({
				...DEFAULT_FORM_STATE,
				provider: [originalCp],
			});
		}
	};

	/**
	 * Only copy search terms when the user clicks the search button or when enter is pressed
	 * Otherwise we would trigger a search for every letter that is typed
	 */
	const copySearchTermsToFormState = async () => {
		setFormState({
			...formState,
			query: searchTerms,
		});

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
		toastService.success(t('search/views/search___de-link-is-succesvol-gekopieerd'));
	};

	const orderOptions = [
		{ label: t('search/views/search___meest-relevant'), value: 'relevance_desc' },
		{ label: t('search/views/search___meest-bekeken'), value: 'views_desc', disabled: true },
		{ label: t('search/views/search___uitzenddatum-aflopend'), value: 'broadcastDate_desc' },
		{ label: t('search/views/search___uitzenddatum-oplopend'), value: 'broadcastDate_asc' },
		{
			label: t('search/views/search___laatst-toegevoegd'),
			value: 'addedDate_desc',
			disabled: true,
		},
		{ label: t('search/views/search___laatst-gewijzigd'), value: 'editDate_desc', disabled: true },
	];
	const defaultOrder = `${sortOrder.orderProperty || 'relevance'}_${sortOrder.orderDirection ||
		'desc'}`;
	const hasFilters = !isEqual(formState, DEFAULT_FORM_STATE);
	const resultsCount = get(searchResults, 'count', 0);
	// elasticsearch can only handle 10000 results efficiently
	const pageCount = Math.ceil(Math.min(resultsCount, 10000) / ITEMS_PER_PAGE);
	const resultStart = currentPage * ITEMS_PER_PAGE + 1;
	const resultEnd = Math.min(resultStart + ITEMS_PER_PAGE - 1, resultsCount);

	const renderSearchPage = () => (
		<Container className="c-search-view" mode="horizontal">
			<Navbar>
				<Container mode="horizontal">
					<Toolbar>
						<ToolbarLeft>
							<ToolbarItem>
								<ToolbarTitle>
									<Trans i18nKey="search/views/search___zoekresultaten">Zoekresultaten</Trans>
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
									<FormGroup label={t('search/views/search___sorteer-op')} labelFor="sortBy">
										<Select
											className="c-search-view__sort-select"
											id="sortBy"
											options={orderOptions}
											value={defaultOrder}
											onChange={value => handleOrderChanged(value)}
										/>
									</FormGroup>
								</Form>
								<Dropdown
									isOpen={isOptionsMenuOpen}
									menuWidth="fit-content"
									onOpen={() => setIsOptionsMenuOpen(true)}
									onClose={() => setIsOptionsMenuOpen(false)}
									placement="bottom-end"
								>
									<DropdownButton>
										<Button type="tertiary" icon="more-horizontal" />
									</DropdownButton>
									<DropdownContent>
										<Button
											type="link"
											className="c-menu__item"
											label={t('search/views/search___kopieer-vaste-link-naar-deze-zoekopdracht')}
											onClick={onCopySearchLinkClicked}
										/>
										{/* TODO: DSABLED_FEATURE Create link to create search assignment task */}
										{/* <Button
											type="link"
											className="c-menu__item"
											label={t('search/views/search___maak-van-deze-zoekopdracht-een-opdracht')}
											onClick={() => {
												setIsOptionsMenuOpen(false);
												toastService.info('Nog niet geïmplementeerd');
											}}
										/> */}
									</DropdownContent>
								</Dropdown>
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
											placeholder={t('search/views/search___vul-uw-zoekterm-in')}
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
												label={t('search/views/search___verwijder-alle-filters')}
												type="link"
												onClick={deleteAllFilters}
											/>
										</FormGroup>
									)}
								</Form>
							</div>
						</Spacer>
						<SearchFilterControls
							formState={formState}
							handleFilterFieldChange={handleFilterFieldChange}
							multiOptions={multiOptions}
						/>
					</Spacer>
				</Container>
			</Navbar>
			{searchResultsError ? (
				<ErrorView
					message={t(
						'Er ging iets mis tijdens het ophalen van de zoek resultaten,<br/>Probeer later opnieuw of rapporteer het probleem via de feedback knop'
					)}
					actionButtons={['home']}
				/>
			) : (
				<SearchResults
					currentPage={currentPage}
					data={searchResults}
					handleBookmarkToggle={handleBookmarkToggle}
					handleOriginalCpLinkClicked={handleOriginalCpLinkClicked}
					loading={searchResultsLoading}
					pageCount={pageCount}
					setPage={setPage}
				/>
			)}
		</Container>
	);

	return (
		<PermissionGuard permissions={PermissionNames.SEARCH} user={user}>
			<PermissionGuardPass>{renderSearchPage()}</PermissionGuardPass>
			<PermissionGuardFail>
				<ErrorView
					message={t('search/views/search___je-hebt-geen-rechten-om-de-zoek-pagina-te-bekijken')}
					icon={'lock'}
					actionButtons={['home']}
				/>
			</PermissionGuardFail>
		</PermissionGuard>
	);
};

const mapStateToProps = (state: any) => ({
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
