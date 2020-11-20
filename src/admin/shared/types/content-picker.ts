import { ContentPickerType, LinkTarget } from '@viaa/avo2-components';

export type PickerItemControls = 'SELECT' | 'TEXT_INPUT' | 'FILE_UPLOAD';

export interface PickerItem {
	label?: string;
	type: ContentPickerType;
	value: string;
	target?: LinkTarget;
}

export interface PickerSelectItem {
	label: string;
	value: PickerItem;
}

export interface PickerTypeOption<T = ContentPickerType> {
	value: T;
	label: string;
	disabled?: boolean;
	picker: PickerItemControls;
	fetch?: (keyword: string | null, limit: number) => Promise<PickerSelectItem[]>;
	placeholder?: string;
}
