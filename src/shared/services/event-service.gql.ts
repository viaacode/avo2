import { gql } from 'apollo-boost';

export const INSERT_ITEM_BOOKMARK = gql`
	mutation insertItemBookmark($bookmarkItem: app_item_bookmarks_insert_input!) {
		insert_app_item_bookmarks {
			affected_rows
		}
	}
`;

export const INSERT_COLLECTION_BOOKMARK = gql`
	mutation insertCollectionBookmark($bookmarkItem: app_collection_bookmarks_insert_input!) {
		insert_app_collection_bookmarks {
			affected_rows
		}
	}
`;
