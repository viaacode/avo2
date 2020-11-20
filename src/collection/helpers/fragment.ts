import { get } from 'lodash-es';
import moment from 'moment';

import { Avo } from '@viaa/avo2-types';
import { RelationEntry } from '@viaa/avo2-types/types/collection';

import { getProfileId } from '../../authentication/helpers/get-profile-id';

export const getFragmentProperty = (
	itemMetaData: Avo.Item.Item | Avo.Collection.Collection | undefined,
	fragment: Avo.Collection.Fragment,
	useCustomFields: Boolean,
	prop: 'title' | 'description'
) => {
	return useCustomFields || !itemMetaData
		? get(fragment, `custom_${prop}`, '')
		: get(itemMetaData, prop, '');
};

/**
 * Show warning to users if
 * - They are owner of the collection
 * - And the item was replaced and the collection has not been edited since the replacement
 * - And the fragment that was replaced was added to the collection before it was replaced
 * @param collection
 * @param collectionFragment
 * @param user
 */
export const showReplacementWarning = (
	collection: Avo.Collection.Collection,
	collectionFragment: Avo.Collection.Fragment,
	user: Avo.User.User
): boolean => {
	const item = collectionFragment.item_meta as Avo.Item.Item;
	const replacedRelation: RelationEntry<Avo.Item.Item> | undefined = get(item, 'relations[0]');
	const ownsCollection: boolean = collection.owner_profile_id === getProfileId(user);

	return (
		ownsCollection &&
		!!replacedRelation &&
		moment(replacedRelation.created_at) > moment(collection.updated_at) &&
		moment(replacedRelation.created_at) > moment(collectionFragment.created_at)
	);
};
