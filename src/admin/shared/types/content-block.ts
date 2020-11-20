import {
	BlockHeroProps,
	ButtonAction,
	ButtonType,
	ContentItemStyle,
	ContentTabStyle,
	CTAProps,
	HeadingType,
	IconName,
	ImageInfo,
	SpacerOption,
} from '@viaa/avo2-components';
import { RichEditorState } from '@viaa/avo2-components/dist/esm/wysiwyg';
import { Avo } from '@viaa/avo2-types';

// OPTIONS
export type AlignOption = 'left' | 'right' | 'center';

export type FillOption = 'cover' | 'contain' | 'auto';

export type BlockGridFormatOption =
	| 'squareSmall'
	| 'squareLarge'
	| '4:3'
	| '2:1'
	| '6:9'
	| '400x150';

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
	OceanGreen = '#00C8AA',
	Silver = '#DBDBDB',
	Tapestry = '#B75B99',
	WineRed = '#98485C',
	Yellow = '#F3AA2E',
	DarkOrange = '#D03F06',
	FrenchRose = '#F33F67',
	Primary = '#25A4CF',
	Success = '#00C8AA',
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

// if 1 block, errors is a string[]. If multiple, it is a string[] index by their stateIndex, so string[][].
export type ContentBlockErrors = { [key: string]: (string | string[])[] };

export interface ContentBlockComponentsLimits {
	min?: number;
	max?: number;
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
	Hero = 'HERO',
	Search = 'SEARCH',
	ContentPageMeta = 'CONTENT_PAGE_META',
	LogoGrid = 'LOGO_GRID',
	UspGrid = 'USP_GRID',
	Eventbrite = 'EVENTBRITE',
}

export enum ContentBlockEditor {
	AlignSelect = 'AlignSelect',
	Checkbox = 'Checkbox',
	ColorSelect = 'ColorSelect',
	ContentPicker = 'ContentPicker',
	AnchorLinkSelect = 'AnchorLinkSelect',
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

export interface ContentBlockField {
	label?: string; // Optional for checkboxes, who have their own label
	editorType: ContentBlockEditor;
	editorProps?: any;
	validator?: (value: any) => string[];
	repeat?: {
		defaultState: any;
		addButtonLabel?: string;
		deleteButtonLabel?: string;
	};
}

export type ContentBlockEditorType = 'field' | 'fieldGroup';

export interface ContentBlockFieldGroup {
	label?: string; // Optional for checkboxes, who have their own label
	fields: {
		[key: string]: ContentBlockField;
	};
	type?: ContentBlockEditorType;
	min?: number;
	max?: number;
	repeat?: {
		defaultState: any;
		addButtonLabel?: string;
		deleteButtonLabel?: string;
	};
}

/* CONTENT BLOCK STATE */
export interface DefaultContentBlockState {
	backgroundColor: Color;
	headerBackgroundColor?: Color; // css color string. eg: '#222' or 'black' or 'rgb(0, 0, 255)'
	headerHeight?: string; // css height string. eg: '20px' or '15%'
	padding: PaddingFieldState;
	margin: PaddingFieldState;
	userGroupIds: number[];
	fullWidth?: boolean;
	anchor?: string; // Contains an id that the user can enter, so they can link to this block using the anchor-block buttons
}

export type ContentBlockState = DefaultContentBlockState;

export type ContentBlockStateType = 'components' | 'block';

export interface ContentBlockBlockConfig {
	state: ContentBlockState;
	fields: {
		[key: string]: ContentBlockField;
	};
}

export interface HeadingBlockComponentState {
	children: string;
	type: HeadingTypeOption;
	align: AlignOption;
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
	headerBackgroundColor?: Color;
	contentType: Avo.ContentPage.Type;
	itemStyle?: ContentItemStyle;
	showTitle?: boolean;
	showDescription?: boolean;
	showDate?: boolean;
	buttonLabel?: string;
	itemsPerPage?: number;
	navigate?: (buttonAction: ButtonAction) => void;
}

export interface ButtonsBlockComponentState {
	label: string;
	icon?: IconName;
	type?: ButtonType;
	navigate?: (buttonAction: ButtonAction) => void;
}

export interface RichTextBlockComponentState {
	content: string;
	// Each rich text editor state prop has to and with 'RichEditorStateKey'
	// So this can be removed before saving the page to the database in ContentService.removeRichEditorStateRecursively
	contentRichEditorState: RichEditorState | undefined;
	buttons?: ButtonsBlockComponentState[];
}

export interface AnchorLinksBlockComponentState {
	label: string;
	icon?: IconName;
	type?: ButtonType;
	navigate?: (buttonAction: ButtonAction) => void;
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
	autoplay: boolean;
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
	mediaAutoplay: boolean;
}

export interface MediaGridBlockComponentState {
	mediaItem?: ButtonAction;
	buttonLabel?: string;
	buttonIcon?: IconName;
	buttonType?: ButtonType;
	buttonAction?: ButtonAction;
}

export interface MediaGridBlockState extends DefaultContentBlockState {
	title?: string;
	buttonLabel?: string;
	buttonAction?: ButtonAction;
	ctaTitle?: string;
	ctaTitleColor?: string;
	ctaTitleSize?: HeadingType;
	ctaContent?: string;
	ctaContentColor?: string;
	ctaButtonLabel?: string;
	ctaButtonType?: ButtonType;
	ctaButtonIcon?: IconName;
	ctaBackgroundColor?: string;
	ctaBackgroundImage?: string;
	ctaWidth?: string;
	openMediaInModal?: boolean;
	ctaButtonAction?: ButtonAction;
	navigate?: (buttonAction?: ButtonAction) => void;
	searchQuery?: ButtonAction;
	searchQueryLimit: string;
}

export interface AnchorLinksBlockState extends DefaultContentBlockState {
	align: AlignOption;
	hasDividers: boolean;
}

export type RepeatedContentBlockComponentState =
	| AnchorLinksBlockComponentState
	| ButtonsBlockComponentState
	| Partial<CTAProps>
	| ImageGridBlockComponentStateFields
	| MediaGridBlockComponentState
	| ImageInfo // project spotlight & spotlight
	| RichTextBlockComponentState;

export type SingleContentBlockComponentState =
	| HeadingBlockComponentState
	| Partial<BlockHeroProps>
	| IFrameBlockComponentState
	| ImageBlockComponentState
	| IntroBlockComponentState
	| KlaarBlockComponentState
	| MediaPlayerBlockComponentState
	| MediaPlayerTitleTextButtonBlockComponentState
	| PageOverviewBlockComponentStateFields
	| QuoteBlockComponentState
	| RichTextBlockComponentState
	| {}; // Search block & content page meta

export type ContentBlockComponentState =
	| RepeatedContentBlockComponentState[]
	| SingleContentBlockComponentState;

export type ContentBlockStateOption =
	| Partial<ContentBlockComponentState>
	| Partial<ContentBlockComponentState>[]
	| Partial<ContentBlockState>;

export interface ContentBlockComponentsConfig {
	name?: string;
	limits?: ContentBlockComponentsLimits;
	state: ContentBlockComponentState;
	fields: {
		[key: string]: any;
	};
}

export interface ContentBlockConfig {
	id?: number;
	errors?: ContentBlockErrors;
	name: string;
	components: ContentBlockComponentsConfig;
	block: ContentBlockBlockConfig;
	type: ContentBlockType;
	anchor?: string;
	position: number;
}

export interface ContentBlockMeta {
	index: number;
	config: ContentBlockConfig;
}

export const DEFAULT_BUTTON_PROPS = {
	type: 'primary',
	label: '',
	icon: undefined,
	buttonAction: undefined,
};
