import { WYSIWYGControl } from '@viaa/avo2-components/dist/esm/wysiwyg';

export const WYSIWYG_OPTIONS_ALIGN: WYSIWYGControl[] = ['separator', 'text-align'];

export const WYSIWYG_OPTIONS_BASE: (WYSIWYGControl[] | WYSIWYGControl)[] = [
	'fullscreen',
	'separator',
	'undo',
	'redo',
	'separator',
	'headings',
	'separator',
	'bold',
	'italic',
	'strike-through',
	'underline',
	...WYSIWYG_OPTIONS_ALIGN,
	'separator',
	'list-ul',
	'list-ol',
];

// LL & LK
export const WYSIWYG_OPTIONS_DEFAULT: (WYSIWYGControl[] | WYSIWYGControl)[] = [
	...WYSIWYG_OPTIONS_BASE,
	'separator',
	'remove-styles',
];

// Avo Eind redacteur, Educative Author & Partners
export const WYSIWYG_OPTIONS_AUTHOR: (WYSIWYGControl[] | WYSIWYGControl)[] = [
	...WYSIWYG_OPTIONS_BASE,
	'separator',
	'link',
	'separator',
	'remove-styles',
];

// Admin
export const WYSIWYG_OPTIONS_FULL: (WYSIWYGControl[] | WYSIWYGControl)[] = [
	...WYSIWYG_OPTIONS_BASE,
	'separator',
	'subscript',
	'superscript',
	'separator',
	'hr',
	'separator',
	'link',
	'separator',
	'table',
	'separator',
	'remove-styles',
];

export const WYSIWYG_OPTIONS_FULL_WITHOUT_ALIGN: (WYSIWYGControl[] | WYSIWYGControl)[] = [
	'fullscreen',
	'separator',
	'undo',
	'redo',
	'separator',
	'headings',
	'separator',
	'bold',
	'italic',
	'strike-through',
	'underline',
	'separator',
	'list-ul',
	'list-ol',
	'separator',
	'subscript',
	'superscript',
	'separator',
	'hr',
	'separator',
	'link',
	'separator',
	'table',
	'separator',
	'remove-styles',
];

export const WYSIWYG_OPTIONS_DEFAULT_NO_TITLES: (WYSIWYGControl[] | WYSIWYGControl)[] = [
	'undo',
	'redo',
	'separator',
	'bold',
	'italic',
	'strike-through',
	'underline',
	'separator',
	'list-ul',
	'list-ol',
	'separator',
	'subscript',
	'superscript',
	'separator',
	'hr',
	'separator',
	'remove-styles',
];

export const WYSIWYG_OPTIONS_BUNDLE_DESCRIPTION: (WYSIWYGControl[] | WYSIWYGControl)[] = [
	'bold',
	'italic',
	'strike-through',
	'underline',
	'separator',
	'remove-styles',
	'separator',
	'link',
	'separator',
	'undo',
	'redo',
];
