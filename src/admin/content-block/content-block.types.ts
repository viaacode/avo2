import { ButtonAction, IconName } from '@viaa/avo2-components';
// TODO: Import from components lib when exported there.
import { ButtonType } from '@viaa/avo2-components/dist/components/Button/Button.types';
import { GridItem } from '@viaa/avo2-components/dist/content-blocks/BlockGrid/BlockGrid';
import {
	ContentItemStyle,
	ContentTabStyle,
} from '@viaa/avo2-components/dist/content-blocks/BlockPageOverview/BlockPageOverview';

export type ContentBlockStateType = 'components' | 'block';

export type ContentBlockStateOptions =
	| Partial<ContentBlockComponentState>
	| Partial<ContentBlockComponentState>[]
	| Partial<ContentBlockState>;

export type AlignOption = 'left' | 'right' | 'center';
export type HeadingLevelOption = 'h2' | 'h3' | 'h4';
export type ButtonTypeOption = 'primary' | 'secondary';
export type ImageWidthOption = 'full-width' | '500px' | '400px';
export type ImageGridFillOption = 'cover' | 'contain' | 'auto';
export type ImageGridTextAlignOption = 'left' | 'center' | 'right';
export type ContentTypeOption =
	| 'NIEUWS_OVERZICHT'
	| 'NIEUWS_ITEM'
	| 'FAQ_OVERZICHT'
	| 'FAQ_ITEM'
	| 'SCREENCAST'
	| 'PAGINA'
	| 'PROJECT';

// CONTENT BLOCK CONFIG
export interface ContentBlockMeta {
	index: number;
	config: ContentBlockConfig;
}

export interface ContentBlockConfig {
	id?: number;
	name: string;
	components: ContentBlockComponentsConfig;
	block: ContentBlockBlockConfig;
	type: ContentBlockType;
}

export interface ContentBlockComponentsConfig {
	name?: string;
	limits?: ContentBlockComponentsLimits;
	state: ContentBlockComponentState | ContentBlockComponentState[];
	fields: {
		[key: string]: ContentBlockField;
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

export type ContentBlockComponentState =
	| HeadingBlockComponentState
	| RichTextBlockComponentState
	| ButtonsBlockComponentState
	| IntroBlockComponentState
	| CTAsBlockComponentState
	| IFrameBlockComponentState
	| AccordionsBlockComponentState
	| ImageBlockComponentState
	| ImageGridBlockComponentStateFields
	| PageOverviewBlockComponentStateFields;

export type ContentBlockState = DefaultContentBlockState;

export interface ContentBlockField {
	label: string;
	editorType: ContentBlockEditor;
	editorProps?: any;
	validator?: (value: any) => string[];
}

export enum ContentBlockEditor {
	AlignSelect = 'AlignSelect',
	ColorSelect = 'ColorSelect',
	Select = 'Select',
	TextInput = 'TextInput',
	WYSIWYG = 'WYSIWYG',
	IconPicker = 'IconPicker',
	ContentPicker = 'ContentPicker',
	FileUpload = 'FileUpload',
	MultiRange = 'MultiRange',
	ContentTypeAndLabelsPicker = 'ContentTypeAndLabelsPicker',
	Checkbox = 'Checkbox',
}

// If only one block exists then the errors are a string[]
// If multiple blocks exist then the errors are an array of string array indexed by their stateIndex
export type ContentBlockFormError = { [key: string]: string[] | string[][] };

// CONTENT BLOCKS
export interface DefaultContentBlockState {
	backgroundColor: ContentBlockBackgroundColor;
	blockType: ContentBlockType;
	position: number;
}

export enum ContentBlockBackgroundColor {
	Gray50 = 'gray-50',
	White = 'white',
	NightBlue = 'night-blue',
}

// These match the content_block_types enums from graphql
// New values need to be added there as well or it won't save
export enum ContentBlockType {
	Buttons = 'BUTTONS',
	Heading = 'HEADING',
	CTAs = 'CTAS',
	Intro = 'INTRO',
	RichText = 'RICH_TEXT',
	RichTextTwoColumns = 'RICH_TEXT_TWO_COLUMNS',
	IFrame = 'IFRAME',
	Accordions = 'ACCORDIONS',
	Image = 'IMAGE',
	ImageGrid = 'IMAGE_GRID',
	PageOverview = 'PAGE_OVERVIEW',
}

export interface HeadingBlockComponentState {
	children: string;
	type: HeadingLevelOption;
	align: AlignOption;
}

export interface RichTextBlockComponentState {
	content: string;
}

export interface ImageBlockComponentState {
	title: string;
	text: string;
	source: string;
	width: ImageWidthOption;
}

export interface ImageGridBlockComponentStateFields {
	source?: string;
	title?: string;
	text?: string;
	action?: ButtonAction;
}

export interface ImageGridBlockComponentStateBlockFields extends DefaultContentBlockState {
	elements: GridItem[];
	imageWidth?: number;
	imageHeight?: number;
	itemWidth?: number;
	fill?: ImageGridFillOption;
	textAlign?: ImageGridTextAlignOption;
	className?: string;
	navigate?: (action: ButtonAction) => void;
}

export interface PageOverviewBlockComponentStateFields {
	tabs?: string[];
	tabStyle?: ContentTabStyle;
	allowMultiple?: boolean;
	contentType: ContentTypeOption;
	itemStyle?: ContentItemStyle;
	showTitle?: boolean;
	showDescription?: boolean;
	showDate?: boolean;
	buttonLabel?: string;
	itemsPerPage?: number;
	navigate?: (action: ButtonAction) => void;
}

export interface ButtonsBlockComponentState {
	label: string;
	icon?: IconName;
	type?: ButtonType;
}

export interface IntroBlockComponentState {
	title: string;
	content: string;
	align: AlignOption;
}

export interface CTAsBlockComponentState {
	heading: string;
	headingType: HeadingLevelOption;
	content: string | string[];
	buttonLabel: string;
	buttonIcon?: IconName;
	buttonType?: ButtonType;
}

export interface IFrameBlockComponentState {
	title: string;
	src: string;
}

export interface AccordionsBlockComponentState {
	title: string;
	content: string;
}
