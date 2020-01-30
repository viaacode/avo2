import i18n from '../../../../shared/translations/i18n';

import {
	ContentBlockBackgroundColor,
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
	IFrameBlockComponentState,
} from '../../content-block.types';
import { CONTENT_BLOCK_FIELD_DEFAULTS, FORM_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_IFRAME_BLOCK_COMPONENT_STATE = (): IFrameBlockComponentState => ({
	title: '',
	src: '',
});

export const INITIAL_IFRAME_BLOCK_STATE = (position: number): DefaultContentBlockState =>
	FORM_STATE_DEFAULTS(ContentBlockBackgroundColor.White, ContentBlockType.IFrame, position);

export const IFRAME_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	name: i18n.t('admin/content-block/helpers/generators/iframe___i-frame'),
	components: {
		state: INITIAL_IFRAME_BLOCK_COMPONENT_STATE(),
		fields: {
			title: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/iframe___titel-is-verplicht'),
				{
					label: i18n.t('admin/content-block/helpers/generators/iframe___titel'),
					editorType: ContentBlockEditor.TextInput,
				}
			),
			src: TEXT_FIELD(i18n.t('admin/content-block/helpers/generators/iframe___url-is-verplicht'), {
				label: i18n.t('admin/content-block/helpers/generators/iframe___url'),
				editorType: ContentBlockEditor.TextInput,
			}),
		},
	},
	block: {
		state: INITIAL_IFRAME_BLOCK_STATE(position),
		fields: CONTENT_BLOCK_FIELD_DEFAULTS(),
	},
});
