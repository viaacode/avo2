import { CheckboxProps, TextInputProps } from '@viaa/avo2-components';

import { FileUploadProps } from '../../../../shared/components/FileUpload/FileUpload';
import { PHOTO_TYPES } from '../../../../shared/helpers/files';
import i18n from '../../../../shared/translations/i18n';
import { GET_ADMIN_ICON_OPTIONS } from '../../../shared/constants';
import { validateFlowplayerVideoUrl } from '../../../shared/helpers';
import {
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
	MediaPlayerTitleTextButtonBlockComponentState,
} from '../../../shared/types';
import { GET_BUTTON_TYPE_OPTIONS, GET_HEADING_TYPE_OPTIONS } from '../../content-block.const';

import {
	ALIGN_FIELD,
	BLOCK_FIELD_DEFAULTS,
	BLOCK_STATE_DEFAULTS,
	FILE_FIELD,
	ITEM_PICKER_FIELD,
	TEXT_FIELD,
} from './defaults';

export const INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_COMPONENTS_STATE = (): MediaPlayerTitleTextButtonBlockComponentState => ({
	mediaTitle: '',
	mediaAutoplay: false,
	headingTitle: '',
	headingType: 'h2',
	align: 'left',
	content: '',
	buttonType: 'secondary',
	buttonLabel: '',
});

export const INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_STATE = (): DefaultContentBlockState =>
	BLOCK_STATE_DEFAULTS();

export const MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_CONFIG = (
	position: number = 0
): ContentBlockConfig => ({
	position,
	name: i18n.t(
		'admin/content-block/helpers/generators/media-player-title-text-button___media-speler-met-titel-tekst-en-knop'
	),
	type: ContentBlockType.MediaPlayerTitleTextButton,
	components: {
		state: INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_COMPONENTS_STATE(),
		fields: {
			mediaTitle: {
				label: i18n.t(
					'admin/content-block/helpers/generators/media-player-title-text-button___video-of-audio-item-toegankelijkheidstitel'
				),
				editorType: ContentBlockEditor.TextInput,
			},
			mediaItem: ITEM_PICKER_FIELD(),
			mediaSrc: TEXT_FIELD(undefined, {
				label: i18n.t(
					'admin/content-block/helpers/generators/media-player-title-text-button___eigen-video-url-van-flowplayer-com-optioneel'
				),
				editorType: ContentBlockEditor.TextInput,
				validator: validateFlowplayerVideoUrl,
				editorProps: {
					placeholder: i18n.t(
						'admin/content-block/helpers/generators/media-player-title-text-button___bv-https-cdn-flowplayer-com-hls-playlist-m-3-u-8'
					),
				} as TextInputProps,
			}),
			mediaPoster: FILE_FIELD(undefined, {
				label: i18n.t(
					'admin/content-block/helpers/generators/media-player-title-text-button___eigen-poster-uploaden-optioneel'
				),
				validator: undefined,
				editorProps: {
					allowMulti: false,
					allowedTypes: PHOTO_TYPES,
					assetType: 'CONTENT_BLOCK_IMAGE',
					ownerId: '',
				} as FileUploadProps,
			}),
			mediaAutoplay: {
				editorType: ContentBlockEditor.Checkbox,
				editorProps: {
					label: i18n.t(
						'admin/content-block/helpers/generators/media-player-title-text-button___automatisch-afspelen'
					),
				} as CheckboxProps,
			},
			headingTitle: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/heading___titel-is-verplicht'),
				{
					label: i18n.t('admin/content-block/helpers/generators/heading___titel'),
					editorType: ContentBlockEditor.TextInput,
				}
			),
			headingType: {
				label: i18n.t('admin/content-block/helpers/generators/heading___stijl'),
				editorType: ContentBlockEditor.Select,
				editorProps: {
					options: GET_HEADING_TYPE_OPTIONS(),
				},
			},
			content: TEXT_FIELD(),
			buttonType: {
				label: i18n.t('admin/content-block/helpers/generators/ctas___knop-type'),
				editorType: ContentBlockEditor.Select,
				editorProps: {
					options: GET_BUTTON_TYPE_OPTIONS(),
				},
			},
			buttonLabel: {
				label: i18n.t('admin/content-block/helpers/generators/ctas___knop-tekst'),
				editorType: ContentBlockEditor.TextInput,
			},
			buttonIcon: {
				label: i18n.t('admin/content-block/helpers/generators/ctas___knop-icoon'),
				editorType: ContentBlockEditor.IconPicker,
				editorProps: {
					options: GET_ADMIN_ICON_OPTIONS(),
				},
			},
			buttonAction: {
				label: i18n.t(
					'admin/content-block/helpers/generators/media-player-title-text-button___knop-actie'
				),
				editorType: ContentBlockEditor.ContentPicker,
			},
			align: ALIGN_FIELD(),
		},
	},
	block: {
		state: INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_STATE(),
		fields: BLOCK_FIELD_DEFAULTS(),
	},
});
