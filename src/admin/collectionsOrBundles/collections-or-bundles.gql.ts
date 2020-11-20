import { gql } from 'apollo-boost';

export const GET_COLLECTIONS = gql`
	query getCollections(
		$where: app_collections_bool_exp!
		$orderBy: [app_collections_order_by!]!
		$offset: Int!
		$limit: Int!
	) {
		app_collections(where: $where, order_by: $orderBy, offset: $offset, limit: $limit) {
			id
			type_id
			updated_at
			title
			description
			is_public
			created_at
			owner_profile_id
			profile {
				id
				profile_user_groups {
					groups {
						label
						id
					}
				}
				user: usersByuserId {
					id
					full_name
				}
			}
			updated_by {
				id
				user: usersByuserId {
					id
					full_name
				}
			}
			collection_labels {
				id
				label
			}
			counts {
				bookmarks
				in_assignment
				in_collection
				views
				copies
			}
		}
		app_collections_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;

// TODO add relations back into the collections query to show which collections are a copy of which collection
// We first want to test how fast the query is, before we make it heavier again:
//
// relations(where: { predicate: { _eq: "IS_COPY_OF" } }) {
// 	subject
// 	predicate
// 	object
// }

export const GET_COLLECTION_IDS = gql`
	query getCollections($where: app_collections_bool_exp!) {
		app_collections(where: $where) {
			id
		}
	}
`;

export const BULK_UPDATE_PUBLISH_STATE_FOR_COLLECTIONS = gql`
	mutation bulkUpdatePublishSTateForCollections(
		$isPublic: Boolean!
		$collectionIds: [uuid!]!
		$now: timestamptz!
		$updatedByProfileId: uuid!
	) {
		update_app_collections(
			where: { id: { _in: $collectionIds } }
			_set: {
				is_public: $isPublic
				updated_at: $now
				updated_by_profile_id: $updatedByProfileId
			}
		) {
			affected_rows
		}
	}
`;

export const BULK_UPDATE_AUTHOR_FOR_COLLECTIONS = gql`
	mutation bulkUpdateAuthorForCollections(
		$authorId: uuid!
		$collectionIds: [uuid!]!
		$now: timestamptz!
		$updatedByProfileId: uuid!
	) {
		update_app_collections(
			where: { id: { _in: $collectionIds } }
			_set: {
				owner_profile_id: $authorId
				updated_at: $now
				updated_by_profile_id: $updatedByProfileId
			}
		) {
			affected_rows
		}
	}
`;

export const BULK_DELETE_COLLECTIONS = gql`
	mutation bulkDeleteCollections(
		$collectionIds: [uuid!]!
		$now: timestamptz!
		$updatedByProfileId: uuid!
	) {
		update_app_collections(
			where: { id: { _in: $collectionIds } }
			_set: { is_deleted: true, updated_at: $now, updated_by_profile_id: $updatedByProfileId }
		) {
			affected_rows
		}
	}
`;

export const BULK_ADD_LABELS_TO_COLLECTIONS = gql`
	mutation bulkAddLabelsToCollections($labels: [app_collection_labels_insert_input!]!) {
		insert_app_collection_labels(objects: $labels) {
			affected_rows
		}
	}
`;

export const BULK_DELETE_LABELS_FROM_COLLECTIONS = gql`
	mutation bulkDeleteLabelsFromCollections($labels: [String!]!, $collectionIds: [uuid!]!) {
		delete_app_collection_labels(
			where: { label: { _in: $labels }, collection_uuid: { _in: $collectionIds } }
		) {
			affected_rows
		}
	}
`;

export const BULK_UPDATE_DATE_AND_LAST_AUTHOR_COLLECTIONS = gql`
	mutation bulkUpdateDateAndLastAuthorCollections(
		$collectionIds: [uuid!]!
		$now: timestamptz!
		$updatedByProfileId: uuid!
	) {
		update_app_collections(
			where: { id: { _in: $collectionIds } }
			_set: { updated_at: $now, updated_by_profile_id: $updatedByProfileId }
		) {
			affected_rows
		}
	}
`;
