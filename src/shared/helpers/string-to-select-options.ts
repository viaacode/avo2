import { TagInfo } from '@viaa/avo2-components';

export function stringToSelectOption(label: string): TagInfo {
	return {
		label,
		value: label,
	};
}
