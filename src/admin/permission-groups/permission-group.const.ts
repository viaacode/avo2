import { TableColumn } from '@viaa/avo2-components';

import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';

export const PERMISSION_GROUP_PATH = {
	PERMISSION_GROUP_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.permissionGroups}`,
	PERMISSION_GROUP_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.permissionGroups}/:id`,
	PERMISSION_GROUP_CREATE: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.permissionGroups}/${ROUTE_PARTS.create}`,
	PERMISSION_GROUP_EDIT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.permissionGroups}/:id/${ROUTE_PARTS.edit}`,
};

export const ITEMS_PER_PAGE = 10;

export const GET_PERMISSION_GROUP_OVERVIEW_TABLE_COLS: () => FilterableColumn[] = () => [
	{
		id: 'label',
		label: i18n.t('admin/permission-groups/permission-group___naam'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'description',
		label: i18n.t('admin/permission-groups/permission-group___beschrijving'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'created_at',
		label: i18n.t('admin/permission-groups/permission-group___gemaakt-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'updated_at',
		label: i18n.t('admin/permission-groups/permission-group___aangepast-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'actions',
		tooltip: i18n.t('admin/permission-groups/permission-group___acties'),
		visibleByDefault: true,
	},
];

export const GET_PERMISSIONS_TABLE_COLS: () => TableColumn[] = () => [
	{
		id: 'label',
		label: i18n.t('admin/permission-groups/permission-group___permissie-code'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'description',
		label: i18n.t('admin/permission-groups/permission-group___permissie-beschrijving'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'actions',
		tooltip: i18n.t('admin/permission-groups/permission-group___acties'),
		visibleByDefault: true,
	},
];
