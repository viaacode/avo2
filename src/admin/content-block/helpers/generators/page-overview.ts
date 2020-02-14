import { MultiRangeProps } from '@viaa/avo2-components/dist/components/MultiRange/MultiRange';

import i18n from '../../../../shared/translations/i18n';
import {
	PAGE_OVERVIEW_ITEM_STYLE_OPTIONS,
	PAGE_OVERVIEW_TAB_STYLE_OPTIONS,
} from '../../content-block.const';
import {
	ContentBlockBackgroundColor,
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
	PageOverviewBlockComponentStateFields,
} from '../../content-block.types';

import {
	CONTENT_BLOCK_FIELD_DEFAULTS,
	CONTENT_TYPE_AND_LABELS_INPUT,
	FORM_STATE_DEFAULTS,
} from './defaults';

export const INITIAL_PAGE_OVERVIEW_BLOCK_COMPONENT_STATE = (): PageOverviewBlockComponentStateFields => ({
	tabs: [],
	tabStyle: 'MENU_BAR',
	allowMultiple: false,
	contentType: 'PROJECT', // lookup options in lookup.enum_content_types
	itemStyle: 'LIST',
	showTitle: true,
	showDescription: true,
	showDate: false,
	buttonLabel: i18n.t('Lees meer'),
	itemsPerPage: 20,
});

export const INITIAL_PAGE_OVERVIEW_BLOCK_STATE = (position: number): DefaultContentBlockState => {
	return {
		...FORM_STATE_DEFAULTS(
			ContentBlockBackgroundColor.White,
			ContentBlockType.PageOverview,
			position
		),
	};
};

export const PAGE_OVERVIEW_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => {
	return {
		name: i18n.t('Pagina overzicht'),
		type: ContentBlockType.PageOverview,
		components: {
			state: INITIAL_PAGE_OVERVIEW_BLOCK_COMPONENT_STATE(),
			fields: {
				contentTypeAndTabs: CONTENT_TYPE_AND_LABELS_INPUT({
					label: i18n.t(
						'Type van de paginas die je wil weergeven. Optioneel kan je deze ook indelen per categorie'
					),
				}),
				tabStyle: {
					label: i18n.t('Menu type'),
					editorType: ContentBlockEditor.Select,
					editorProps: {
						options: PAGE_OVERVIEW_TAB_STYLE_OPTIONS,
					},
				},
				allowMultiple: {
					label: i18n.t('Mag meerdere menu items selecteren'),
					editorType: ContentBlockEditor.Checkbox,
				},
				itemStyle: {
					label: i18n.t('Item type'),
					editorType: ContentBlockEditor.Select,
					editorProps: {
						options: PAGE_OVERVIEW_ITEM_STYLE_OPTIONS,
					},
				},
				showTitle: {
					label: i18n.t('Toon de titel'),
					editorType: ContentBlockEditor.Checkbox,
				},
				showDescription: {
					label: i18n.t('Toon de Beschrijving'),
					editorType: ContentBlockEditor.Checkbox,
				},
				showDate: {
					label: i18n.t('Toon de datum en categorie'),
					editorType: ContentBlockEditor.Checkbox,
				},
				buttonLabel: {
					label: i18n.t('Label voor de button (Lijst item)'),
					editorType: ContentBlockEditor.TextInput,
				},
				itemsPerPage: {
					label: i18n.t('Items per pagina'),
					editorType: ContentBlockEditor.MultiRange,
					editorProps: {
						min: 1,
						max: 1000,
						step: 1,
					} as MultiRangeProps,
				},
			},
		},
		block: {
			state: INITIAL_PAGE_OVERVIEW_BLOCK_STATE(position),
			fields: {
				...CONTENT_BLOCK_FIELD_DEFAULTS(),
			},
		},
	};
};
