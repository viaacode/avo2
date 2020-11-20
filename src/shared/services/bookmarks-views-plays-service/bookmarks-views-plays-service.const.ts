import { DocumentNode } from 'graphql';
import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import {
	GET_COLLECTION_PLAYS,
	GET_COLLECTION_VIEWS,
	GET_ITEM_PLAYS,
	GET_ITEM_VIEWS,
	INCREMENT_COLLECTION_PLAYS,
	INCREMENT_COLLECTION_VIEWS,
	INCREMENT_ITEM_PLAYS,
	INCREMENT_ITEM_VIEWS,
	INIT_COLLECTION_PLAYS,
	INIT_COLLECTION_VIEWS,
	INIT_ITEM_PLAYS,
	INIT_ITEM_VIEWS,
	INSERT_COLLECTION_BOOKMARK,
	INSERT_ITEM_BOOKMARK,
	REMOVE_COLLECTION_BOOKMARK,
	REMOVE_ITEM_BOOKMARK,
} from './bookmarks-views-plays-service.gql';
import {
	BookmarkViewPlayCounts,
	EventAction,
	EventContentType,
	EventContentTypeSimplified,
} from './bookmarks-views-plays-service.types';

export const DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS: BookmarkViewPlayCounts = {
	bookmarkCount: 0,
	viewCount: 0,
	playCount: 0,
	isBookmarked: false,
};

export interface QueryDefinition {
	query?: DocumentNode;
	get?: DocumentNode;
	init?: DocumentNode;
	increment?: DocumentNode;
	variables: (uuid: string, user?: Avo.User.User) => any;
	responsePath?: string;
}

export const EVENT_QUERIES: {
	/* eslint-disable @typescript-eslint/no-unused-vars */
	[action in EventAction]: {
		[contentType in EventContentTypeSimplified]: QueryDefinition;
		/* eslint-enable @typescript-eslint/no-unused-vars */
	};
} = {
	bookmark: {
		item: {
			query: INSERT_ITEM_BOOKMARK,
			variables: (itemUuid: string, user?: Avo.User.User) => ({
				bookmarkItem: {
					item_id: itemUuid,
					profile_id: get(user, 'profile.id', null),
				},
			}),
		},
		collection: {
			query: INSERT_COLLECTION_BOOKMARK,
			variables: (collectionUuid: string, user?: Avo.User.User) => ({
				bookmarkItem: {
					collection_uuid: collectionUuid,
					profile_id: get(user, 'profile.id', null),
				},
			}),
		},
	},
	unbookmark: {
		item: {
			query: REMOVE_ITEM_BOOKMARK,
			variables: (itemUuid: string, user?: Avo.User.User) => ({
				itemUuid,
				profileId: get(user, 'profile.id', null),
			}),
		},
		collection: {
			query: REMOVE_COLLECTION_BOOKMARK,
			variables: (collectionUuid: string, user?: Avo.User.User) => ({
				collectionUuid,
				profileId: get(user, 'profile.id', null),
			}),
		},
	},
	view: {
		item: {
			get: GET_ITEM_VIEWS,
			init: INIT_ITEM_VIEWS,
			increment: INCREMENT_ITEM_VIEWS,
			variables: (itemUuid: string) => ({
				itemUuid,
			}),
			responsePath: 'data.app_item_meta[0].view_counts[0].count',
		},
		collection: {
			get: GET_COLLECTION_VIEWS,
			init: INIT_COLLECTION_VIEWS,
			increment: INCREMENT_COLLECTION_VIEWS,
			variables: (collectionUuid: string) => ({
				collectionUuid,
			}),
			responsePath: 'data.app_collections[0].view_counts[0].count',
		},
	},
	play: {
		item: {
			get: GET_ITEM_PLAYS,
			init: INIT_ITEM_PLAYS,
			increment: INCREMENT_ITEM_PLAYS,
			variables: (itemUuid: string) => ({
				itemUuid,
			}),
			responsePath: 'data.app_item_meta[0].play_counts[0].count',
		},
		collection: {
			get: GET_COLLECTION_PLAYS,
			init: INIT_COLLECTION_PLAYS,
			increment: INCREMENT_COLLECTION_PLAYS,
			variables: (collectionUuid: string) => ({
				collectionUuid,
			}),
			responsePath: 'data.app_collections[0].play_counts[0].count',
		},
	},
};

export const CONTENT_TYPE_TO_EVENT_CONTENT_TYPE_SIMPLIFIED: {
	[type: string]: EventContentTypeSimplified;
} = {
	item: 'item',
	video: 'item',
	audio: 'item',
	collection: 'collection',
	collectie: 'collection',
	bundle: 'collection',
	bundel: 'collection',
	map: 'collection',
};

export const CONTENT_TYPE_TO_EVENT_CONTENT_TYPE: { [type: string]: EventContentType } = {
	item: 'item',
	video: 'item',
	audio: 'item',
	collection: 'collection',
	collectie: 'collection',
	bundle: 'bundle',
	bundel: 'bundle',
	map: 'bundle',
};
