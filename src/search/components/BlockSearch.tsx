import { find, get, isNil } from 'lodash-es';
import React, { FunctionComponent, KeyboardEvent, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Dispatch } from 'redux';

import {
	BlockHeading,
	Button,
	Container,
	Dropdown,
	DropdownButton,
	DropdownContent,
	// Flex,
	MenuSearchResultContent,
	MenuSearchResultItemInfo,
	Spacer,
	Spinner,
	TextInput,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { toEnglishContentType } from '../../collection/collection.types';
import { generateContentLinkString, generateSearchLinkString } from '../../shared/helpers';
import { useDebounce } from '../../shared/hooks';
import { ToastService } from '../../shared/services';
import { KeyCode } from '../../shared/types';
import { AppState } from '../../store';
import { getSearchResults } from '../store/actions';
import { selectSearchLoading, selectSearchResults } from '../store/selectors';

import './BlockSearch.scss';

interface BlockSearchProps extends DefaultSecureRouteProps {
	searchResults: Avo.Search.Search | null;
	searchResultsLoading: boolean;
	search: (
		orderProperty: Avo.Search.OrderProperty,
		orderDirection: Avo.Search.OrderDirection,
		from: number,
		size: number,
		filters?: Partial<Avo.Search.Filters>,
		filterOptionSearch?: Partial<Avo.Search.FilterOption>
	) => Dispatch;
}

const ITEMS_IN_AUTOCOMPLETE = 5;

const BlockSearch: FunctionComponent<BlockSearchProps> = ({
	searchResults,
	searchResultsLoading,
	search,
	history,
}) => {
	const [t] = useTranslation();

	const [searchTerms, setSearchTerms] = useState<string>('');
	const [isAutocompleteSearchOpen, setAutocompleteSearchOpen] = useState<boolean>(false);
	const debouncedSearchTerms = useDebounce(searchTerms, 200);

	/**
	 * Trigger a new call to the backend for getting new search results when the searchTerms change
	 */
	useEffect(() => {
		// Only do initial search after query params have been analysed and have been added to the state
		const filters = { query: debouncedSearchTerms || '' };

		search('relevance', 'desc', 0, ITEMS_IN_AUTOCOMPLETE, filters, {});
	}, [debouncedSearchTerms, search]);

	// Computed
	const autocompleteMenuItems = (get(
		searchResults,
		'results',
		[]
	) as Avo.Search.ResultItem[]).map(
		(searchResult: Avo.Search.ResultItem): MenuSearchResultItemInfo => ({
			label: searchResult.dc_title,
			id: searchResult.external_id,
			type: toEnglishContentType(searchResult.administrative_type),
		})
	);

	const autocompleteButtonLabel = autocompleteMenuItems.length
		? 'Alle zoekresultaten'
		: 'Ga naar de zoek pagina';

	// Methods
	const gotoSearchPage = () => {
		history.push(generateSearchLinkString('query', searchTerms));
	};

	const goToSearchResult = (searchResultId: string | undefined) => {
		if (!isNil(searchResultId)) {
			// Collection ids are numbers and item ids are strings
			const searchResultItem: Avo.Search.ResultItem | undefined = find(
				get(searchResults, 'results', []),
				{
					id: searchResultId.toString(),
				}
			);

			if (searchResultItem) {
				history.push(
					generateContentLinkString(
						searchResultItem.administrative_type,
						searchResultItem.id
					)
				);
			} else {
				ToastService.danger(
					t('home/views/home___geen-zoekresultaten-gevonden-met-id-id', {
						id: searchResultId,
					})
				);
			}
		}
	};

	const handleSearchTermChanged = (searchTerm: string) => {
		setSearchTerms(searchTerm);
		setAutocompleteSearchOpen(true);
	};

	const handleSearchFieldKeyUp = (evt: KeyboardEvent<HTMLInputElement>) => {
		if (evt.keyCode === KeyCode.Enter) {
			gotoSearchPage();
		}
	};

	return (
		<Container mode="horizontal" size="medium" className="m-search-block">
			<Spacer>
				<BlockHeading type="h2" className="u-text-center">
					<Trans i18nKey="home/views/home___vind-alles-wat-je-nodig-hebt-om-je-lessen-te-verrijken">
						Vind alles wat je nodig hebt om je lessen te verrijken.
					</Trans>
				</BlockHeading>
				<div className="u-text-center">
					<Spacer margin="large">
						<Dropdown
							triggerWidth="full-width"
							isOpen={isAutocompleteSearchOpen}
							onOpen={() => setAutocompleteSearchOpen(true)}
							onClose={() => setAutocompleteSearchOpen(false)}
							searchMenu
							placement="top"
						>
							<DropdownButton>
								<TextInput
									placeholder={t('home/views/home___vul-een-zoekterm-in')}
									icon="search"
									value={searchTerms}
									onChange={(searchTerm) => handleSearchTermChanged(searchTerm)}
									onKeyUp={handleSearchFieldKeyUp}
								/>
							</DropdownButton>
							<DropdownContent>
								<div className="c-dropdown-results">
									{!searchResultsLoading ? (
										<MenuSearchResultContent
											menuItems={autocompleteMenuItems}
											noResultsLabel={t('home/views/home___geen-resultaten')}
											onClick={(id) => goToSearchResult(id.toString())}
										/>
									) : (
										<Spinner size="large" />
									)}
								</div>
								<div className="c-menu__footer">
									<Button
										block
										label={autocompleteButtonLabel}
										onClick={gotoSearchPage}
										type="secondary"
									/>
								</div>
							</DropdownContent>
						</Dropdown>
					</Spacer>
					{/* TODO: Disabled feature
					 	<Spacer margin="large">
							<p className="c-body-1">
								<Trans i18nKey="home/views/home___vind-inspiratie-voor-specifieke-vakken-en-domeinen">
									Vind inspiratie voor specifieke vakken en domeinen:
								</Trans>
							</p>
							<Flex className="c-button-toolbar" orientation="horizontal" center>
								TODO link to content page
								<Button
									label={t('home/views/home___basisonderwijs')}
									type="secondary"
								/>
								TODO link to content page
								<Button
									label={t('home/views/home___secundair-onderwijs')}
									type="secondary"
								/>
							</Flex>
						</Spacer>
					*/}
				</div>
			</Spacer>
		</Container>
	);
};

const mapStateToProps = (state: AppState) => ({
	searchResults: selectSearchResults(state),
	searchResultsLoading: selectSearchLoading(state),
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(BlockSearch));
