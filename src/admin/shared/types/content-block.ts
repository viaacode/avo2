import {
	ButtonAction,
	ButtonType,
	ContentItemStyle,
	ContentTabStyle,
	CTAProps,
	IconName,
	SpacerOption,
} from '@viaa/avo2-components';

import { ContentPageType } from '../../content/content.types';

// OPTIONS
export type AlignOption = 'left' | 'right' | 'center';

export type FillOption = 'cover' | 'contain' | 'auto';

export type BlockGridFormatOption = 'squareSmall' | 'squareLarge' | '4:3' | '2:1' | '6:9';

export type WidthOption = 'full-width' | 'page-header' | string; // CSS width string: eg: 100%; 400px, 500px

export type HeadingTypeOption = 'h1' | 'h2' | 'h3' | 'h4';

export enum Color {
	White = '#FFF',
	Black = '#000',
	Gray1000 = '#000000',
	Gray900 = '#0F171D',
	Gray800 = '#1D2B35',
	Gray700 = '#2B414F',
	Gray600 = '#385265',
	Gray500 = '#45647B',
	Gray400 = '#557891',
	Gray300 = '#7894A7',
	Gray200 = '#9CAFBD',
	Gray150 = '#BAC7D1',
	Gray100 = '#D6DEE3',
	Gray50 = '#EDEFF2',
	GrayShadow = '#222',
	NightBlue = '#3A586F',
	DarkNightBlue = '#182F42',
	TealBright = '#25A4CF',
	Teal = '#1D637A',
	TealDark = '#124455',
	Error200 = '#EE8176',
	Green = '#46D46E',
	Blue = '#4D76F3',
	SoftBlue = '#8AC1CE',
	OceanGreen = '#57C2A0',
	Silver = '#DBDBDB',
	Tapestry = '#B75B99',
	WineRed = '#98485C',
	Yellow = '#F3AA2E',
	DarkOrange = '#D03F06',
	FrenchRose = '#F33F67',
	Primary = '#25A4CF',
	Success = '#57C2A0',
	Error = '#DA3F34',
	AlertBackground = '#FFFFCC',
	AlertAccent = '#E9E994',
	TealBright200 = '#CFE3E9',
	BorderColor = '#3FB1D6',
	InputBoxShadow = '#69C2dF',
	Transparent = 'transparent',
}

export interface PaddingFieldState {
	top: SpacerOption;
	bottom: SpacerOption;
}

// CONTENT BLOCK CONFIG
export interface ContentBlockMeta {
	index: number;
	config: ContentBlockConfig;
}

// CONTENT BLOCK
export interface ContentBlockConfig {
	id?: number;
	errors?: ContentBlockErrors;
	name: string;
	components: ContentBlockComponentsConfig;
	block: ContentBlockBlockConfig;
	type: ContentBlockType;
	anchor?: string;
}

export interface ContentBlockComponentsConfig {
	name?: string;
	limits?: ContentBlockComponentsLimits;
	state: ContentBlockComponentState | ContentBlockComponentState[];
	fields: {
		[key: string]: any;
	};
}

export interface ContentBlockComponentsLimits {
	min?: number;
	max?: number;
}

export interface ContentBlockBlockConfig {
	state: ContentBlockState;
	fields: {
		[key: string]: ContentBlockField;
	};
}

export interface ContentBlockField {
	label?: string; // Optional for checkboxes, who have their own label
	editorType: ContentBlockEditor;
	editorProps?: any;
	validator?: (value: any) => string[];
	repeat?: boolean;
}

// must match the lookup enumeration `content_block_types` on GraphQL.
export enum ContentBlockType {
	AnchorLinks = 'ANCHOR_LINKS',
	Buttons = 'BUTTONS',
	CTAs = 'CTAS',
	Heading = 'HEADING',
	IFrame = 'IFRAME',
	Image = 'IMAGE',
	ImageGrid = 'IMAGE_GRID',
	Intro = 'INTRO',
	Klaar = 'KLAAR',
	MediaGrid = 'MEDIA_GRID',
	MediaPlayer = 'MEDIA_PLAYER',
	MediaPlayerTitleTextButton = 'MEDIA_PLAYER_TITLE_TEXT_BUTTON',
	Quote = 'QUOTE',
	RichText = 'RICH_TEXT',
	RichTextTwoColumns = 'RICH_TEXT_TWO_COLUMNS',
	PageOverview = 'PAGE_OVERVIEW',
	ProjectsSpotlight = 'PROJECTS_SPOTLIGHT',
	Spotlight = 'SPOTLIGHT',
}

// if 1 block, errors is a string[]. If multiple, it is a string[] index by their stateIndex, so string[][].
export type ContentBlockErrors = { [key: string]: (string | string[])[] };

/* CONTENT BLOCK STATE */
export interface DefaultContentBlockState {
	backgroundColor: Color;
	headerBackgroundColor?: Color; // css color string. eg: '#222' or 'black' or 'rgb(0, 0, 255)'
	headerHeight?: string; // css height string. eg: '20px' or '15%'
	blockType: ContentBlockType;
	position: number;
	padding: PaddingFieldState;
	userGroupIds: number[];
	fullWidth?: boolean;
	anchor?: string; // Contains an id that the user can enter, so they can link to this block using the anchor-block buttons
}

export type ContentBlockState = DefaultContentBlockState;

export type ContentBlockStateType = 'components' | 'block';

export type ContentBlockStateOption =
	| Partial<ContentBlockComponentState>
	| Partial<ContentBlockComponentState>[]
	| Partial<ContentBlockState>;

/* CONTENT BLOCK EDITOR */
export enum ContentBlockEditor {
	AlignSelect = 'AlignSelect',
	Checkbox = 'Checkbox',
	ColorSelect = 'ColorSelect',
	ContentPicker = 'ContentPicker',
	ContentTypeAndLabelsPicker = 'ContentTypeAndLabelsPicker',
	FileUpload = 'FileUpload',
	IconPicker = 'IconPicker',
	DatePicker = 'DatePicker',
	MultiRange = 'MultiRange',
	PaddingSelect = 'PaddingSelect',
	Select = 'Select',
	TextArea = 'TextArea',
	TextInput = 'TextInput',
	WYSIWYG = 'WYSIWYG',
	UserGroupSelect = 'UserGroupSelect',
}

/* CONTENT BLOCKS */
export type ContentBlockComponentState =
	| ButtonsBlockComponentState
	| Partial<CTAProps>
	| HeadingBlockComponentState
	| IFrameBlockComponentState
	| ImageBlockComponentState
	| ImageGridBlockComponentStateFields
	| IntroBlockComponentState
	| KlaarBlockComponentState
	| MediaGridBlockComponentState
	| MediaPlayerBlockComponentState
	| PageOverviewBlockComponentStateFields
	| QuoteBlockComponentState
	| RichTextBlockComponentState;

export interface HeadingBlockComponentState {
	children: string;
	type: HeadingTypeOption;
	align: AlignOption;
}

export interface RichTextBlockComponentState {
	content: string;
	buttons?: ButtonsBlockComponentState[];
}

export interface ImageBlockComponentState {
	title: string;
	text: string;
	source: string;
	width: WidthOption;
}

export interface ImageGridBlockComponentStateFields {
	source: string;
	title?: string;
	text?: string;
	action?: ButtonAction;
}

export interface PageOverviewBlockComponentStateFields {
	tabs?: string[];
	tabStyle?: ContentTabStyle;
	allowMultiple?: boolean;
	centerHeader?: boolean;
	headerBackgroundColor?: string;
	contentType: ContentPageType;
	itemStyle?: ContentItemStyle;
	showTitle?: boolean;
	showDescription?: boolean;
	showDate?: boolean;
	buttonLabel?: string;
	itemsPerPage?: number;
	navigate?: () => void;
}

export interface ButtonsBlockComponentState {
	label: string;
	icon?: IconName;
	type?: ButtonType;
	navigate?: () => void;
}

export interface AnchorLinksBlockComponentState {
	label: string;
	icon?: IconName;
	type?: ButtonType;
	navigate?: () => void;
}

export interface KlaarBlockComponentState {
	titles: string[];
	date: string;
}

export interface IntroBlockComponentState {
	title: string;
	content: string;
	align: AlignOption;
}

export interface IFrameBlockComponentState {
	title: string;
	src: string;
}

export interface QuoteBlockComponentState {
	quote: string;
	authorName: string;
	authorInitials: string;
	authorImage?: string;
}

export interface MediaPlayerBlockComponentState {
	title: string;
	item?: ButtonAction;
}

export interface MediaPlayerTitleTextButtonBlockComponentState {
	mediaTitle: string;
	mediaItem?: ButtonAction;
	headingType: HeadingTypeOption;
	headingTitle: string;
	content: string;
	buttonLabel: string;
	buttonIcon?: IconName;
	buttonType?: ButtonType;
	buttonAction?: ButtonAction;
	align: AlignOption;
}

export interface MediaGridBlockComponentState {
	mediaItem?: ButtonAction;
}

export interface MediaGridBlockState extends DefaultContentBlockState {
	ctaTitle?: string;
	ctaTitleColor?: string;
	ctaContent?: string;
	ctaContentColor?: string;
	ctaButtonLabel?: string;
	ctaButtonAction?: ButtonAction;
	ctaBackgroundColor?: string;
	searchQuery?: ButtonAction;
	searchQueryLimit: string;
}

export interface AnchorLinksBlockState extends DefaultContentBlockState {
	align: AlignOption;
	hasDividers: boolean;
}
