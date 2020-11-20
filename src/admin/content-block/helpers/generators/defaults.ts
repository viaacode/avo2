import { isEmpty, isNil } from 'lodash-es';

import { SelectOption } from '@viaa/avo2-components';

import { FileUploadProps } from '../../../../shared/components/FileUpload/FileUpload';
import { WYSIWYGWrapperProps } from '../../../../shared/components/WYSIWYGWrapper/WYSIWYGWrapper';
import { WYSIWYG_OPTIONS_FULL_WITHOUT_ALIGN } from '../../../../shared/constants';
import i18n from '../../../../shared/translations/i18n';
import { UserGroupSelectProps } from '../../../shared/components';
import {
	Color,
	ContentBlockEditor,
	ContentBlockField,
	DefaultContentBlockState,
	PaddingFieldState,
} from '../../../shared/types';
import {
	GET_ALIGN_OPTIONS,
	GET_BACKGROUND_COLOR_OPTIONS,
	GET_FOREGROUND_COLOR_OPTIONS,
} from '../../content-block.const';

// Block config defaults
export const BLOCK_STATE_DEFAULTS = (
	state: Partial<DefaultContentBlockState> = {}
): DefaultContentBlockState => {
	return {
		backgroundColor: state.backgroundColor || Color.Transparent,
		headerBackgroundColor: state.headerBackgroundColor || Color.Transparent,
		padding:
			state.padding ||
			({
				top: 'small',
				bottom: 'small',
			} as PaddingFieldState),
		margin:
			state.margin ||
			({
				top: 'none',
				bottom: 'none',
			} as PaddingFieldState),
		userGroupIds: state.userGroupIds || [],
	};
};

export const BLOCK_FIELD_DEFAULTS = () => ({
	backgroundColor: BACKGROUND_COLOR_FIELD(),
	padding: PADDING_FIELD(),
	margin: PADDING_FIELD(i18n.t('admin/content-block/helpers/generators/defaults___marge')),
	userGroupIds: USER_GROUP_SELECT(),

	// Used to link to this block from inside the same page using the anchors-block
	anchor: INPUT_FIELD({
		label: i18n.t('admin/content-block/helpers/generators/defaults___anchor-id'),
	}),
});

// Recurring fields
export const FOREGROUND_COLOR_FIELD = (
	label: string = i18n.t('admin/content-block/helpers/generators/defaults___tekst-kleur'),
	defaultValue?: SelectOption<Color>
): ContentBlockField => ({
	label,
	editorType: ContentBlockEditor.ColorSelect,
	editorProps: {
		options: GET_FOREGROUND_COLOR_OPTIONS(),
		defaultValue: defaultValue || GET_FOREGROUND_COLOR_OPTIONS()[0],
	},
});

export const BACKGROUND_COLOR_FIELD = (
	label: string = i18n.t('admin/content-block/helpers/generators/defaults___achtergrondkleur'),
	defaultValue?: SelectOption<Color>
): ContentBlockField => ({
	label,
	editorType: ContentBlockEditor.ColorSelect,
	editorProps: {
		options: GET_BACKGROUND_COLOR_OPTIONS(),
		defaultValue: defaultValue || GET_BACKGROUND_COLOR_OPTIONS()[0],
	},
});

export const PADDING_FIELD = (
	label = i18n.t('admin/content-block/helpers/generators/defaults___padding')
): ContentBlockField => ({
	label,
	editorType: ContentBlockEditor.PaddingSelect,
});

export const USER_GROUP_SELECT = (
	label = i18n.t('admin/content-block/helpers/generators/defaults___zichtbaar-voor')
): ContentBlockField => ({
	label,
	editorType: ContentBlockEditor.UserGroupSelect,
	editorProps: {
		placeholder: i18n.t(
			'admin/content-block/helpers/generators/defaults___iedereen-met-toegang-tot-de-pagina'
		),
	} as UserGroupSelectProps,
});

export const ALIGN_FIELD = (
	label: string = i18n.t('admin/content-block/helpers/generators/defaults___uitlijning')
): ContentBlockField => ({
	label,
	editorType: ContentBlockEditor.AlignSelect,
	editorProps: {
		options: GET_ALIGN_OPTIONS(),
	},
});

export const TEXT_FIELD = (
	emptyFieldValidatorMessage = i18n.t(
		'admin/content-block/helpers/generators/defaults___tekst-is-verplicht'
	),
	propOverride?: Partial<ContentBlockField>
): ContentBlockField => ({
	label: i18n.t('admin/content-block/helpers/generators/defaults___tekst'),
	editorType: ContentBlockEditor.WYSIWYG,
	validator: (value: string) => {
		const errorArray: string[] = [];

		if (isNil(value) || isEmpty(value)) {
			errorArray.push(emptyFieldValidatorMessage);
		}

		return errorArray;
	},
	editorProps: {
		controls: [...WYSIWYG_OPTIONS_FULL_WITHOUT_ALIGN, 'media'],
		fileType: 'CONTENT_BLOCK_IMAGE',
	} as Partial<WYSIWYGWrapperProps>,
	...propOverride,
});

export const INPUT_FIELD = (propOverride?: Partial<ContentBlockField>): ContentBlockField => ({
	label: i18n.t('admin/content-block/helpers/generators/defaults___tekst'),
	editorType: ContentBlockEditor.TextInput,
	...propOverride,
});

export const FILE_FIELD = (
	emptyFieldValidatorMessage = i18n.t(
		'admin/content-block/helpers/generators/defaults___een-bestand-is-verplicht'
	),
	propOverride?: Partial<ContentBlockField>
): ContentBlockField => ({
	label: i18n.t('admin/content-block/helpers/generators/defaults___bestand'),
	editorType: ContentBlockEditor.FileUpload,
	validator: (value: string) => {
		const errorArray: string[] = [];

		if (isNil(value) || isEmpty(value)) {
			errorArray.push(emptyFieldValidatorMessage);
		}

		return errorArray;
	},
	editorProps: { assetType: 'CONTENT_BLOCK_IMAGE' } as FileUploadProps,
	...propOverride,
});

export const ITEM_PICKER_FIELD = (
	emptyFieldValidatorMessage = i18n.t(
		'admin/content-block/helpers/generators/defaults___selecteren-van-video-item-is-verplicht'
	),
	propOverride?: Partial<ContentBlockField>
): ContentBlockField => ({
	label: i18n.t('admin/content-block/helpers/generators/media-player___video-of-audio-item'),
	editorType: ContentBlockEditor.ContentPicker,
	validator: (value: string) => {
		const errorArray: string[] = [];

		if (isNil(value) || isEmpty(value)) {
			errorArray.push(emptyFieldValidatorMessage);
		}

		return errorArray;
	},
	editorProps: {
		allowedTypes: ['ITEM'],
		hideTargetSwitch: true,
	},
	...propOverride,
});

export const CONTENT_TYPE_AND_LABELS_INPUT = (
	propOverride?: Partial<ContentBlockField>
): ContentBlockField => ({
	label: i18n.t('admin/content-block/helpers/generators/defaults___type-en-labels'),
	editorType: ContentBlockEditor.ContentTypeAndLabelsPicker,
	validator: undefined,
	...propOverride,
});
