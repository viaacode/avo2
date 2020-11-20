import { ButtonType, SelectOption } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { CheckboxDropdownModalProps, CheckboxOption } from '../../shared/components';
import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';
import { NULL_FILTER } from '../shared/helpers/filters';

import { UserBulkAction, UserDeleteOption, UserOverviewTableCol } from './user.types';

export const USER_PATH = {
	USER_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.user}`,
	USER_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.user}/:id`,
	USER_EDIT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.user}/:id/${ROUTE_PARTS.edit}`,
};

export const ITEMS_PER_PAGE = 50;

export const GET_USER_OVERVIEW_TABLE_COLS: (
	userGroupOptions: CheckboxOption[],
	companyOptions: CheckboxOption[],
	businessCategoryOptions: CheckboxOption[]
) => FilterableColumn[] = (
	userGroupOptions: CheckboxOption[],
	companyOptions: CheckboxOption[],
	businessCategoryOptions: CheckboxOption[]
) => [
	{
		id: 'id',
		label: i18n.t('admin/users/user___id'),
		sortable: true,
		visibleByDefault: false,
	},
	{
		id: 'first_name',
		label: i18n.t('admin/users/user___voornaam'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'last_name',
		label: i18n.t('admin/users/user___achternaam'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'mail',
		label: i18n.t('admin/users/user___email'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'user_group',
		label: i18n.t('admin/users/user___gebruikersgroep'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: [
				...userGroupOptions,
				{ label: i18n.t('admin/users/user___leeg'), id: NULL_FILTER },
			],
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'business_category',
		label: i18n.t('admin/users/user___oormerk'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: [
				...businessCategoryOptions,
				{ label: i18n.t('admin/users/user___leeg'), id: NULL_FILTER },
			],
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'is_exception',
		label: i18n.t('admin/users/user___uitzonderingsaccount'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'BooleanCheckboxDropdown',
	},
	{
		id: 'is_blocked',
		label: i18n.t('admin/users/user___geblokkeerd'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'BooleanCheckboxDropdown',
	},
	{
		id: 'stamboek',
		label: i18n.t('admin/users/user___stamboek'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'BooleanCheckboxDropdown',
	},
	{
		id: 'organisation',
		label: i18n.t('admin/users/user___organisatie'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: [
				...companyOptions,
				{ label: i18n.t('admin/users/user___leeg'), id: NULL_FILTER },
			],
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'created_at',
		label: i18n.t('admin/users/user___gebruiker-sinds'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'last_access_at',
		label: i18n.t('admin/users/user___laatste-toegang'),
		sortable: true,
		visibleByDefault: true,
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
	user_group: (order: Avo.Search.OrderDirection) => ({
		profile: { profile_user_group: { group: { label: order } } },
	}),
	business_category: (order: Avo.Search.OrderDirection) => ({
		profile: { business_category: order },
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

type UserDeleteRadioOption = { label: string; value: UserDeleteOption };
export const GET_DELETE_RADIO_OPTIONS = (): UserDeleteRadioOption[] => {
	return [
		{
			label: i18n.t('admin/users/user___verwijder-alle-content'),
			value: 'DELETE_ALL',
		},
		{
			label: i18n.t('admin/users/user___anonimiseer-de-publieke-content-verwijder-de-rest'),
			value: 'ANONYMIZE_PUBLIC',
		},
		{
			label: i18n.t(
				'admin/users/user___verwijder-prive-content-behoud-publieke-content-met-de-naam-van-de-gebruiker'
			),
			value: 'DELETE_PRIVATE_KEEP_NAME',
		},
		{
			label: i18n.t(
				'admin/users/user___zet-publieke-content-over-naar-een-andere-gebruiker-verwijder-de-rest'
			),
			value: 'TRANSFER_PUBLIC',
		},
		{
			label: i18n.t('admin/users/user___zet-alle-content-over-naar-een-andere-gebruiker'),
			value: 'TRANSFER_ALL',
		},
	];
};

type UserBulkActionOption = SelectOption<UserBulkAction> & {
	confirm?: boolean;
	confirmButtonType?: ButtonType;
};
export const GET_USER_BULK_ACTIONS = (user: Avo.User.User | undefined): UserBulkActionOption[] => {
	if (!user) {
		return [];
	}
	const actions: UserBulkActionOption[] = [];

	if (PermissionService.hasPerm(user, PermissionName.DELETE_ANY_USER)) {
		actions.push({
			label: i18n.t('admin/users/user___blokkeren'),
			value: 'block',
		});
		actions.push({
			label: i18n.t('admin/users/user___deblokkeren'),
			value: 'unblock',
		});
		actions.push({
			label: i18n.t('admin/users/user___verwijderen'),
			value: 'delete',
		});
		actions.push({
			label: i18n.t('admin/users/user___vakken-aanpassen'),
			value: 'change_subjects',
		});
		actions.push({
			label: i18n.t('admin/users/user___exporteren'),
			value: 'export',
		});
	}

	return actions;
};
