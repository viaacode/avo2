import { Avo } from '@viaa/avo2-types';

import { CheckboxDropdownModalProps, CheckboxOption } from '../../shared/components';
import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';

import { ItemsOverviewTableCols } from './items.types';

export const ITEMS_PATH = {
	ITEMS_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.items}`,
	PUBLISH_ITEMS_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.publishItems}`,
	ITEM_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.items}/:id`,
};

export const ITEMS_PER_PAGE = 10;

export const TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT: Partial<
	{
		[columnId in ItemsOverviewTableCols]: (order: Avo.Search.OrderDirection) => any;
	}
> = {
	organisation: (order: Avo.Search.OrderDirection) => ({ organisation: { name: order } }),
	type: (order: Avo.Search.OrderDirection) => ({ type: { label: order } }),
	views: (order: Avo.Search.OrderDirection) => ({
		item_counts: { views: order },
	}),
	in_collection: (order: Avo.Search.OrderDirection) => ({
		item_counts: { in_collection: order },
	}),
	bookmarks: (order: Avo.Search.OrderDirection) => ({
		item_counts: { bookmarks: order },
	}),
	in_assignment: (order: Avo.Search.OrderDirection) => ({
		item_counts: { in_assignment: order },
	}),
};

export const GET_ITEM_OVERVIEW_TABLE_COLS: (
	seriesOptions: CheckboxOption[],
	cpOptions: CheckboxOption[]
) => FilterableColumn[] = (seriesOptions: CheckboxOption[], cpOptions: CheckboxOption[]) => [
	{
		id: 'external_id',
		label: i18n.t('admin/items/items___pid'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'title',
		label: i18n.t('admin/items/items___titel'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'series',
		label: i18n.t('admin/items/items___reeks'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: seriesOptions,
			showMaxOptions: 40,
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'issued',
		label: i18n.t('admin/items/items___uitgegeven'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'published_at',
		label: i18n.t('admin/items/items___published'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'type',
		label: i18n.t('admin/items/items___type'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: [
				{ label: i18n.t('admin/items/items___video'), id: 'video' },
				{ label: i18n.t('admin/items/items___audio'), id: 'audio' },
			] as CheckboxOption[],
			showMaxOptions: 40,
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'organisation',
		label: i18n.t('admin/items/items___cp'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: cpOptions,
			showMaxOptions: 40,
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'is_published',
		label: i18n.t('admin/items/items___publiek'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: [
				{
					label: i18n.t('admin/items/items___gepubliceerd'),
					id: 'published',
				},
				{
					label: i18n.t('admin/items/items___gedepubliceerd'),
					id: 'unpublished',
				},
				{
					label: i18n.t('admin/items/items___gedepubliceerd-pancarte'),
					id: 'unpublished-with-reason',
				},
				{
					label: i18n.t('admin/items/items___gedepubliceerd-merge'),
					id: 'unpublished-with-merge',
				},
			],
		},
	},
	{
		id: 'views',
		tooltip: i18n.t('admin/collections-or-bundles/collections-or-bundles___bekeken'),
		icon: 'eye',
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'in_collection',
		tooltip: i18n.t('admin/items/items___aantal-keer-opgenomen-in-collectie'),
		icon: 'collection',
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'bookmarks',
		tooltip: i18n.t(
			'admin/collections-or-bundles/views/collections-or-bundles-overview___aantal-keer-opgenomen-in-een-bladwijzer'
		),
		icon: 'bookmark',
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'in_assignment',
		tooltip: i18n.t(
			'admin/collections-or-bundles/views/collections-or-bundles-overview___aantal-keer-opgenomen-in-een-opdracht'
		),
		icon: 'clipboard',
		sortable: true,
		visibleByDefault: true,
	},
	// {
	// 	id: 'updated_at',
	// 	label: i18n.t('admin/items/items___aangepast-op'),
	// 	sortable: true, visibleByDefault: true,
	// 	visibleByDefault: true,
	// 	filterType: 'DateRangeDropdown',
	// },
	// {
	// 	id: 'publish_at',
	// 	label: i18n.t('admin/items/items___publish-at'),
	// 	sortable: true, visibleByDefault: true,
	// 	visibleByDefault: true,
	// 	filterType: 'DateRangeDropdown',
	// },
	// {
	// 	id: 'depublish_at',
	// 	label: i18n.t('admin/items/items___depubliceren-op'),
	// 	sortable: true, visibleByDefault: true,
	// 	visibleByDefault: true,
	// 	filterType: 'DateRangeDropdown',
	// },
	// { id: 'description', label: i18n.t('admin/items/items___beschrijving'), sortable: true, visibleByDefault: true },
	// { id: 'duration', label: i18n.t('admin/items/items___duur'), sortable: true, visibleByDefault: true },
	// {
	// 	id: 'expiry_date',
	// 	label: i18n.t('admin/items/items___expiratie-op'),
	// 	sortable: true, visibleByDefault: true,
	// 	visibleByDefault: true,
	// 	filterType: 'DateRangeDropdown',
	// },
	// { id: 'uid', label: i18n.t('admin/items/items___id'), sortable: true, visibleByDefault: true },
	// {
	// 	id: 'is_deleted',
	// 	label: i18n.t('admin/items/items___verwijdert'),
	// 	sortable: true, visibleByDefault: true,
	// 	visibleByDefault: true,
	// 	filterType: 'BooleanCheckboxDropdown',
	// },
	// { id: 'lom_classification', label: i18n.t('admin/items/items___vakken') },
	// { id: 'lom_context', label: i18n.t('admin/items/items___opleidingsniveau') },
	// { id: 'lom_intendedenduserrole', label: i18n.t('admin/items/items___bedoelde-rol'), sortable: true, visibleByDefault: true, visibleByDefault: true },
	// { id: 'lom_keywords', label: i18n.t('admin/items/items___terfwoorden') },
	// { id: 'lom_languages', label: i18n.t('admin/items/items___talen') },
	// { id: 'lom_typicalagerange', label: i18n.t('admin/items/items___leeftijdsgroep') },
	{ id: 'actions', tooltip: i18n.t('admin/items/items___acties'), visibleByDefault: true },
];

export const GET_PUBLISH_ITEM_OVERVIEW_TABLE_COLS: () => FilterableColumn[] = () => [
	{
		id: 'title',
		label: i18n.t('admin/items/items___titel'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'pid',
		label: i18n.t('admin/items/items___pid'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'updated_at',
		label: i18n.t('admin/items/items___aangepast-op-mam'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'status',
		label: i18n.t('admin/items/items___status'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: [
				{
					label: i18n.t('admin/items/items___nieuw'),
					id: 'NEW',
				},
				{
					label: i18n.t('admin/items/items___update'),
					id: 'UPDATE',
				},
			],
		},
	},
	{ id: 'actions', tooltip: i18n.t('admin/items/items___acties'), visibleByDefault: true },
];
