import { Avo } from '@viaa/avo2-types';
import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';
import { CollectionsOrBundlesOverviewTableCols } from './collections-or-bundles.types';

export const COLLECTIONS_OR_BUNDLES_PATH = {
	COLLECTIONS_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.collections}`,
	BUNDLES_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.bundles}`,
};

export const ITEMS_PER_PAGE = 10;

export const TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT: Partial<
	{
		[columnId in CollectionsOrBundlesOverviewTableCols]: (
			order: Avo.Search.OrderDirection
		) => any;
	}
> = {
	author_first_name: (order: Avo.Search.OrderDirection) => ({
		profile: { usersByuserId: { first_name: order } },
	}),
	author_last_name: (order: Avo.Search.OrderDirection) => ({
		profile: { usersByuserId: { first_name: order } },
	}),
	author_role: (order: Avo.Search.OrderDirection) => ({
		profile: { usersByuserId: { first_name: order } },
	}),
	views: (order: Avo.Search.OrderDirection) => ({ view_counts_aggregate: { count: order } }),
};

export const USER_OVERVIEW_TABLE_COLS: FilterableColumn[] = [
	{ id: 'title', label: i18n.t('Title'), sortable: true },
	{ id: 'author_first_name', label: i18n.t('Auteur voornaam'), sortable: true },
	{ id: 'author_last_name', label: i18n.t('Auteur achternaam'), sortable: true },
	{
		id: 'created_at',
		label: i18n.t('Aangemaakt op'),
		sortable: true,
		filterType: 'DateRangeDropdown',
		filterProps: {},
	},
	{
		id: 'updated_at',
		label: i18n.t('Aangepast op'),
		sortable: true,
		filterType: 'DateRangeDropdown',
		filterProps: {},
	},
	{
		id: 'is_public',
		label: i18n.t('Publiek'),
		sortable: true,
		filterType: 'BooleanCheckboxDropdown',
	},
	{ id: 'author_role', label: i18n.t('Auteur rol'), sortable: true },
	{ id: 'views', label: i18n.t('Bekeken'), sortable: true },
	// { id: 'bookmarks', label: i18n.t('Gebookmarkt'), sortable: true },
	// { id: 'in_bundles', label: i18n.t('In Bundel'), sortable: true },
	// { id: 'subjects', label: i18n.t('Vakken'), sortable: true },
	// { id: 'education_levels', label: i18n.t('Opleidingsniveaus'), sortable: true },
	// { id: 'labels', label: i18n.t('Labels'), sortable: true },
	{ id: 'actions', label: '' },
];
