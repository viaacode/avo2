export type ContentPickerType =
	| 'CONTENT_PAGE'
	| 'COLLECTION'
	| 'ITEM'
	| 'DROPDOWN'
	| 'INTERNAL_LINK'
	| 'EXTERNAL_LINK'
	| 'BUNDLE'
	| 'SEARCH_QUERY';

export type PickerItemControls = 'SELECT' | 'TEXT_INPUT';

export interface PickerTypeOption<T = ContentPickerType> {
	value: T;
	label: string;
	disabled?: boolean;
	picker: PickerItemControls;
	fetch?: (keyword: string | null, limit: number) => Promise<PickerSelectItem[]>;
	placeholder?: string;
}

export interface PickerSelectItem {
	label: string;
	value: PickerItem;
}

export interface PickerItem {
	label?: string;
	type: ContentPickerType;
	value: string;
	target?: LinkTarget;
}

export enum LinkTarget { // Replace by enum in components repo after 1.35.0
	Self = '_self',
	Blank = '_blank',
}
