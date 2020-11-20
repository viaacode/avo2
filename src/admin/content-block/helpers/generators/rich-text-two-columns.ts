import { WYSIWYG_OPTIONS_FULL } from '../../../../shared/constants';
import i18n from '../../../../shared/translations/i18n';
import { GET_ADMIN_ICON_OPTIONS } from '../../../shared/constants';
import {
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockFieldGroup,
	ContentBlockType,
	DefaultContentBlockState,
	DEFAULT_BUTTON_PROPS,
	RichTextBlockComponentState,
} from '../../../shared/types';
import { GET_BUTTON_TYPE_OPTIONS } from '../../content-block.const';

import { BLOCK_FIELD_DEFAULTS, BLOCK_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_RICH_TEXT_TWO_COLUMNS_COMPONENTS_STATE = (): RichTextBlockComponentState[] => [
	{
		content: '',
		contentRichEditorState: undefined,
		buttons: [],
	},
	{
		content: '',
		contentRichEditorState: undefined,
		buttons: [],
	},
];

export const INITIAL_RICH_TEXT_TWO_COLUMNS_BLOCK_STATE = (): DefaultContentBlockState =>
	BLOCK_STATE_DEFAULTS({
		padding: {
			top: 'top-small',
			bottom: 'bottom-small',
		},
	});

export const RICH_TEXT_TWO_COLUMNS_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	position,
	name: i18n.t('admin/content-block/helpers/generators/rich-text-two-columns___tekst-2-kolommen'),
	type: ContentBlockType.RichTextTwoColumns,
	components: {
		name: i18n.t('admin/content-block/helpers/generators/rich-text-two-columns___kolom'),
		limits: {
			min: 2,
			max: 2,
		},
		state: INITIAL_RICH_TEXT_TWO_COLUMNS_COMPONENTS_STATE(),
		fields: {
			content: {
				...TEXT_FIELD(
					i18n.t(
						'admin/content-block/helpers/generators/rich-text-two-columns___tekst-is-verplicht'
					),
					{
						editorProps: {
							controls: [...WYSIWYG_OPTIONS_FULL, 'media'],
							fileType: 'CONTENT_BLOCK_IMAGE',
						},
					}
				),
			},
			buttons: {
				label: i18n.t(
					'admin/content-block/helpers/generators/rich-text-two-columns___knop'
				),
				fields: {
					type: {
						label: i18n.t('admin/content-block/helpers/generators/buttons___type'),
						editorType: ContentBlockEditor.Select,
						editorProps: {
							options: GET_BUTTON_TYPE_OPTIONS(),
						},
					},
					label: TEXT_FIELD(
						i18n.t(
							'admin/content-block/helpers/generators/buttons___knoptekst-is-verplicht'
						),
						{
							label: i18n.t('admin/content-block/helpers/generators/buttons___tekst'),
							editorType: ContentBlockEditor.TextInput,
						}
					),
					icon: {
						label: i18n.t('admin/content-block/helpers/generators/buttons___icoon'),
						editorType: ContentBlockEditor.IconPicker,
						editorProps: {
							options: GET_ADMIN_ICON_OPTIONS(),
						},
					},
					buttonAction: {
						label: i18n.t(
							'admin/content-block/helpers/generators/buttons___knop-actie'
						),
						editorType: ContentBlockEditor.ContentPicker,
					},
				},
				type: 'fieldGroup',
				min: 0,
				max: 10,
				repeat: {
					defaultState: DEFAULT_BUTTON_PROPS,
					addButtonLabel: i18n.t(
						'admin/content-block/helpers/generators/rich-text-two-columns___voeg-knop-toe'
					),
					deleteButtonLabel: i18n.t(
						'admin/content-block/helpers/generators/rich-text-two-columns___verwijder-knop'
					),
				},
			} as ContentBlockFieldGroup,
		},
	},
	block: {
		state: INITIAL_RICH_TEXT_TWO_COLUMNS_BLOCK_STATE(),
		fields: BLOCK_FIELD_DEFAULTS(),
	},
});
