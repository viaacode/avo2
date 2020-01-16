import i18n from '../../../../shared/translations/i18n';

import {
	ContentBlockBackgroundColor,
	ContentBlockConfig,
	ContentBlockType,
	DefaultContentBlockState,
	RichTextBlockComponentState,
} from '../../content-block.types';
import { CONTENT_BLOCK_FIELD_DEFAULTS, FORM_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_RICH_TEXT_BLOCK_COMPONENT_STATE = (): RichTextBlockComponentState => ({
	content: '',
});

export const INITIAL_RICH_TEXT_BLOCK_STATE = (position: number): DefaultContentBlockState =>
	FORM_STATE_DEFAULTS(ContentBlockBackgroundColor.White, ContentBlockType.RichText, position);

export const RICH_TEXT_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	name: i18n.t('admin/content-block/helpers/generators/rich-text___tekst'),
	components: {
		state: INITIAL_RICH_TEXT_BLOCK_COMPONENT_STATE(),
		fields: {
			content: TEXT_FIELD(),
		},
	},
	block: {
		state: INITIAL_RICH_TEXT_BLOCK_STATE(position),
		fields: CONTENT_BLOCK_FIELD_DEFAULTS(),
	},
});
