import i18n from '../../../../shared/translations/i18n';

import {
	AccordionsBlockComponentState,
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
} from '../../../shared/types';
import { BLOCK_FIELD_DEFAULTS, BLOCK_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

const EMPTY_ACCORDION: AccordionsBlockComponentState = {
	title: '',
	content: '',
};

export const INITIAL_ACCORDIONS_COMPONENTS_STATE = (): AccordionsBlockComponentState[] => [
	EMPTY_ACCORDION,
];

export const INITIAL_ACCORDIONS_BLOCK_STATE = (position: number): DefaultContentBlockState =>
	BLOCK_STATE_DEFAULTS(ContentBlockType.Accordions, position);

export const ACCORDIONS_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	name: i18n.t('admin/content-block/helpers/generators/accordions___accordeons'),
	type: ContentBlockType.Accordions,
	components: {
		name: i18n.t('admin/content-block/helpers/generators/accordions___accordeon'),
		limits: {
			min: 1,
			max: 8,
		},
		state: INITIAL_ACCORDIONS_COMPONENTS_STATE(),
		fields: {
			title: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/defaults___tekst-is-verplicht'),
				{
					label: i18n.t('admin/content-block/helpers/generators/accordions___titel'),
					editorType: ContentBlockEditor.TextInput,
				}
			),
			content: TEXT_FIELD(),
		},
	},
	block: {
		state: INITIAL_ACCORDIONS_BLOCK_STATE(position),
		fields: BLOCK_FIELD_DEFAULTS(),
	},
});
