import { get } from 'lodash';
import { ValueType } from 'react-select/src/types';

import { ContentPickerType } from '@viaa/avo2-components';

import { PickerItem, PickerItemControls, PickerSelectItem, PickerTypeOption } from '../../types';

export const filterTypes = (
	types: PickerTypeOption<ContentPickerType>[],
	allowedTypes: ContentPickerType[]
) => {
	return types.filter((option: PickerTypeOption) => {
		return allowedTypes.length ? allowedTypes.includes(option.value) : option.value;
	});
};

export const setInitialInput = (
	type?: PickerTypeOption<ContentPickerType>,
	initialValue?: PickerItem
) => {
	switch (get(type, 'picker') as PickerItemControls) {
		case 'TEXT_INPUT':
		case 'FILE_UPLOAD':
			return get(initialValue, 'value', '');

		default:
			return '';
	}
};

export const setInitialItem = (
	options: PickerSelectItem[],
	initialValue?: PickerItem
): ValueType<PickerItem> => {
	return options.find(
		(option: PickerSelectItem) =>
			option.value.value === get(initialValue, 'value', 'EMPTY_SELECTION')
	) as ValueType<PickerItem>;
};
