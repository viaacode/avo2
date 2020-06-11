import { BlockHeroProps } from '@viaa/avo2-components';

import { FileUploadProps } from '../../../../shared/components/FileUpload/FileUpload';
import { PHOTO_TYPES, VIDEO_TYPES } from '../../../../shared/helpers/files';
import i18n from '../../../../shared/translations/i18n';
import { GET_ADMIN_ICON_OPTIONS } from '../../../shared/constants';
import {
	Color,
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockFieldGroup,
	ContentBlockType,
	DEFAULT_BUTTON_PROPS,
	DefaultContentBlockState,
} from '../../../shared/types';
import { GET_BUTTON_TYPE_OPTIONS } from '../../content-block.const';

import {
	BLOCK_FIELD_DEFAULTS,
	BLOCK_STATE_DEFAULTS,
	FILE_FIELD,
	FOREGROUND_COLOR_FIELD,
	TEXT_FIELD,
} from './defaults';

export const INITIAL_HERO_COMPONENTS_STATE = (): Partial<BlockHeroProps> => ({
	title: '',
	titleColor: Color.White,
	content: '',
	contentColor: Color.White,
	altText: '',
	buttons: [],
});

export const INITIAL_HERO_BLOCK_STATE = (): DefaultContentBlockState => ({
	...BLOCK_STATE_DEFAULTS({
		padding: {
			top: 'none',
			bottom: 'none',
		},
	}),
	backgroundColor: Color.NightBlue,
});

export const HERO_BLOCK_CONFIG = (position: number = 0): ContentBlockConfig => ({
	position,
	name: i18n.t('admin/content-block/helpers/generators/hero___hero'),
	type: ContentBlockType.Hero,
	components: {
		state: INITIAL_HERO_COMPONENTS_STATE(),
		fields: {
			title: TEXT_FIELD('', {
				label: i18n.t('admin/content-block/helpers/generators/hero___titel'),
				editorType: ContentBlockEditor.TextInput,
				validator: undefined,
			}),
			titleColor: FOREGROUND_COLOR_FIELD(
				i18n.t('admin/content-block/helpers/generators/hero___titel-kleur')
			),
			content: TEXT_FIELD('', {
				label: i18n.t('admin/content-block/helpers/generators/hero___beschrijving'),
				editorType: ContentBlockEditor.TextArea,
				validator: undefined,
			}),
			contentColor: FOREGROUND_COLOR_FIELD(
				i18n.t('admin/content-block/helpers/generators/hero___beschrijving-kleur')
			),

			buttons: {
				label: i18n.t('admin/content-block/helpers/generators/hero___knop'),
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

			src: FILE_FIELD(undefined, {
				label: i18n.t('admin/content-block/helpers/generators/hero___eigen-video-uploaden'),
				validator: undefined,
				editorProps: {
					allowMulti: false,
					allowedTypes: VIDEO_TYPES,
					assetType: 'CONTENT_BLOCK_IMAGE',
					ownerId: '',
				} as Partial<FileUploadProps>,
			}),
			poster: FILE_FIELD(undefined, {
				label: i18n.t(
					'admin/content-block/helpers/generators/hero___eigen-poster-uploaden'
				),
				validator: undefined,
				editorProps: {
					allowMulti: false,
					allowedTypes: PHOTO_TYPES,
					assetType: 'CONTENT_BLOCK_IMAGE',
					ownerId: '',
				} as Partial<FileUploadProps>,
			}),
			altText: TEXT_FIELD(undefined, {
				label: i18n.t(
					'admin/content-block/helpers/generators/hero___alt-tekst-voor-video-afbeelding'
				),
				editorType: ContentBlockEditor.TextInput,
			}),
		},
	},
	block: {
		state: INITIAL_HERO_BLOCK_STATE(),
		fields: {
			...BLOCK_FIELD_DEFAULTS(),
		},
	},
});
