import i18n from '../../../../shared/translations/i18n';
import {
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
	IntroBlockComponentState,
} from '../../../shared/types';

import { ALIGN_FIELD, BLOCK_FIELD_DEFAULTS, BLOCK_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_INTRO_COMPONENTS_STATE = (): IntroBlockComponentState => ({
	title: '',
	content: '',
	align: 'center',
});

export const INITIAL_INTRO_BLOCK_STATE = (position: number): DefaultContentBlockState =>
	BLOCK_STATE_DEFAULTS(ContentBlockType.Intro, position);

export const INTRO_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	name: i18n.t('admin/content-block/helpers/generators/intro___intro'),
	type: ContentBlockType.Intro,
	components: {
		state: INITIAL_INTRO_COMPONENTS_STATE(),
		fields: {
			title: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/intro___titel-is-verplicht'),
				{
					label: i18n.t('admin/content-block/helpers/generators/intro___titel'),
					editorType: ContentBlockEditor.TextInput,
				}
			),
			content: TEXT_FIELD(),
			align: ALIGN_FIELD(
				i18n.t('admin/content-block/helpers/generators/intro___titel-uitlijning')
			),
		},
	},
	block: {
		state: INITIAL_INTRO_BLOCK_STATE(position),
		fields: BLOCK_FIELD_DEFAULTS(),
	},
});
