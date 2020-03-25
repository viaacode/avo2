import i18n from '../../../../shared/translations/i18n';

import { ADMIN_ICON_OPTIONS } from '../../../shared/constants';

import {
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockType,
	DefaultContentBlockState,
	MediaPlayerTitleTextButtonBlockComponentState,
} from '../../../shared/types';
import { GET_BUTTON_TYPE_OPTIONS, GET_HEADING_TYPE_OPTIONS } from '../../content-block.const';

import { ALIGN_FIELD, BLOCK_FIELD_DEFAULTS, BLOCK_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_COMPONENTS_STATE = (): MediaPlayerTitleTextButtonBlockComponentState => ({
	mediaTitle: '',
	headingTitle: '',
	headingType: 'h2',
	align: 'left',
	content: '',
	buttonType: 'secondary',
	buttonLabel: '',
});

export const INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_STATE = (
	position: number
): DefaultContentBlockState =>
	BLOCK_STATE_DEFAULTS(ContentBlockType.MediaPlayerTitleTextButton, position);

export const MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_CONFIG = (
	position: number = 0
): ContentBlockConfig => ({
	name: i18n.t(
		'admin/content-block/helpers/generators/media-player-title-text-button___media-speler-met-titel-tekst-en-knop'
	),
	type: ContentBlockType.MediaPlayerTitleTextButton,
	components: {
		state: INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_COMPONENTS_STATE(),
		fields: {
			mediaTitle: TEXT_FIELD(
				i18n.t(
					'admin/content-block/helpers/generators/media-player-title-text-button___titel-is-verplicht'
				),
				{
					label: i18n.t(
						'admin/content-block/helpers/generators/media-player-title-text-button___video-of-audio-item-toegankelijkheidstitel'
					),
					editorType: ContentBlockEditor.TextInput,
				}
			),
			mediaItem: {
				label: i18n.t(
					'admin/content-block/helpers/generators/media-player-title-text-button___video-of-audio-item'
				),
				editorType: ContentBlockEditor.ContentPicker,
				editorProps: {
					allowedTypes: ['ITEM'],
				},
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
					options: GET_HEADING_TYPE_OPTIONS,
				},
			},
			content: TEXT_FIELD(),
			buttonType: {
				label: i18n.t('admin/content-block/helpers/generators/ctas___knop-type'),
				editorType: ContentBlockEditor.Select,
				editorProps: {
					options: GET_BUTTON_TYPE_OPTIONS,
				},
			},
			buttonLabel: TEXT_FIELD(
				i18n.t('admin/content-block/helpers/generators/ctas___knoptekst-is-verplicht'),
				{
					label: i18n.t('admin/content-block/helpers/generators/ctas___knop-tekst'),
					editorType: ContentBlockEditor.TextInput,
				}
			),
			buttonIcon: {
				label: i18n.t('admin/content-block/helpers/generators/ctas___knop-icoon'),
				editorType: ContentBlockEditor.IconPicker,
				editorProps: {
					options: ADMIN_ICON_OPTIONS,
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
		state: INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_STATE(position),
		fields: BLOCK_FIELD_DEFAULTS(),
	},
});
