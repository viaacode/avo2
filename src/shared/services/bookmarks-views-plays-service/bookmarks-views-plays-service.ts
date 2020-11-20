import { compact, fromPairs, get, groupBy, isNil } from 'lodash-es';

import { EnglishContentType } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { getProfileName } from '../../../authentication/helpers/get-profile-info';
import { ContentTypeNumber, toDutchContentType } from '../../../collection/collection.types';
import { DEFAULT_AUDIO_STILL } from '../../constants';
import { CustomError, normalizeTimestamp } from '../../helpers';
import i18n from '../../translations/i18n';
import { ApolloCacheManager, dataService } from '../data-service';
import { trackEvents } from '../event-logging-service';
import { ToastService } from '../toast-service';

import { EVENT_QUERIES } from './bookmarks-views-plays-service.const';
import {
	GET_BOOKMARK_STATUSES,
	GET_BOOKMARKS_FOR_USER,
	GET_COLLECTION_BOOKMARK_VIEW_PLAY_COUNTS,
	GET_ITEM_BOOKMARK_VIEW_PLAY_COUNTS,
	GET_MULTIPLE_COLLECTION_VIEW_COUNTS,
	GET_MULTIPLE_ITEM_VIEW_COUNTS,
} from './bookmarks-views-plays-service.gql';
import {
	AppCollectionBookmark,
	AppItemBookmark,
	BookmarkInfo,
	BookmarkRequestInfo,
	BookmarkStatusLookup,
	BookmarkViewPlayCounts,
	EventAction,
	EventContentType,
	EventContentTypeSimplified,
	GetBookmarksForUserResponse,
	QueryType,
} from './bookmarks-views-plays-service.types';

export class BookmarksViewsPlaysService {
	public static async action(
		action: EventAction,
		contentType: EventContentType,
		contentUuid: string,
		user?: Avo.User.User,
		silent: boolean = true
	): Promise<void> {
		try {
			if (action === 'play' || action === 'view') {
				const count = await this.getCount(action, contentType, contentUuid, user, silent);

				if (isNil(count)) {
					// No row exists yet that can be increased, we should add a row with count = 1
					await this.insertInitialCount(action, contentType, contentUuid, user, silent);
				} else {
					await this.incrementCount(action, contentType, contentUuid, user, silent);
				}
			} else {
				// Bookmark or unbookmark action
				const { query, variables } = this.getQueryAndVariables(
					action,
					'query',
					contentType,
					contentUuid,
					user
				);

				const response = await dataService.mutate({
					mutation: query,
					variables,
					update: ApolloCacheManager.clearBookmarksViewsPlays,
				});

				if (response.errors) {
					// Bookmark related action failed
					console.error('Failed to store action into the database', null, {
						response,
						variables,
					});
					ToastService.danger(
						action === 'bookmark'
							? i18n.t(
									'shared/services/bookmarks-views-plays-service___het-aanmaken-van-de-bladwijzer-is-mislukt'
							  )
							: i18n.t(
									'shared/services/bookmarks-views-plays-service___het-verwijderen-van-de-bladwijzer-is-mislukt'
							  )
					);
				}
			}

			// Finished incrementing
		} catch (err) {
			const error = new CustomError('Failed to store user action to the database', err, {
				action,
				contentType,
				contentUuid,
				user,
			});
			if (silent) {
				console.error(error);
			} else {
				throw error;
			}
		}
	}

	public static async getItemCounts(
		itemUuid: string,
		user: Avo.User.User | null
	): Promise<BookmarkViewPlayCounts> {
		const response = await dataService.query({
			query: GET_ITEM_BOOKMARK_VIEW_PLAY_COUNTS,
			variables: { itemUuid, profileId: get(user, 'profile.id', null) },
		});
		const isBookmarked = !!get(response, 'data.app_item_bookmarks[0]');
		const bookmarkCount = get(response, 'data.app_item_bookmarks_aggregate.aggregate.count', 0);
		const viewCount = get(response, 'data.app_item_views[0].count', 0);
		const playCount = get(response, 'data.app_item_plays[0].count', 0);
		return {
			bookmarkCount,
			viewCount,
			playCount,
			isBookmarked,
		};
	}

	public static async getCollectionCounts(
		collectionUuid: string,
		user: Avo.User.User | null
	): Promise<BookmarkViewPlayCounts> {
		const response = await dataService.query({
			query: GET_COLLECTION_BOOKMARK_VIEW_PLAY_COUNTS,
			variables: { collectionUuid, profileId: get(user, 'profile.id', null) },
		});
		const isBookmarked = !!get(response, 'data.app_collection_bookmarks[0]');
		const bookmarkCount = get(
			response,
			'data.app_collection_bookmarks_aggregate.aggregate.count',
			0
		);
		const viewCount = get(response, 'data.app_collection_views[0].count', 0);
		const playCount = get(response, 'data.app_collection_plays[0].count', 0);
		return {
			bookmarkCount,
			viewCount,
			playCount,
			isBookmarked,
		};
	}

	/**
	 * Toggles the bookmark for the provided item or collection or bundle
	 * @param contentId
	 * @param user
	 * @param type
	 * @param isBookmarked current state of the bookmark toggle before the desired action is executed
	 * @return {boolean} returns true of the operation was successful, otherwise false
	 */
	public static async toggleBookmark(
		contentId: string,
		user: Avo.User.User,
		type: EventContentType,
		isBookmarked: boolean
	): Promise<void> {
		try {
			if (!contentId) {
				throw new CustomError(
					`Failed to bookmark ${type} because the ${type} doesn't seem to be loaded yet`,
					null,
					{ contentId }
				);
			}
			await BookmarksViewsPlaysService.action(
				isBookmarked ? 'unbookmark' : 'bookmark',
				type,
				contentId,
				user,
				false
			);

			if (!isBookmarked) {
				trackEvents(
					{
						object: contentId,
						object_type: type,
						message: `${getProfileName(user)} heeft een ${toDutchContentType(
							type
						)} gebookmarked`,
						action: 'bookmark',
					},
					user
				);
			}
		} catch (err) {
			throw new CustomError('Failed to bookmark/unbookmark the item', err, { contentId });
		}
	}

	/**
	 * Gets all bookmarks for user without pagination
	 * since we cannot order items across both tables: item_bookmarks and collection_bookmarks
	 * @param user
	 */
	public static async getAllBookmarksForUser(user: Avo.User.User): Promise<BookmarkInfo[]> {
		const response: GetBookmarksForUserResponse = await dataService.query({
			query: GET_BOOKMARKS_FOR_USER,
			variables: { profileId: get(user, 'profile.id') },
		});
		const itemBookmarks: AppItemBookmark[] = get(response, 'data.app_item_bookmarks', []);
		const collectionBookmarks: AppCollectionBookmark[] = get(
			response,
			'data.app_collection_bookmarks',
			[]
		);
		const itemBookmarkInfos: (BookmarkInfo | null)[] = itemBookmarks.map(
			(itemBookmark): BookmarkInfo | null => {
				if (!itemBookmark.bookmarkedItem) {
					return null;
				}

				const thumbnailPath =
					itemBookmark.bookmarkedItem.item.item_meta.type.label === 'audio'
						? DEFAULT_AUDIO_STILL
						: itemBookmark.bookmarkedItem.thumbnail_path;

				return {
					contentId: itemBookmark.item_id,
					contentLinkId: itemBookmark.bookmarkedItem.item.external_id,
					contentType: itemBookmark.bookmarkedItem.item.item_meta.type
						.label as EnglishContentType,
					createdAt: normalizeTimestamp(itemBookmark.created_at).toDate().getTime(),
					contentTitle: itemBookmark.bookmarkedItem.title,
					contentThumbnailPath: thumbnailPath,
					contentCreatedAt: itemBookmark.bookmarkedItem.issued
						? normalizeTimestamp(itemBookmark.bookmarkedItem.issued).toDate().getTime()
						: null,
					contentViews: get(itemBookmark, 'bookmarkedItem.view_counts[0].count') || 0,
				};
			}
		);
		const collectionBookmarkInfos: (BookmarkInfo | null)[] = collectionBookmarks.map(
			(collectionBookmark): BookmarkInfo | null => {
				if (!collectionBookmark.bookmarkedCollection) {
					return null;
				}
				return {
					contentId: collectionBookmark.collection_uuid,
					contentLinkId: collectionBookmark.collection_uuid,
					contentType:
						collectionBookmark.bookmarkedCollection.type_id ===
						ContentTypeNumber.collection
							? 'collection'
							: 'bundle',
					createdAt: normalizeTimestamp(collectionBookmark.created_at).toDate().getTime(),
					contentTitle: collectionBookmark.bookmarkedCollection.title,
					contentThumbnailPath: collectionBookmark.bookmarkedCollection.thumbnail_path,
					contentCreatedAt: normalizeTimestamp(
						collectionBookmark.bookmarkedCollection.created_at
					)
						.toDate()
						.getTime(),
					contentViews:
						get(collectionBookmark, 'bookmarkedCollection.view_counts[0].count') || 0,
				};
			}
		);
		return [...compact(itemBookmarkInfos), ...compact(collectionBookmarkInfos)];
	}

	private static getQueryAndVariables(
		action: EventAction,
		queryType: QueryType,
		contentType: EventContentType,
		contentUuid: string,
		user: Avo.User.User | undefined
	) {
		// bundle is handled the same way as a collection
		const contentTypeSimplified = contentType === 'bundle' ? 'collection' : contentType;

		const query = get(EVENT_QUERIES, [action, contentTypeSimplified, queryType]);
		const getVariablesFunc = get(
			EVENT_QUERIES,
			[action, contentTypeSimplified, 'variables'],
			() => {}
		);
		const variables = getVariablesFunc(contentUuid, user);
		if (!query || !variables) {
			throw new CustomError('Failed to find query/variables in query lookup table');
		}
		const responsePath = get(EVENT_QUERIES, [
			action,
			contentTypeSimplified,
			'responsePath',
		]) as string;
		return { query, variables, responsePath };
	}

	public static async getMultipleViewCounts(
		contentIds: string[],
		type: EventContentTypeSimplified
	): Promise<{ [uuid: string]: number }> {
		const response = await dataService.query({
			query:
				type === 'item'
					? GET_MULTIPLE_ITEM_VIEW_COUNTS
					: GET_MULTIPLE_COLLECTION_VIEW_COUNTS,
			variables: { uuids: contentIds },
		});
		const items = get(response, 'data.items', []);
		return Object.fromEntries(
			items.map((item: { id: string; count: number }) => [item.id, item.count])
		);
	}

	private static async getCount(
		action: EventAction,
		contentType: EventContentType,
		contentUuid: string,
		user?: Avo.User.User,
		silent: boolean = true
	) {
		try {
			const { query, variables, responsePath } = this.getQueryAndVariables(
				action,
				'get',
				contentType,
				contentUuid,
				user
			);

			const response = await dataService.query({
				query,
				variables,
			});

			if (response.errors) {
				throw new CustomError('Graphql errors', null, { errors: response.errors });
			}

			return get(response, responsePath, null);
		} catch (err) {
			const error = new CustomError('Failed to get view/play count from the database', err, {
				action,
				contentType,
				contentUuid,
				user,
			});
			if (silent) {
				console.error(error);
			} else {
				throw error;
			}
		}
	}

	private static async insertInitialCount(
		action: EventAction,
		contentType: EventContentType,
		contentUuid: string,
		user?: Avo.User.User,
		silent: boolean = true
	) {
		try {
			const { query, variables } = this.getQueryAndVariables(
				action,
				'init',
				contentType,
				contentUuid,
				user
			);

			const response = await dataService.mutate({
				mutation: query,
				variables,
				update: ApolloCacheManager.clearBookmarksViewsPlays,
			});

			if (response.errors) {
				throw new CustomError('Graphql errors', null, { errors: response.errors });
			}
		} catch (err) {
			const error = new CustomError(
				'Failed to initialize view/play count in the database',
				err,
				{
					action,
					contentType,
					contentUuid,
					user,
				}
			);
			if (silent) {
				console.error(error);
			} else {
				throw error;
			}
		}
	}

	private static async incrementCount(
		action: EventAction,
		contentType: EventContentType,
		contentUuid: string,
		user?: Avo.User.User,
		silent: boolean = true
	) {
		try {
			const { query, variables } = this.getQueryAndVariables(
				action,
				'increment',
				contentType,
				contentUuid,
				user
			);

			const response = await dataService.mutate({
				mutation: query,
				variables,
				update: ApolloCacheManager.clearBookmarksViewsPlays,
			});

			if (response.errors) {
				throw new CustomError('Graphql errors', null, { errors: response.errors });
			}
		} catch (err) {
			const error = new CustomError(
				'Failed to increment view/play count in the database',
				err,
				{
					action,
					contentType,
					contentUuid,
					user,
				}
			);
			if (silent) {
				console.error(error);
			} else {
				throw error;
			}
		}
	}

	/**
	 * Checks the database if for the provided items and collections there is a bookmark for the current user
	 * @param profileId the profile id of the current user
	 * @param objectInfos a list of object infos containing the type: item or collection and the uuid of the item
	 * @return Promise<lookup> dictionary for looking up the "isBookmarked" status for a specific item or collection
	 *     {
	 *       item: {
	 *         id1: true,
	 *         id2: false,
	 *       },
	 *       collection: {
	 *         id5: true,
	 *         id6: true,
	 *         id8: false
	 *       }
	 *     }
	 */
	public static async getBookmarkStatuses(
		profileId: string,
		objectInfos: BookmarkRequestInfo[]
	): Promise<BookmarkStatusLookup> {
		try {
			const groupedObjectInfos: {
				[type: string]: BookmarkRequestInfo[];
			} = groupBy(objectInfos, 'type');
			const itemObjectInfos: BookmarkRequestInfo[] = groupedObjectInfos['item'] || [];
			const collectionObjectInfos: BookmarkRequestInfo[] =
				groupedObjectInfos['collection'] || [];

			// Get list of item ids and collection ids from the object infos
			const itemUuids: string[] = itemObjectInfos.map((objectInfo) => objectInfo.uuid);
			const collectionUuids: string[] = collectionObjectInfos.map(
				(objectInfo) => objectInfo.uuid
			);
			const response = await dataService.query({
				query: GET_BOOKMARK_STATUSES,
				variables: {
					profileId,
					itemUuids,
					collectionUuids,
				},
			});
			if (response.errors) {
				throw new CustomError('response contains errors', null, { response });
			}
			// Extract the ids of the bookmark items that were found
			const itemBookmarkIds = get(response, 'data.app_item_bookmarks', []).map(
				(itemBookmark: { item_id: string }) => itemBookmark.item_id
			);
			const collectionBookmarkIds = get(response, 'data.app_collection_bookmarks', []).map(
				(itemBookmark: { collection_uuid: string }) => itemBookmark.collection_uuid
			);
			// Map the ids that were found to the original id
			// if the id was found we set the isBookmarked status to true
			// if the id was not found we set the isBookmarked status to false
			const itemBookmarkStatuses: { [uuid: string]: boolean } = fromPairs(
				itemObjectInfos.map((objectInfo) => {
					return [objectInfo.uuid, itemBookmarkIds.includes(objectInfo.uuid)];
				})
			);
			const collectionBookmarkStatuses: { [uuid: string]: boolean } = fromPairs(
				collectionObjectInfos.map((objectInfo) => {
					return [objectInfo.uuid, collectionBookmarkIds.includes(objectInfo.uuid)];
				})
			);
			return {
				item: itemBookmarkStatuses,
				collection: collectionBookmarkStatuses,
			};
		} catch (err) {
			throw new CustomError('Failed to get bookmark statuses', err, {
				profileId,
				objectInfos,
				query: 'GET_BOOKMARK_STATUSES',
			});
		}
	}
}
