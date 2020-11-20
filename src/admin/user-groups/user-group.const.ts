import { TableColumn } from '@viaa/avo2-components';

import { SpecialPermissionGroups } from '../../authentication/authentication.types';
import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';

import { UserGroup } from './user-group.types';

export const USER_GROUP_PATH = {
	USER_GROUP_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.userGroup}`,
	USER_GROUP_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.userGroup}/:id`,
	USER_GROUP_CREATE: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.userGroup}/${ROUTE_PARTS.create}`,
	USER_GROUP_EDIT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.userGroup}/:id/${ROUTE_PARTS.edit}`,
};

export const ITEMS_PER_PAGE = 20;

export const SPECIAL_USER_GROUPS: Partial<UserGroup>[] = [
	{
		label: i18n.t(
			'admin/menu/components/menu-edit-form/menu-edit-form___niet-ingelogde-gebruikers'
		),
		id: SpecialPermissionGroups.loggedOutUsers,
	},
	{
		label: i18n.t('admin/menu/components/menu-edit-form/menu-edit-form___ingelogde-gebruikers'),
		id: SpecialPermissionGroups.loggedInUsers,
	},
];

export const GET_USER_GROUP_OVERVIEW_TABLE_COLS: () => FilterableColumn[] = () => [
	{
		id: 'label',
		label: i18n.t('admin/user-groups/user-group___label'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'description',
		label: i18n.t('admin/user-groups/user-group___beschrijving'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'created_at',
		label: i18n.t('admin/user-groups/user-group___aangemaakt-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'updated_at',
		label: i18n.t('admin/user-groups/user-group___aangepast-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'actions',
		tooltip: i18n.t('admin/user-groups/user-group___acties'),
		visibleByDefault: true,
	},
];

export const GET_PERMISSION_GROUP_TABLE_COLS: () => TableColumn[] = () => [
	{
		id: 'label',
		label: i18n.t('admin/user-groups/user-group___label'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'description',
		label: i18n.t('admin/user-groups/user-group___beschrijving'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'created_at',
		label: i18n.t('admin/user-groups/user-group___aangemaakt-op'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'updated_at',
		label: i18n.t('admin/user-groups/user-group___aangepast-op'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'actions',
		tooltip: i18n.t('admin/user-groups/user-group___acties'),
		visibleByDefault: true,
	},
];

export enum SpecialUserGroup {
	Admin = 1,
	Teacher = 2,
	TeacherSecondary = 3,
	Pupil = 4,
}
