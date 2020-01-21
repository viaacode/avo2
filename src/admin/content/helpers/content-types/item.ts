import { Avo } from '@viaa/avo2-types';

import { getItems } from '../../../../item/item.service';
import {
	PickerSelectItem,
	PickerSelectItemGroup,
} from '../../components/ContentPicker/ContentPicker.types';

// Fetch content items from GQL
export const fetchItems = async (limit: number = 5): Promise<PickerSelectItemGroup> => {
	const items: Avo.Item.Item[] | null = await getItems(limit);

	return parseItems(items || []);
};

// Parse raw content items to react-select options
const parseItems = (raw: Avo.Item.Item[]): PickerSelectItemGroup => {
	const parsedItems = raw.map(
		(item: Avo.Item.Item): PickerSelectItem => ({
			label: item.title,
			value: {
				type: 'item',
				value: item.id.toString(),
			},
		})
	);

	return {
		label: 'items',
		options: parsedItems,
	};
};