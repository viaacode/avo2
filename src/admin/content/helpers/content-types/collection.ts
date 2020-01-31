import { Avo } from '@viaa/avo2-types';

import { parsePickerItem } from '..';
import { CollectionService } from '../../../../collection/collection.service';
import { PickerSelectItem, PickerSelectItemGroup } from '../../content.types';

// Fetch content items from GQL
export const fetchCollections = async (limit: number = 5): Promise<PickerSelectItemGroup> => {
	const collections: Avo.Collection.Collection[] | null = await CollectionService.getCollections(
		limit
	);

	return parseCollections(collections || []);
};

export const fetchBundles = async (limit: number = 5): Promise<PickerSelectItemGroup> => {
	const bundles: Avo.Collection.Collection[] | null = await CollectionService.getBundles(limit);

	return parseCollections(bundles || []);
};

// Parse raw content items to react-select options
const parseCollections = (raw: Avo.Collection.Collection[]): PickerSelectItemGroup => {
	const parsedCollections = raw.map(
		(item: Avo.Collection.Collection): PickerSelectItem => ({
			label: item.title,
			value: parsePickerItem('COLLECTION', item.id.toString()),
		})
	);

	return {
		label: 'Collecties',
		options: parsedCollections,
	};
};
