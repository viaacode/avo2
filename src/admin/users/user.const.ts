import { Avo } from '@viaa/avo2-types';

import { CheckboxDropdownModalProps, CheckboxOption } from '../../shared/components';
import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';

import { UserOverviewTableCol } from './user.types';

export const USER_PATH = {
	USER_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.user}`,
	USER_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.user}/:id`,
};

export const ITEMS_PER_PAGE = 50;

export const GET_USER_OVERVIEW_TABLE_COLS: (
	userGroupOptions: CheckboxOption[]
) => FilterableColumn[] = (userGroupOptions: CheckboxOption[]) => [
	{ id: 'first_name', label: i18n.t('admin/users/user___voornaam'), sortable: true },
	{ id: 'last_name', label: i18n.t('admin/users/user___achternaam'), sortable: true },
	{ id: 'mail', label: i18n.t('admin/users/user___email'), sortable: true },
	{
		id: 'user_group',
		label: i18n.t('admin/users/user___gebruikersgroep'),
		sortable: false, // wait for https://meemoo.atlassian.net/browse/DEV-1128
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: userGroupOptions,
		} as CheckboxDropdownModalProps,
	},
	{ id: 'oormerk', label: i18n.t('admin/users/user___oormerk'), sortable: true },
	{
		id: 'is_blocked',
		label: i18n.t('admin/users/user___geblokkeerd'),
		sortable: true,
		filterType: 'BooleanCheckboxDropdown',
	},
	{ id: 'stamboek', label: i18n.t('admin/users/user___stamboek'), sortable: true },
	{ id: 'organisation', label: i18n.t('admin/users/user___organisatie'), sortable: true },
	{
		id: 'created_at',
		label: i18n.t('admin/users/user___gebruiker-sinds'),
		sortable: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'last_access_at',
		label: i18n.t('admin/users/user___laatste-toegang'),
		sortable: true,
		filterType: 'DateRangeDropdown',
	},
];

export const TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT: Partial<
	{
		[columnId in UserOverviewTableCol]: (order: Avo.Search.OrderDirection) => any;
	}
> = {
	first_name: (order: Avo.Search.OrderDirection) => ({
		first_name: order,
	}),
	last_name: (order: Avo.Search.OrderDirection) => ({
		last_name: order,
	}),
	mail: (order: Avo.Search.OrderDirection) => ({
		mail: order,
	}),
	// wait for https://meemoo.atlassian.net/browse/DEV-1128
	// user_group: (order: Avo.Search.OrderDirection) => ({
	// 	mail: order
	// }),
	oormerk: (order: Avo.Search.OrderDirection) => ({
		profile: { title: order }, // TODO change title to oormerk after task: https://meemoo.atlassian.net/browse/DEV-1062
	}),
	is_blocked: (order: Avo.Search.OrderDirection) => ({
		is_blocked: order,
	}),
	stamboek: (order: Avo.Search.OrderDirection) => ({
		profile: { stamboek: order },
	}),
	organisation: (order: Avo.Search.OrderDirection) => ({
		profile: { organisation: { name: order } },
	}),
	created_at: (order: Avo.Search.OrderDirection) => ({
		created_at: order,
	}),
	last_access_at: (order: Avo.Search.OrderDirection) => ({
		last_access_at: order,
	}),
};
