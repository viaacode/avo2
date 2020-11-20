import { gql } from 'apollo-boost';

export const GET_ITEMS_WITH_FILTERS = gql`
	query getItemsWithFilters(
		$where: app_item_meta_bool_exp!
		$orderBy: [app_item_meta_order_by!]!
		$offset: Int!
		$limit: Int!
	) {
		app_item_meta(where: $where, order_by: $orderBy, offset: $offset, limit: $limit) {
			created_at
			depublish_at
			depublish_reason
			description
			duration
			expiry_date
			external_id
			uid
			is_deleted
			is_published
			issued
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
			org_id
			organisation {
				or_id
				name
			}
			publish_at
			published_at
			series
			title
			type {
				id
				label
			}
			updated_at
			note
			relations(where: { predicate: { _eq: "IS_REPLACED_BY" } }) {
				object
			}
			item_counts {
				bookmarks
				in_assignment
				in_collection
				plays
				views
			}
		}
		app_item_meta_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;

export const GET_UNPUBLISHED_ITEMS_WITH_FILTERS = gql`
	query getUnpublishedItemsWithFilters(
		$where: shared_items_bool_exp!
		$orderBy: [shared_items_order_by!]
		$offset: Int!
		$limit: Int!
	) {
		shared_items(where: $where, order_by: $orderBy, offset: $offset, limit: $limit) {
			id
			pid
			updated_at
			title
			status
			item_meta {
				id
				external_id
				uid
				is_published
				is_deleted
			}
		}
		shared_items_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;

export const GET_ITEM_BY_UUID = gql`
	query getItemByUuid($uuid: uuid!) {
		app_item_meta(where: { uid: { _eq: $uuid } }) {
			thumbnail_path
			created_at
			depublish_at
			depublish_reason
			description
			duration
			expiry_date
			external_id
			uid
			is_deleted
			is_published
			issued
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
			org_id
			organisation {
				or_id
				name
			}
			publish_at
			published_at
			series
			title
			type {
				id
				label
			}
			updated_at
			note
			relations(where: { predicate: { _eq: "IS_REPLACED_BY" } }) {
				object
			}
			item_collaterals(where: { description: { _eq: "subtitle" } }) {
				path
				description
				external_id
			}
			view_counts_aggregate {
				aggregate {
					sum {
						count
					}
				}
			}
		}
	}
`;

export const UPDATE_ITEM_PUBLISH_STATE = gql`
	mutation updateItemPublishedState($itemUuid: uuid!, $isPublished: Boolean!) {
		update_app_item_meta(
			where: { uid: { _eq: $itemUuid } }
			_set: { is_published: $isPublished }
		) {
			affected_rows
		}
	}
`;

export const UPDATE_ITEM_DEPUBLISH_REASON = gql`
	mutation updateItemDepublishReason($itemUuid: uuid!, $reason: String) {
		update_app_item_meta(
			where: { uid: { _eq: $itemUuid } }
			_set: { depublish_reason: $reason }
		) {
			affected_rows
		}
	}
`;

export const UPDATE_ITEM_NOTES = gql`
	mutation updateItemNotes($itemUuid: uuid!, $note: String) {
		update_app_item_meta(where: { uid: { _eq: $itemUuid } }, _set: { note: $note }) {
			affected_rows
		}
	}
`;

export const GET_PUBLIC_ITEMS = gql`
	query getItems($limit: Int!) {
		app_item_meta(
			order_by: { title: asc }
			limit: $limit
			where: { is_published: { _eq: true } }
		) {
			external_id
			title
			is_published
			is_deleted
		}
	}
`;

export const FETCH_ITEM_UUID_BY_EXTERNAL_ID = gql`
	query fetchItemUuidByExternalId($externalId: bpchar!) {
		app_item_meta(where: { external_id: { _eq: $externalId } }) {
			uid
			is_published
			is_deleted
		}
	}
`;

export const GET_PUBLIC_ITEMS_BY_TITLE_OR_EXTERNAL_ID = gql`
	query getItemsByTitleOrExternalId($title: String!, $externalId: bpchar!, $limit: Int!) {
		itemsByTitle: app_item_meta(
			order_by: { title: asc }
			limit: $limit
			where: { title: { _ilike: $title }, is_published: { _eq: true } }
		) {
			external_id
			title
			is_published
			is_deleted
		}
		itemsByExternalId: app_item_meta(
			order_by: { title: asc }
			limit: $limit
			where: { external_id: { _eq: $externalId }, is_published: { _eq: true } }
		) {
			external_id
			title
			is_published
			is_deleted
		}
	}
`;

export const GET_ITEM_BY_EXTERNAL_ID = gql`
	query getItemByExternalId($externalId: bpchar!) {
		app_item_meta(
			where: {
				external_id: { _eq: $externalId }
				is_deleted: { _eq: false }
				is_published: { _eq: true }
			}
		) {
			created_at
			depublish_at
			description
			duration
			expiry_date
			external_id
			id
			uid
			is_deleted
			is_orphaned
			is_published
			issued
			issued_edtf
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
			org_id
			organisation {
				or_id
				name
				logo_url
			}
			publish_at
			published_at
			series
			thumbnail_path
			title
			type {
				id
				label
			}
			type_id
			updated_at
			note
			item_collaterals(where: { description: { _eq: "subtitle" } }) {
				path
				description
				external_id
			}
			view_counts_aggregate {
				aggregate {
					sum {
						count
					}
				}
			}
		}
	}
`;

export const GET_ITEM_DEPUBLISH_REASON = gql`
	query getDepublishReasonByExternalId($externalId: bpchar!) {
		app_item_meta(
			where: {
				external_id: { _eq: $externalId }
				is_deleted: { _eq: false }
				is_published: { _eq: false }
			}
		) {
			depublish_reason
			is_published
			is_deleted
		}
	}
`;

export const GET_DISTINCT_SERIES = gql`
	query getDistinctSeries {
		app_item_meta(distinct_on: series, where: { series: { _is_null: false } }) {
			series
			is_published
			is_deleted
		}
	}
`;

export const DELETE_ITEM_FROM_COLLECTIONS_BOOKMARKS = gql`
	mutation deleteItemFromCollectionBookmarksAndAssignments(
		$itemExternalId: String!
		$itemUid: uuid!
	) {
		delete_app_collection_fragments(where: { external_id: { _eq: $itemExternalId } }) {
			affected_rows
		}
		delete_app_item_bookmarks(where: { item_id: { _eq: $itemUid } }) {
			affected_rows
		}
	}
`;

export const REPLACE_ITEM_IN_COLLECTIONS_BOOKMARKS_AND_ASSIGNMENTS = gql`
	mutation replaceItemInCollectionsBookmarksAndAssignments(
		$oldItemUid: uuid!
		$oldItemExternalId: String!
		$newItemUid: uuid!
		$newItemExternalId: String!
	) {
		update_app_collection_fragments(
			where: { external_id: { _eq: $oldItemExternalId } }
			_set: { external_id: $newItemExternalId, start_oc: null, end_oc: null }
		) {
			affected_rows
		}
		update_app_item_bookmarks(
			where: { item_id: { _eq: $oldItemUid } }
			_set: { item_id: $newItemUid }
		) {
			affected_rows
		}
		update_app_assignments(
			where: { content_id: { _eq: $oldItemExternalId }, content_label: { _eq: ITEM } }
			_set: { content_id: $newItemExternalId }
		) {
			affected_rows
		}
	}
`;

export const UPDATE_SHARED_ITEMS_STATUS = gql`
	mutation setSharedItemsStatus($pids: [String!]!, $status: item_publishing_status) {
		update_shared_items(where: { pid: { _in: $pids } }, _set: { status: $status }) {
			affected_rows
		}
	}
`;
