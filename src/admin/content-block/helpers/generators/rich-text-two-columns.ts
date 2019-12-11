import {
	ContentBlockBackgroundColor,
	ContentBlockConfig,
	ContentBlockType,
	RichTextTwoColumnsBlockFormState,
} from '../../content-block.types';
import { CONTENT_BLOCK_FIELD_DEFAULTS, FORM_STATE_DEFAULTS, TEXT_FIELD } from './defaults';

export const INITIAL_RICH_TEXT_TWO_COLUMNS_BLOCK_STATE = (): RichTextTwoColumnsBlockFormState => ({
	firstColumnContent: '',
	secondColumnContent: '',
	...FORM_STATE_DEFAULTS(ContentBlockBackgroundColor.White, ContentBlockType.Heading),
});

export const RICH_TEXT_TWO_COLUMNS_BLOCK_CONFIG = (): ContentBlockConfig => ({
	name: 'Tekst (2 kolommen)',
	initialState: INITIAL_RICH_TEXT_TWO_COLUMNS_BLOCK_STATE,
	fields: {
		firstColumnContent: TEXT_FIELD(
			'Kolom 1 Tekst',
			'Kolom 1 Tekstveld moet verplicht ingevuld zijn.'
		),
		seconColumnContent: TEXT_FIELD(
			'Kolom 2 Tekst',
			'Kolom 2 Tekstveld moet verplicht ingevuld zijn.'
		),
		...CONTENT_BLOCK_FIELD_DEFAULTS(),
	},
});
