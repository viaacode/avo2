import { ROUTE_PARTS } from '../../shared/constants';
import { generateRandomId } from '../../shared/helpers/uuid';
import i18n from '../../shared/translations/i18n';
import { FilterableColumn } from '../shared/components/FilterTable/FilterTable';

import { EditableInteractiveTour } from './interactive-tour.types';

export const INTERACTIVE_TOUR_PATH = {
	INTERACTIVE_TOUR_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.interactiveTours}`,
	INTERACTIVE_TOUR_CREATE: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.interactiveTours}/${ROUTE_PARTS.create}`,
	INTERACTIVE_TOUR_EDIT: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.interactiveTours}/:id/${ROUTE_PARTS.edit}`,
	INTERACTIVE_TOUR_DETAIL: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.interactiveTours}/:id/${ROUTE_PARTS.detail}`,
};

export const ITEMS_PER_PAGE = 10;

export const GET_INTERACTIVE_TOUR_OVERVIEW_TABLE_COLS: () => FilterableColumn[] = () => [
	{
		id: 'name',
		label: i18n.t('admin/interactive-tour/interactive-tour___naam'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'page_id',
		label: i18n.t('admin/interactive-tour/interactive-tour___pagina'),
		sortable: true,
		visibleByDefault: true,
	},
	{
		id: 'created_at',
		label: i18n.t('admin/interactive-tour/interactive-tour___aangemaakt-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'updated_at',
		label: i18n.t('admin/interactive-tour/interactive-tour___aangepast-op'),
		sortable: true,
		visibleByDefault: true,
		filterType: 'DateRangeDropdown',
	},
	{
		id: 'actions',
		tooltip: i18n.t('admin/interactive-tour/interactive-tour___acties'),
		visibleByDefault: true,
	},
];

export function getInitialInteractiveTour(): EditableInteractiveTour {
	return {
		name: '',
		page_id: '',
		steps: [
			{
				target: '',
				title: '',
				content: '',
				contentState: undefined,
				id: generateRandomId(),
			},
		],
	};
}

export const MAX_STEP_TITLE_LENGTH = 28;
export const MAX_STEP_TEXT_LENGTH = 200;
