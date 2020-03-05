import {
	ButtonType,
	Checkbox,
	ContentItemStyle,
	ContentTabStyle,
	MultiRange,
	Select,
	SelectOption,
	TextArea,
	TextInput,
	WYSIWYG,
} from '@viaa/avo2-components';

import { FileUpload } from '../../shared/components';
import i18n from '../../shared/translations/i18n';

import { ContentPicker, ContentTypeAndLabelsPicker, IconPicker } from '../shared/components';
import {
	AlignOption,
	BackgroundColorOption,
	ContentBlockType,
	FillOption,
	HeadingTypeOption,
	WidthOption,
} from '../shared/types';
import { AlignSelect, ColorSelect } from './components';
import {
	ACCORDIONS_BLOCK_CONFIG,
	BUTTONS_BLOCK_CONFIG,
	CTAS_BLOCK_CONFIG,
	HEADING_BLOCK_CONFIG,
	IFRAME_BLOCK_CONFIG,
	IMAGE_BLOCK_CONFIG,
	IMAGE_GRID_BLOCK_CONFIG,
	INITIAL_ACCORDIONS_BLOCK_STATE,
	INITIAL_ACCORDIONS_COMPONENTS_STATE,
	INITIAL_BUTTONS_BLOCK_STATE,
	INITIAL_BUTTONS_COMPONENTS_STATE,
	INITIAL_CTAS_BLOCK_STATE,
	INITIAL_CTAS_COMPONENTS_STATE,
	INITIAL_HEADING_BLOCK_STATE,
	INITIAL_HEADING_COMPONENTS_STATE,
	INITIAL_IFRAME_BLOCK_STATE,
	INITIAL_IFRAME_COMPONENTS_STATE,
	INITIAL_IMAGE_BLOCK_STATE,
	INITIAL_IMAGE_COMPONENTS_STATE,
	INITIAL_IMAGE_GRID_BLOCK_STATE,
	INITIAL_IMAGE_GRID_COMPONENTS_STATE,
	INITIAL_INTRO_BLOCK_STATE,
	INITIAL_INTRO_COMPONENTS_STATE,
	INITIAL_MEDIA_GRID_BLOCK_STATE,
	INITIAL_MEDIA_GRID_COMPONENTS_STATE,
	INITIAL_MEDIA_PLAYER_BLOCK_STATE,
	INITIAL_MEDIA_PLAYER_COMPONENTS_STATE,
	INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_STATE,
	INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_COMPONENTS_STATE,
	INITIAL_PAGE_OVERVIEW_BLOCK_STATE,
	INITIAL_PAGE_OVERVIEW_COMPONENTS_STATE,
	INITIAL_PROJECTS_SPOTLIGHT_BLOCK_STATE,
	INITIAL_PROJECTS_SPOTLIGHT_COMPONENTS_STATE,
	INITIAL_RICH_TEXT_BLOCK_STATE,
	INITIAL_RICH_TEXT_COMPONENTS_STATE,
	INITIAL_RICH_TEXT_TWO_COLUMNS_BLOCK_STATE,
	INITIAL_RICH_TEXT_TWO_COLUMNS_COMPONENTS_STATE,
	INTRO_BLOCK_CONFIG,
	MEDIA_GRID_BLOCK_CONFIG,
	MEDIA_PLAYER_BLOCK_CONFIG,
	MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_CONFIG,
	PAGE_OVERVIEW_BLOCK_CONFIG,
	PROJECTS_SPOTLIGHT_BLOCK_CONFIG,
	RICH_TEXT_BLOCK_CONFIG,
	RICH_TEXT_TWO_COLUMNS_BLOCK_CONFIG,
} from './helpers';

export const CONTENT_BLOCKS_RESULT_PATH = {
	GET: 'app_content_blocks',
	INSERT: 'insert_app_content_blocks',
};

export const CONTENT_BLOCK_TYPE_OPTIONS: SelectOption[] = [
	{
		label: i18n.t('admin/content-block/content-block___kies-een-content-block'),
		value: '',
		disabled: true,
	},
	{
		label: i18n.t('admin/content-block/content-block___titel'),
		value: ContentBlockType.Heading,
	},
	{
		label: i18n.t('admin/content-block/content-block___tekst'),
		value: ContentBlockType.RichText,
	},
	{
		label: i18n.t('admin/content-block/content-block___tekst-2-kolommen'),
		value: ContentBlockType.RichTextTwoColumns,
	},
	{
		label: i18n.t('admin/content-block/content-block___knoppen'),
		value: ContentBlockType.Buttons,
	},
	{
		label: i18n.t('admin/content-block/content-block___intro'),
		value: ContentBlockType.Intro,
	},
	{
		label: i18n.t('admin/content-block/content-block___2-ct-as'),
		value: ContentBlockType.CTAs,
	},
	{
		label: i18n.t('admin/content-block/content-block___i-frame'),
		value: ContentBlockType.IFrame,
	},
	{
		label: i18n.t('admin/content-block/content-block___accordeons'),
		value: ContentBlockType.Accordions,
	},
	{
		label: i18n.t('admin/content-block/content-block___media-tegels'),
		value: ContentBlockType.MediaGrid,
	},
	{
		label: i18n.t('admin/content-block/content-block___media-speler'),
		value: ContentBlockType.MediaPlayer,
	},
	{
		label: i18n.t('admin/content-block/content-block___media-speler-met-titel-tekst-en-knop'),
		value: ContentBlockType.MediaPlayerTitleTextButton,
	},
	{
		label: i18n.t('admin/content-block/content-block___afbeelding'),
		value: ContentBlockType.Image,
	},
	{
		label: i18n.t('admin/content-block/content-block___afbeelding-grid'),
		value: ContentBlockType.ImageGrid,
	},
	{
		label: i18n.t('admin/content-block/content-block___pagina-overzicht'),
		value: ContentBlockType.PageOverview,
	},
	{
		label: i18n.t('admin/content-block/content-block___projecten-in-de-kijker'),
		value: ContentBlockType.ProjectsSpotlight,
	},
];

export const EDITOR_TYPES_MAP = {
	AlignSelect,
	Checkbox,
	ColorSelect,
	ContentTypeAndLabelsPicker,
	Select,
	TextArea,
	TextInput,
	WYSIWYG,
	IconPicker,
	ContentPicker,
	FileUpload,
	MultiRange,
};

export const CONTENT_BLOCK_CONFIG_MAP = {
	[ContentBlockType.Accordions]: ACCORDIONS_BLOCK_CONFIG,
	[ContentBlockType.Buttons]: BUTTONS_BLOCK_CONFIG,
	[ContentBlockType.CTAs]: CTAS_BLOCK_CONFIG,
	[ContentBlockType.Heading]: HEADING_BLOCK_CONFIG,
	[ContentBlockType.IFrame]: IFRAME_BLOCK_CONFIG,
	[ContentBlockType.Image]: IMAGE_BLOCK_CONFIG,
	[ContentBlockType.ImageGrid]: IMAGE_GRID_BLOCK_CONFIG,
	[ContentBlockType.Intro]: INTRO_BLOCK_CONFIG,
	[ContentBlockType.MediaGrid]: MEDIA_GRID_BLOCK_CONFIG,
	[ContentBlockType.MediaPlayer]: MEDIA_PLAYER_BLOCK_CONFIG,
	[ContentBlockType.MediaPlayerTitleTextButton]: MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_CONFIG,
	[ContentBlockType.PageOverview]: PAGE_OVERVIEW_BLOCK_CONFIG,
	[ContentBlockType.ProjectsSpotlight]: PROJECTS_SPOTLIGHT_BLOCK_CONFIG,
	[ContentBlockType.RichText]: RICH_TEXT_BLOCK_CONFIG,
	[ContentBlockType.RichTextTwoColumns]: RICH_TEXT_TWO_COLUMNS_BLOCK_CONFIG,
};

export const CONTENT_BLOCK_INITIAL_STATE_MAP = {
	[ContentBlockType.Accordions]: INITIAL_ACCORDIONS_COMPONENTS_STATE,
	[ContentBlockType.Buttons]: INITIAL_BUTTONS_COMPONENTS_STATE,
	[ContentBlockType.CTAs]: INITIAL_CTAS_COMPONENTS_STATE,
	[ContentBlockType.Heading]: INITIAL_HEADING_COMPONENTS_STATE,
	[ContentBlockType.IFrame]: INITIAL_IFRAME_COMPONENTS_STATE,
	[ContentBlockType.Image]: INITIAL_IMAGE_COMPONENTS_STATE,
	[ContentBlockType.ImageGrid]: INITIAL_IMAGE_GRID_COMPONENTS_STATE,
	[ContentBlockType.Intro]: INITIAL_INTRO_COMPONENTS_STATE,
	[ContentBlockType.MediaGrid]: INITIAL_MEDIA_GRID_COMPONENTS_STATE,
	[ContentBlockType.MediaPlayer]: INITIAL_MEDIA_PLAYER_COMPONENTS_STATE,
	[ContentBlockType.MediaPlayerTitleTextButton]: INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_COMPONENTS_STATE,
	[ContentBlockType.PageOverview]: INITIAL_PAGE_OVERVIEW_COMPONENTS_STATE,
	[ContentBlockType.ProjectsSpotlight]: INITIAL_PROJECTS_SPOTLIGHT_COMPONENTS_STATE,
	[ContentBlockType.RichText]: INITIAL_RICH_TEXT_COMPONENTS_STATE,
	[ContentBlockType.RichTextTwoColumns]: INITIAL_RICH_TEXT_TWO_COLUMNS_COMPONENTS_STATE,
};

export const CONTENT_BLOCK_INITIAL_BLOCK_STATE_MAP = {
	[ContentBlockType.Accordions]: INITIAL_ACCORDIONS_BLOCK_STATE,
	[ContentBlockType.Buttons]: INITIAL_BUTTONS_BLOCK_STATE,
	[ContentBlockType.CTAs]: INITIAL_CTAS_BLOCK_STATE,
	[ContentBlockType.Heading]: INITIAL_HEADING_BLOCK_STATE,
	[ContentBlockType.IFrame]: INITIAL_IFRAME_BLOCK_STATE,
	[ContentBlockType.Image]: INITIAL_IMAGE_BLOCK_STATE,
	[ContentBlockType.ImageGrid]: INITIAL_IMAGE_GRID_BLOCK_STATE,
	[ContentBlockType.Intro]: INITIAL_INTRO_BLOCK_STATE,
	[ContentBlockType.MediaGrid]: INITIAL_MEDIA_GRID_BLOCK_STATE,
	[ContentBlockType.MediaPlayer]: INITIAL_MEDIA_PLAYER_BLOCK_STATE,
	[ContentBlockType.MediaPlayerTitleTextButton]: INITIAL_MEDIA_PLAYER_TITLE_TEXT_BUTTON_BLOCK_STATE,
	[ContentBlockType.PageOverview]: INITIAL_PAGE_OVERVIEW_BLOCK_STATE,
	[ContentBlockType.ProjectsSpotlight]: INITIAL_PROJECTS_SPOTLIGHT_BLOCK_STATE,
	[ContentBlockType.RichText]: INITIAL_RICH_TEXT_BLOCK_STATE,
	[ContentBlockType.RichTextTwoColumns]: INITIAL_RICH_TEXT_TWO_COLUMNS_BLOCK_STATE,
};

// Options
export const BACKGROUND_COLOR_OPTIONS: SelectOption<BackgroundColorOption>[] = [
	{
		label: i18n.t('admin/content-block/content-block___wit'),
		value: BackgroundColorOption.White,
	},
	{
		label: i18n.t('admin/content-block/content-block___grijs'),
		value: BackgroundColorOption.Gray50,
	},
	{
		label: i18n.t('admin/content-block/content-block___nachtblauw'),
		value: BackgroundColorOption.NightBlue,
	},
	{
		label: i18n.t('admin/content-block/content-block___zachtblauw'),
		value: BackgroundColorOption.SoftBlue,
	},
	{
		label: i18n.t('admin/content-block/content-block___appelblauwzeegroen'),
		value: BackgroundColorOption.Teal,
	},
	{
		label: i18n.t('admin/content-block/content-block___appelblauwzeegroen-helder'),
		value: BackgroundColorOption.TealBright,
	},
	{
		label: i18n.t('admin/content-block/content-block___oceaangroen'),
		value: BackgroundColorOption.OceanGreen,
	},
];

export const DARK_BACKGROUND_COLOR_OPTIONS: BackgroundColorOption[] = [
	BackgroundColorOption.NightBlue,
	BackgroundColorOption.Teal,
];

export const ALIGN_OPTIONS: { label: string; value: AlignOption }[] = [
	{
		label: 'Links',
		value: 'left',
	},
	{
		label: 'Gecentreerd',
		value: 'center',
	},
	{
		label: 'Rechts',
		value: 'right',
	},
];

export const HEADING_TYPE_OPTIONS: SelectOption<HeadingTypeOption>[] = [
	{
		label: i18n.t('admin/content-block/content-block___h-2'),
		value: 'h2',
	},
	{
		label: i18n.t('admin/content-block/content-block___h-3'),
		value: 'h3',
	},
	{
		label: i18n.t('admin/content-block/content-block___h-4'),
		value: 'h4',
	},
];

export const BUTTON_TYPE_OPTIONS: SelectOption<ButtonType>[] = [
	{
		label: i18n.t('admin/content-block/content-block___primair'),
		value: 'primary',
	},
	{
		label: i18n.t('admin/content-block/content-block___secundair'),
		value: 'secondary',
	},
	{
		label: i18n.t('admin/content-block/content-block___secundair-invers'),
		value: 'secondary-i',
	},
	{
		label: i18n.t('admin/content-block/content-block___tertiair'),
		value: 'tertiary',
	},
	{
		label: i18n.t('admin/content-block/content-block___randloos'),
		value: 'borderless',
	},
	{
		label: i18n.t('admin/content-block/content-block___randloos-invers'),
		value: 'borderless-i',
	},
	{
		label: i18n.t('admin/content-block/content-block___gevaar'),
		value: 'danger',
	},
	{
		label: i18n.t('admin/content-block/content-block___gevaar-hover'),
		value: 'danger-hover',
	},
	{
		label: i18n.t('admin/content-block/content-block___link'),
		value: 'link',
	},
	{
		label: i18n.t('admin/content-block/content-block___link-inline'),
		value: 'inline-link',
	},
];

export const WIDTH_OPTIONS: SelectOption<WidthOption>[] = [
	{
		label: i18n.t('admin/content-block/content-block___paginabreedte'),
		value: 'full-width',
	},
	{
		label: i18n.t('admin/content-block/content-block___groot'),
		value: '500px',
	},
	{
		label: i18n.t('admin/content-block/content-block___middelgroot'),
		value: '400px',
	},
];

export const FILL_OPTIONS: SelectOption<FillOption>[] = [
	{
		label: i18n.t('admin/content-block/content-block___opvullen'),
		value: 'cover',
	},
	{
		label: i18n.t('admin/content-block/content-block___volledig-zichtbaar'),
		value: 'contain',
	},
	{
		label: i18n.t('admin/content-block/content-block___oorspronkelijke-grootte'),
		value: 'auto',
	},
];

export const PAGE_OVERVIEW_TAB_STYLE_OPTIONS: SelectOption<ContentTabStyle>[] = [
	{
		label: i18n.t('admin/content-block/content-block___menu-balk'),
		value: 'MENU_BAR',
	},
	{
		label: i18n.t('admin/content-block/content-block___tags'),
		value: 'ROUNDED_BADGES',
	},
];

export const PAGE_OVERVIEW_ITEM_STYLE_OPTIONS: SelectOption<ContentItemStyle>[] = [
	{
		label: i18n.t('admin/content-block/content-block___lijst'),
		value: 'LIST',
	},
	{
		label: i18n.t('admin/content-block/content-block___grid'),
		value: 'GRID',
	},
	{
		label: i18n.t('admin/content-block/content-block___accrodions'),
		value: 'ACCORDION',
	},
];
