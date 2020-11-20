import { Dispatch } from 'redux';

import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../authentication/components/SecuredRoute';
import { CollectionLabelLookup } from '../collection/collection.types';
import { BookmarkStatusLookup } from '../shared/services/bookmarks-views-plays-service/bookmarks-views-plays-service.types';

export type SearchFilterFieldValues = string | string[] | Avo.Search.DateRange | null;
export type SearchFilterMultiOptions = { [key: string]: Avo.Search.OptionProp[] };

export interface SearchProps extends DefaultSecureRouteProps {
	searchResults: Avo.Search.Search | null;
	searchResultsLoading: boolean;
	searchResultsError: boolean;
	search: (
		orderProperty: Avo.Search.OrderProperty,
		orderDirection: Avo.Search.OrderDirection,
		from: number,
		size: number,
		filters?: Partial<Avo.Search.Filters>,
		filterOptionSearch?: Partial<Avo.Search.FilterOption>
	) => Dispatch;
}

export interface SortOrder {
	orderProperty: Avo.Search.OrderProperty;
	orderDirection: Avo.Search.OrderDirection;
}

export interface SearchResults {
	count: number;
	items: Avo.Search.ResultItem[];
}

export interface FilterState {
	filters?: Partial<Avo.Search.Filters>;
	orderProperty?: Avo.Search.OrderProperty;
	orderDirection?: Avo.Search.OrderDirection;
}

export interface SearchFilterControlsProps {
	filterState: Partial<Avo.Search.Filters>;
	handleFilterFieldChange: (
		values: SearchFilterFieldValues,
		propertyName: Avo.Search.FilterProp
	) => void;
	multiOptions: SearchFilterMultiOptions;
	onSearch?: (aggId: string) => void;
}

interface SearchResultItemHandlers {
	handleBookmarkToggle: (uuid: string, active: boolean) => void;
	handleTagClicked: (id: string) => void;
	handleOriginalCpLinkClicked: (id: string, cp: string) => void;
}

export interface SearchResultItemProps extends SearchResultItemHandlers {
	result: Avo.Search.ResultItem;
	collectionLabelLookup: CollectionLabelLookup;
	isBookmarked: boolean | null;
}

export interface SearchResultsProps extends SearchResultItemHandlers {
	currentPage: number;
	loading: boolean;
	pageCount: number;
	data: Avo.Search.Search | null;
	setPage: (page: number) => void;
	bookmarkStatuses: BookmarkStatusLookup | null;
	navigateUserRequestForm: () => void;
}
