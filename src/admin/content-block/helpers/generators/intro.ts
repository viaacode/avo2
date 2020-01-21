import i18n from '../../../../shared/translations/i18n';

import {
	ContentBlockBackgroundColor,
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
	IntroBlockComponentState,
} from '../../content-block.types';
import {
	ALIGN_FIELD,
	CONTENT_BLOCK_FIELD_DEFAULTS,
	FORM_STATE_DEFAULTS,
	TEXT_FIELD,
} from './defaults';

export const INITIAL_INTRO_BLOCK_COMPONENT_STATE = (): IntroBlockComponentState => ({
	title: '',
	text: '',
	align: 'left',
});

export const INITIAL_INTRO_BLOCK_STATE = (position: number): DefaultContentBlockState =>
	FORM_STATE_DEFAULTS(ContentBlockBackgroundColor.White, ContentBlockType.Intro, position);

export const INTRO_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	name: i18n.t('admin/content-block/helpers/generators/intro___intro'),
	components: {
		state: INITIAL_INTRO_BLOCK_COMPONENT_STATE(),
		fields: {
			title: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/intro___titel-is-verplicht'),
				{
					label: i18n.t('admin/content-block/helpers/generators/intro___titel'),
					editorType: ContentBlockEditor.TextInput,
				}
			),
			align: ALIGN_FIELD(i18n.t('admin/content-block/helpers/generators/intro___titel-uitlijning')),
			text: TEXT_FIELD(),
		},
	},
	block: {
		state: INITIAL_INTRO_BLOCK_STATE(position),
		fields: CONTENT_BLOCK_FIELD_DEFAULTS(),
	},
});