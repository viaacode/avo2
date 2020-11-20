import { gql } from 'apollo-boost';

export const INSERT_ITEM_BOOKMARK = gql`
	mutation insertItemBookmark($bookmarkItem: app_item_bookmarks_insert_input!) {
		insert_app_item_bookmarks(objects: [$bookmarkItem]) {
			affected_rows
		}
	}
`;

export const INSERT_COLLECTION_BOOKMARK = gql`
	mutation insertCollectionBookmark($bookmarkItem: app_collection_bookmarks_insert_input!) {
		insert_app_collection_bookmarks(objects: [$bookmarkItem]) {
			affected_rows
		}
	}
`;

export const REMOVE_ITEM_BOOKMARK = gql`
	mutation deleteItemBookmark($itemUuid: uuid!, $profileId: uuid) {
		delete_app_item_bookmarks(
			where: { item_id: { _eq: $itemUuid }, profile_id: { _eq: $profileId } }
		) {
			affected_rows
		}
	}
`;

export const REMOVE_COLLECTION_BOOKMARK = gql`
	mutation deleteCollectionBookmark($collectionUuid: uuid!, $profileId: uuid) {
		delete_app_collection_bookmarks(
			where: { collection_uuid: { _eq: $collectionUuid }, profile_id: { _eq: $profileId } }
		) {
			affected_rows
		}
	}
`;

export const INCREMENT_ITEM_VIEWS = gql`
	mutation increaseItemViews($itemUuid: uuid!) {
		update_app_item_views(where: { item_id: { _eq: $itemUuid } }, _inc: { count: 1 }) {
			affected_rows
		}
	}
`;

export const INCREMENT_COLLECTION_VIEWS = gql`
	mutation increaseCollectionViews($collectionUuid: uuid!) {
		update_app_collection_views(
			where: { collection_uuid: { _eq: $collectionUuid } }
			_inc: { count: 1 }
		) {
			affected_rows
		}
	}
`;

export const INIT_ITEM_VIEWS = gql`
	mutation insertInitialItemViewCount($itemUuid: uuid!) {
		insert_app_item_views(objects: [{ count: 1, item_id: $itemUuid }]) {
			affected_rows
		}
	}
`;

export const INIT_COLLECTION_VIEWS = gql`
	mutation insertInitialCollectionViewCount($collectionUuid: uuid!) {
		insert_app_collection_views(objects: [{ count: 1, collection_uuid: $collectionUuid }]) {
			affected_rows
		}
	}
`;

export const INCREMENT_ITEM_PLAYS = gql`
	mutation increaseItemPlays($itemUuid: uuid!) {
		update_app_item_plays(where: { item_id: { _eq: $itemUuid } }, _inc: { count: 1 }) {
			affected_rows
		}
	}
`;

export const INCREMENT_COLLECTION_PLAYS = gql`
	mutation increaseCollectionPlays($collectionUuid: uuid!) {
		update_app_collection_plays(
			where: { collection_uuid: { _eq: $collectionUuid } }
			_inc: { count: 1 }
		) {
			affected_rows
		}
	}
`;

export const GET_ITEM_VIEWS = gql`
	query getItemViewCount($itemUuid: uuid!) {
		app_item_meta(where: { uid: { _eq: $itemUuid } }) {
			view_counts {
				count
			}
			is_deleted
			is_published
		}
	}
`;

export const GET_COLLECTION_VIEWS = gql`
	query getCollectionViewCount($collectionUuid: uuid!) {
		app_collections(where: { id: { _eq: $collectionUuid } }) {
			view_counts {
				count
			}
		}
	}
`;

export const GET_ITEM_PLAYS = gql`
	query getItemPlayCount($itemUuid: uuid!) {
		app_item_meta(where: { uid: { _eq: $itemUuid } }) {
			play_counts {
				count
			}
			is_published
			is_deleted
		}
	}
`;

export const GET_COLLECTION_PLAYS = gql`
	query getCollectionPlayCount($collectionUuid: uuid!) {
		app_collections(where: { uid: { _eq: $collectionUuid } }) {
			play_counts {
				count
			}
		}
	}
`;

export const INIT_ITEM_PLAYS = gql`
	mutation insertInitialItemPlayCount($itemUuid: uuid!) {
		insert_app_item_plays(objects: [{ count: 1, item_id: $itemUuid }]) {
			affected_rows
		}
	}
`;

export const INIT_COLLECTION_PLAYS = gql`
	mutation insertInitialCollectionPlayCount($collectionUuid: uuid!) {
		insert_app_collection_plays(objects: [{ count: 1, collection_uuid: $collectionUuid }]) {
			affected_rows
		}
	}
`;

export const GET_ITEM_BOOKMARK_VIEW_PLAY_COUNTS = gql`
	query getItemBookmarkViewPlayCounts($itemUuid: uuid!, $profileId: uuid) {
		app_item_plays(where: { item_id: { _eq: $itemUuid } }, limit: 1) {
			count
		}
		app_item_views(where: { item_id: { _eq: $itemUuid } }, limit: 1) {
			count
		}
		app_item_bookmarks_aggregate(where: { item_id: { _eq: $itemUuid } }) {
			aggregate {
				count
			}
		}
		app_item_bookmarks(
			where: { profile_id: { _eq: $profileId }, item_id: { _eq: $itemUuid } }
			limit: 1
		) {
			id
		}
	}
`;

export const GET_COLLECTION_BOOKMARK_VIEW_PLAY_COUNTS = gql`
	query getCollectionBookmarkViewPlayCounts($collectionUuid: uuid!, $profileId: uuid) {
		app_collection_views(where: { collection_uuid: { _eq: $collectionUuid } }, limit: 1) {
			count
		}
		app_collection_plays(where: { collection_uuid: { _eq: $collectionUuid } }, limit: 1) {
			count
		}
		app_collection_bookmarks_aggregate(where: { collection_uuid: { _eq: $collectionUuid } }) {
			aggregate {
				count
			}
		}
		app_collection_bookmarks(
			where: { profile_id: { _eq: $profileId }, collection_uuid: { _eq: $collectionUuid } }
			limit: 1
		) {
			id
		}
	}
`;

export const GET_MULTIPLE_ITEM_VIEW_COUNTS = gql`
	query getMultipleItemViewCounts($uuids: [uuid!]) {
		items: app_item_views(where: { item_id: { _in: $uuids } }) {
			count
			id: item_id
		}
	}
`;

export const GET_MULTIPLE_COLLECTION_VIEW_COUNTS = gql`
	query getMultipleCollectionViewCounts($uuids: [uuid!]) {
		items: app_collection_views(where: { collection_uuid: { _in: $uuids } }) {
			count
			id: collection_uuid
		}
	}
`;

export const GET_BOOKMARKS_FOR_USER = gql`
	query getBookmarksForUser($profileId: uuid!) {
		app_item_bookmarks(where: { profile_id: { _eq: $profileId } }) {
			bookmarkedItem {
				title
				thumbnail_path
				issued
				item {
					external_id
					item_meta {
						is_deleted
						is_published
						type {
							label
						}
					}
				}
				view_counts {
					count
				}
			}
			item_id
			created_at
		}
		app_collection_bookmarks(where: { profile_id: { _eq: $profileId } }) {
			bookmarkedCollection {
				title
				thumbnail_path
				created_at
				type_id
				view_counts {
					count
				}
			}
			collection_uuid
			created_at
		}
	}
`;

export const GET_BOOKMARK_STATUSES = gql`
	query getBookmarkStatuses($profileId: uuid!, $itemUuids: [uuid!]!, $collectionUuids: [uuid!]!) {
		app_collection_bookmarks(
			where: { profile_id: { _eq: $profileId }, collection_uuid: { _in: $collectionUuids } }
		) {
			collection_uuid
		}
		app_item_bookmarks(
			where: { profile_id: { _eq: $profileId }, item_id: { _in: $itemUuids } }
		) {
			item_id
		}
	}
`;
