import { Avo } from '@viaa/avo2-types';

import { parsePickerItem } from '..';
import { getItems } from '../../../../item/item.service';
import { PickerSelectItem, PickerSelectItemGroup } from '../../content.types';

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
			value: parsePickerItem('ITEM', item.id.toString()),
		})
	);

	return {
		label: 'Items',
		options: parsedItems,
	};
};
