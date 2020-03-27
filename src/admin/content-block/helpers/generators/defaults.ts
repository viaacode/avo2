import { isEmpty, isNil } from 'lodash-es';

import i18n from '../../../../shared/translations/i18n';

import {
	BackgroundColorOption,
	ContentBlockEditor,
	ContentBlockField,
	ContentBlockType,
	PaddingFieldState,
} from '../../../shared/types';

import { GET_ALIGN_OPTIONS, GET_BACKGROUND_COLOR_OPTIONS } from '../../content-block.const';

// Block config defaults
export const BLOCK_STATE_DEFAULTS = (
	blockType: ContentBlockType,
	position: number,
	backgroundColor: BackgroundColorOption = BackgroundColorOption.White,
	padding: PaddingFieldState = {
		top: 'top',
		bottom: 'bottom',
	}
) => ({
	blockType,
	position,
	backgroundColor,
	padding,
});

export const BLOCK_FIELD_DEFAULTS = () => ({
	backgroundColor: BACKGROUND_COLOR_FIELD(),
	padding: PADDING_FIELD(),
});

// Recurring fields
export const BACKGROUND_COLOR_FIELD = (
	label: string = i18n.t('admin/content-block/helpers/generators/defaults___achtergrondkleur')
) => ({
	label,
	editorType: ContentBlockEditor.ColorSelect,
	editorProps: {
		options: GET_BACKGROUND_COLOR_OPTIONS,
		defaultValue: GET_BACKGROUND_COLOR_OPTIONS()[0],
	},
});

export const PADDING_FIELD = (
	label = i18n.t('admin/content-block/helpers/generators/defaults___padding')
) => ({
	label,
	editorType: ContentBlockEditor.PaddingSelect,
});

export const ALIGN_FIELD = (
	label: string = i18n.t('admin/content-block/helpers/generators/defaults___uitlijning')
) => ({
	label,
	editorType: ContentBlockEditor.AlignSelect,
	editorProps: {
		options: GET_ALIGN_OPTIONS,
	},
});

export const TEXT_FIELD = (
	emptyFieldValidatorMessage = i18n.t(
		'admin/content-block/helpers/generators/defaults___tekst-is-verplicht'
	),
	propOverride?: Partial<ContentBlockField>
) => ({
	label: i18n.t('admin/content-block/helpers/generators/defaults___tekst'),
	editorType: ContentBlockEditor.WYSIWYG,
	validator: (value: string) => {
		const errorArray: string[] = [];

		if (isNil(value) || isEmpty(value)) {
			errorArray.push(emptyFieldValidatorMessage);
		}

		return errorArray;
	},
	...propOverride,
});

export const FILE_FIELD = (
	emptyFieldValidatorMessage = i18n.t(
		'admin/content-block/helpers/generators/defaults___een-bestand-is-verplicht'
	),
	propOverride?: Partial<ContentBlockField>
) => ({
	label: i18n.t('admin/content-block/helpers/generators/defaults___bestand'),
	editorType: ContentBlockEditor.FileUpload,
	validator: (value: string) => {
		const errorArray: string[] = [];

		if (isNil(value) || isEmpty(value)) {
			errorArray.push(emptyFieldValidatorMessage);
		}

		return errorArray;
	},
	editorProps: { type: 'CONTENT_PAGE_IMAGE' },
	...propOverride,
});

export const CONTENT_TYPE_AND_LABELS_INPUT = (propOverride?: Partial<ContentBlockField>) => ({
	label: i18n.t('admin/content-block/helpers/generators/defaults___type-en-labels'),
	editorType: ContentBlockEditor.ContentTypeAndLabelsPicker,
	validator: () => [],
	...propOverride,
});
