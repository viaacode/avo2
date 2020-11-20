import { TableColumn } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';

export const MENU_PATH = {
	MENU_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.menu}`,
	MENU_CREATE: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.menu}/${ROUTE_PARTS.create}`,
	MENU_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.menu}/:menu`,
	MENU_ITEM_CREATE: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.menu}/:menu/${ROUTE_PARTS.create}`,
	MENU_ITEM_EDIT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.menu}/:menu/:id/${ROUTE_PARTS.edit}`,
};

export const GET_MENU_OVERVIEW_TABLE_COLS: () => TableColumn[] = () => [
	{ id: 'placement', label: i18n.t('admin/menu/menu___naam') },
	{ id: 'description', label: i18n.t('admin/menu/menu___omschrijving') },
	{ id: 'actions', tooltip: i18n.t('admin/menu/menu___acties') },
];

export const INITIAL_MENU_FORM = (placement: string = ''): Partial<Avo.Menu.Menu> => ({
	placement,
	description: '',
	icon_name: '',
	label: '',
	content_type: null,
	content_path: null,
	link_target: '_self',
	user_group_ids: [],
	tooltip: '',
});

export const GET_PAGE_TYPES_LANG = () => ({
	create: i18n.t('admin/menu/menu___toevoegen'),
	edit: i18n.t('admin/menu/menu___aanpassen'),
});
