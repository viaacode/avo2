import { TabProps } from '@viaa/avo2-components';

import { ROUTE_PARTS } from '../../shared/constants';
import { TableColumn } from '../../shared/types';
import { ContentEditFormState } from './content.types';
import { fetchContent } from './helpers/content-types';

export const CONTENT_RESULT_PATH = {
	GET: 'app_content',
	INSERT: 'insert_app_content',
	UPDATE: 'update_app_content',
};

export const CONTENT_TYPES_LOOKUP_PATH = 'lookup_enum_content_types';

export const CONTENT_PATH = {
	CONTENT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}`,
	CONTENT_CREATE: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}/${ROUTE_PARTS.create}`,
	CONTENT_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}/:id`,
	CONTENT_EDIT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.content}/:id/${ROUTE_PARTS.edit}`,
};

export const CONTENT_OVERVIEW_TABLE_COLS: TableColumn[] = [
	{ id: 'title', label: 'Titel' },
	{ id: 'content_type', label: 'Content type' },
	{ id: 'author', label: 'Auteur' },
	{ id: 'role', label: 'Rol' },
	{ id: 'publish_at', label: 'Publicatiedatum' },
	{ id: 'depublish_at', label: 'Depublicatiedatum' },
	{ id: 'created_at', label: 'Aangemaakt' },
	{ id: 'updated_at', label: 'Laatst bewerkt' },
	{ id: 'actions', label: '' },
];

export const INITIAL_CONTENT_FORM = (): ContentEditFormState => ({
	title: '',
	description: '',
	contentType: '',
	publishAt: '',
	depublishAt: '',
});

export const CONTENT_DETAIL_TABS: TabProps[] = [
	{
		id: 'inhoud',
		label: 'Inhoud',
		icon: 'layout',
	},
	{
		id: 'metadata',
		label: 'Metadata',
		icon: 'file-text',
	},
];

export const CONTENT_TYPES = [
	// {
	// 	value: 'collection',
	// 	label: 'Collectie',
	// 	disabled: false,
	// 	fetch: TODO,
	// },
	// {
	// 	value: 'item',
	// 	label: 'Item',
	// 	disabled: false,
	// 	fetch: TODO,
	// },
	// {
	// 	value: 'bundel',
	// 	label: 'Bundel',
	// 	disabled: false,
	// 	fetch: TODO,
	// },
	{
		value: 'content',
		label: 'Content',
		disabled: false,
		fetch: fetchContent,
	},
	// {
	// 	value: 'static',
	// 	label: "Statische Pagina's",
	// 	disabled: false,
	// 	fetch: TODO,
	// },
];
