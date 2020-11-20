import { EnglishContentType } from '@viaa/avo2-components';

export interface BookmarkRequestInfo {
	type: EventContentTypeSimplified;
	uuid: string;
}

export type BookmarkStatusLookup = {
	[contentType in EventContentTypeSimplified]: { [objectUuid: string]: boolean };
};

export interface BookmarkInfo {
	createdAt: number;
	contentId: string;
	contentLinkId: string;
	contentType: EnglishContentType;
	contentTitle: string;
	contentThumbnailPath: string | null | undefined;
	contentCreatedAt: number | null;
	contentViews: number;
}

export interface BookmarkViewPlayCounts {
	bookmarkCount: number;
	viewCount: number;
	playCount: number;
	isBookmarked: boolean;
}

export interface GetBookmarksForUserResponse {
	data: {
		app_item_bookmarks: AppItemBookmark[];
		app_collection_bookmarks: AppCollectionBookmark[];
	};
}

export interface AppItemBookmark {
	bookmarkedItem?: {
		title: string;
		thumbnail_path: string;
		issued: string;
		item: {
			external_id: string;
			item_meta: {
				type: {
					label: string;
				};
			};
		};
		view_counts: {
			count: number;
		}[];
	};
	item_id: string;
	created_at: string;
}

export interface AppCollectionBookmark {
	bookmarkedCollection?: {
		title: string;
		thumbnail_path?: string;
		created_at: string;
		type_id: number;
		view_counts: {
			count: number;
		}[];
	};
	collection_uuid: string;
	created_at: string;
}

export type EventAction = 'bookmark' | 'unbookmark' | 'view' | 'play';
export type QueryType = 'query' | 'get' | 'init' | 'increment';
export type EventContentTypeSimplified = 'item' | 'collection';
export type EventContentType = EventContentTypeSimplified | 'bundle';
