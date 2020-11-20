import { CheckboxProps } from '@viaa/avo2-components';

import { WYSIWYG_OPTIONS_FULL } from '../../../../shared/constants';
import i18n from '../../../../shared/translations/i18n';
import {
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
	RichTextBlockComponentState,
} from '../../../shared/types';

import { BLOCK_FIELD_DEFAULTS, BLOCK_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_RICH_TEXT_COMPONENTS_STATE = (): RichTextBlockComponentState => ({
	content: '',
	contentRichEditorState: undefined,
});

export const INITIAL_RICH_TEXT_BLOCK_STATE = (): DefaultContentBlockState =>
	BLOCK_STATE_DEFAULTS({
		padding: {
			top: 'top-small',
			bottom: 'bottom-small',
		},
	});

export const RICH_TEXT_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	position,
	name: i18n.t('admin/content-block/helpers/generators/rich-text___tekst'),
	type: ContentBlockType.RichText,
	components: {
		limits: {
			max: 1,
		},
		state: INITIAL_RICH_TEXT_COMPONENTS_STATE(),
		fields: {
			content: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/rich-text___tekst-is-verplicht'),
				{
					editorProps: {
						controls: [...WYSIWYG_OPTIONS_FULL, 'media'],
						fileType: 'CONTENT_BLOCK_IMAGE',
					},
				}
			),
		},
	},
	block: {
		state: INITIAL_RICH_TEXT_BLOCK_STATE(),
		fields: {
			limitWidth: {
				editorType: ContentBlockEditor.Checkbox,
				editorProps: {
					label: i18n.t(
						'admin/content-block/helpers/generators/rich-text___limiteer-breedte-tot-800-px'
					),
				} as CheckboxProps,
			},
			...BLOCK_FIELD_DEFAULTS(),
		},
	},
});
