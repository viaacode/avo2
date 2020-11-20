import { TabProps } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CheckboxDropdownModalProps, CheckboxOption } from '../../shared/components';
import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';
import { NULL_FILTER } from '../shared/helpers/filters';

import { ContentOverviewTableCols, ContentWidth } from './content.types';

export const RichEditorStateKey = 'RichEditorState';

export const GET_CONTENT_PAGE_OVERVIEW_COLUMNS: (
	contentTypeOptions: CheckboxOption[],
	userGroupOptions: CheckboxOption[],
	contentPageLabelOptions: CheckboxOption[]
) => FilterableColumn[] = (contentTypeOptions, userGroupOptions, contentPageLabelOptions) => [
	{
		id: 'title',
		label: i18n.t('admin/content/content___titel'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'content_type',
		label: i18n.t('admin/content/content___content-type'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: contentTypeOptions,
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'user_profile_id',
		label: i18n.t('admin/content/content___auteur'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'MultiUserSelectDropdown',
	},
	{
		id: 'author_user_group',
		label: i18n.t('admin/users/user___gebruikersgroep'),
		sortable: true,
		visibleByDefault: false,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: [
				...userGroupOptions,
				{ label: i18n.t('admin/content/content___leeg'), id: NULL_FILTER },
			],
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'created_at',
		label: i18n.t('admin/content/content___aangemaakt'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'updated_at',
		label: i18n.t('admin/content/content___laatst-bewerkt'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'is_public',
		label: i18n.t('admin/content/content___publiek'),
		sortable: true,
		visibleByDefault: false,
		filterType: 'BooleanCheckboxDropdown',
	},
	{
		id: 'published_at',
		label: i18n.t('admin/content/views/content-overview___publicatie'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'publish_at',
		label: i18n.t('admin/content/views/content-overview___publiceer-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'depublish_at',
		label: i18n.t('admin/content/views/content-overview___depubliceer-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'labels',
		label: i18n.t('admin/content/content___labels'),
		sortable: false,
		visibleByDefault: false,
		filterType: 'CheckboxDropdownModal',
		filterProps: {
			options: contentPageLabelOptions,
		} as CheckboxDropdownModalProps,
	},
	{
		id: 'user_group_ids',
		label: i18n.t('admin/content/content___zichtbaar-voor'),
		sortable: false,
		visibleByDefault: false,
	},
	{
		id: 'actions',
		tooltip: i18n.t('admin/content/views/content-overview___acties'),
		visibleByDefault: true,
	},
];

export const CONTENT_RESULT_PATH = {
	COUNT: 'app_content_aggregate',
	GET: 'data.app_content',
	INSERT: 'insert_app_content',
	UPDATE: 'update_app_content',
};

export const CONTENT_TYPES_LOOKUP_PATH = 'lookup_enum_content_types';

export const TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT: Partial<
	{
		[columnId in ContentOverviewTableCols]: (order: Avo.Search.OrderDirection) => any;
	}
> = {
	user_profile_id: (order: Avo.Search.OrderDirection) => ({
		profile: { usersByuserId: { first_name: order } },
	}),
	author_user_group: (order: Avo.Search.OrderDirection) => ({
		profile: { profile_user_group: { group: { label: order } } },
	}),
};

export const CONTENT_PATH = {
	CONTENT_PAGE_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}`,
	CONTENT_PAGE_CREATE: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}/${ROUTE_PARTS.create}`,
	CONTENT_PAGE_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}/:id`,
	CONTENT_PAGE_EDIT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}/:id/${ROUTE_PARTS.edit}`,
	PAGES: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}?content_type=PAGINA`,
	NEWS: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}?content_type=NIEUWS_ITEM`,
	FAQS: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}?content_type=FAQ_ITEM`,
	SCREENCASTS: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}?content_type=SCREENCAST`,
	PROJECTS: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}?content_type=PROJECT`,
	OVERVIEWS: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}?content_type=OVERZICHT`,
};

export const ITEMS_PER_PAGE = 10;

export const GET_CONTENT_DETAIL_TABS: () => TabProps[] = () => [
	{
		id: 'inhoud',
		label: i18n.t('admin/content/content___inhoud'),
		icon: 'layout',
	},
	{
		id: 'metadata',
		label: i18n.t('admin/content/content___metadata'),
		icon: 'file-text',
	},
];

export const GET_CONTENT_WIDTH_OPTIONS = () => [
	{
		label: i18n.t('admin/content/content___kies-een-content-breedte'),
		value: '',
		disabled: true,
	},
	{ label: i18n.t('admin/content/content___max-1300-px'), value: 'REGULAR' },
	{ label: i18n.t('admin/content/content___breed-940-px'), value: 'LARGE' },
	{ label: i18n.t('admin/content/content___medium-720-px'), value: 'MEDIUM' },
];

/* eslint-disable @typescript-eslint/no-unused-vars */
export const DEFAULT_PAGES_WIDTH: { [key in ContentWidth]: Avo.ContentPage.Type[] } = {
	[ContentWidth.REGULAR]: ['PROJECT'],
	[ContentWidth.LARGE]: [],
	[ContentWidth.MEDIUM]: ['NIEUWS_ITEM'],
};
/* eslint-enable @typescript-eslint/no-unused-vars */
