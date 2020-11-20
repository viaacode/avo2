import { BlockEventbriteProps } from '@viaa/avo2-components';

import i18n from '../../../../shared/translations/i18n';
import { GET_ADMIN_ICON_OPTIONS } from '../../../shared/constants';
import {
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
} from '../../../shared/types';
import { GET_BUTTON_TYPE_OPTIONS } from '../../content-block.const';

import { ALIGN_FIELD, BLOCK_FIELD_DEFAULTS, BLOCK_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_EVENTBRITE_COMPONENTS_STATE = (): Partial<BlockEventbriteProps> => ({
	eventId: '',
	label: '',
});

export const INITIAL_EVENTBRITE_BLOCK_STATE = (): DefaultContentBlockState => ({
	...BLOCK_STATE_DEFAULTS({
		padding: {
			top: 'medium',
			bottom: 'large',
		},
	}),
});

export const EVENTBRITE_BLOCK_CONFIG = (position = 0): ContentBlockConfig => ({
	position,
	name: i18n.t('admin/content-block/helpers/generators/eventbrite___eventbrite'),
	type: ContentBlockType.Eventbrite,
	components: {
		state: INITIAL_EVENTBRITE_COMPONENTS_STATE(),
		fields: {
			eventId: TEXT_FIELD(undefined, {
				label: i18n.t('admin/content-block/helpers/generators/eventbrite___event-id'),
				editorType: ContentBlockEditor.TextInput,
			}),
			type: {
				label: i18n.t('admin/content-block/helpers/generators/buttons___type'),
				editorType: ContentBlockEditor.Select,
				editorProps: {
					options: GET_BUTTON_TYPE_OPTIONS(),
				},
			},
			label: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/buttons___knoptekst-is-verplicht'),
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
		},
	},
	block: {
		state: INITIAL_EVENTBRITE_BLOCK_STATE(),
		fields: {
			align: ALIGN_FIELD(),
			...BLOCK_FIELD_DEFAULTS(),
		},
	},
});
