import { ContentPickerType } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CollectionService } from '../../../../../collection/collection.service';
import { ContentTypeNumber } from '../../../../../collection/collection.types';
import { PickerSelectItem } from '../../../types';
import { parsePickerItem } from '../helpers/parse-picker';

// TODO: move fetchBundles and fetchBundlesByTitle to a separate bundle service, not collection service.

// fetch collections by title-wildcard
export const retrieveCollections = async (
	titleOrId: string | null,
	limit: number = 5
): Promise<PickerSelectItem[]> => {
	const collections: Avo.Collection.Collection[] | null = titleOrId
		? await CollectionService.fetchCollectionsByTitleOrId(titleOrId, limit)
		: await CollectionService.fetchCollectionsOrBundles(limit, ContentTypeNumber.collection);

	return parseCollections('COLLECTION', collections || []);
};

// fetch bundles by title-wildcard
export const retrieveBundles = async (
	titleOrId: string | null,
	limit: number = 5
): Promise<PickerSelectItem[]> => {
	const bundles: Avo.Collection.Collection[] | null = titleOrId
		? await CollectionService.fetchBundlesByTitleOrId(titleOrId, limit)
		: await CollectionService.fetchCollectionsOrBundles(limit, ContentTypeNumber.bundle);

	return parseCollections('BUNDLE', bundles || []);
};

// parse raw data to react-select options
const parseCollections = (
	type: ContentPickerType,
	raw: Avo.Collection.Collection[]
): PickerSelectItem[] => {
	return raw.map(
		(item: Avo.Collection.Collection): PickerSelectItem => ({
			label: item.title,
			value: parsePickerItem(type, item.id.toString()),
		})
	);
};
