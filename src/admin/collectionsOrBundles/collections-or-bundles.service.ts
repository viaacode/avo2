import { flatten, get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';
import { RelationEntry } from '@viaa/avo2-types/types/collection';

import { CustomError } from '../../shared/helpers';
import { getOrderObject } from '../../shared/helpers/generate-order-gql-query';
import { ApolloCacheManager, dataService } from '../../shared/services';
import { RelationService } from '../../shared/services/relation-service/relation.service';

import {
	ITEMS_PER_PAGE,
	TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT,
} from './collections-or-bundles.const';
import {
	BULK_ADD_LABELS_TO_COLLECTIONS,
	BULK_DELETE_COLLECTIONS,
	BULK_DELETE_LABELS_FROM_COLLECTIONS,
	BULK_UPDATE_AUTHOR_FOR_COLLECTIONS,
	BULK_UPDATE_DATE_AND_LAST_AUTHOR_COLLECTIONS,
	BULK_UPDATE_PUBLISH_STATE_FOR_COLLECTIONS,
	GET_COLLECTION_IDS,
	GET_COLLECTIONS,
} from './collections-or-bundles.gql';
import { CollectionsOrBundlesOverviewTableCols } from './collections-or-bundles.types';

export class CollectionsOrBundlesService {
	static async getCollections(
		page: number,
		sortColumn: CollectionsOrBundlesOverviewTableCols,
		sortOrder: Avo.Search.OrderDirection,
		where: any
	): Promise<[Avo.Collection.Collection[], number]> {
		let variables: any;
		try {
			variables = {
				where,
				offset: ITEMS_PER_PAGE * page,
				limit: ITEMS_PER_PAGE,
				orderBy: getOrderObject(
					sortColumn,
					sortOrder,
					TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT
				),
			};
			const response = await dataService.query({
				variables,
				query: GET_COLLECTIONS,
			});
			const collections: Avo.Collection.Collection[] | null = get(
				response,
				'data.app_collections'
			);
			const collectionsCount = get(
				response,
				'data.app_collections_aggregate.aggregate.count'
			);

			if (!collections) {
				throw new CustomError('Response does not contain any collections', null, {
					response,
				});
			}

			// also fetch if the collection is a copy in a separate query to avoid making the main query slower
			const relations = (await RelationService.fetchRelationsBySubject(
				'collection',
				collections.map((coll: Avo.Collection.Collection) => coll.id),
				'IS_COPY_OF'
			)) as RelationEntry<Avo.Collection.Collection>[];
			relations.forEach((relation) => {
				const collection = collections.find((coll) => coll.id === relation.subject);
				if (collection) {
					collection.relations = [relation];
				}
			});

			return [collections, collectionsCount];
		} catch (err) {
			throw new CustomError('Failed to get collections from the database', err, {
				variables,
				query: 'GET_COLLECTIONS',
			});
		}
	}

	static async getCollectionIds(where: any): Promise<string[]> {
		try {
			const response = await dataService.query({
				variables: {
					where,
				},
				query: GET_COLLECTION_IDS,
			});
			return get(response, 'data.app_collections', []).map(
				(coll: Partial<Avo.Collection.Collection>) => coll.id
			);
		} catch (err) {
			throw new CustomError('Failed to get collection ids from the database', err, {
				variables: {
					where,
				},
				query: 'GET_COLLECTION_IDS',
			});
		}
	}

	static async bulkChangePublicStateForCollections(
		isPublic: boolean,
		collectionIds: string[],
		updatedByProfileId: string
	): Promise<number> {
		try {
			const response = await dataService.mutate({
				mutation: BULK_UPDATE_PUBLISH_STATE_FOR_COLLECTIONS,
				variables: {
					isPublic,
					collectionIds,
					updatedByProfileId,
					now: new Date().toISOString(),
				},
				update: ApolloCacheManager.clearCollectionCache,
			});
			if (response.errors) {
				throw new CustomError('GraphQL query has errors', null, { response });
			}

			return get(response, 'data.update_app_collections.affected_rows');
		} catch (err) {
			throw new CustomError(
				'Failed to update publish state for collections in the database',
				err,
				{
					collectionIds,
					isPublic,
					query: 'BULK_UPDATE_PUBLISH_STATE_FOR_COLLECTIONS',
				}
			);
		}
	}

	static async bulkUpdateAuthorForCollections(
		authorId: string,
		collectionIds: string[],
		updatedByProfileId: string
	): Promise<number> {
		try {
			const response = await dataService.mutate({
				mutation: BULK_UPDATE_AUTHOR_FOR_COLLECTIONS,
				variables: {
					authorId,
					collectionIds,
					updatedByProfileId,
					now: new Date().toISOString(),
				},
				update: ApolloCacheManager.clearCollectionCache,
			});
			if (response.errors) {
				throw new CustomError('GraphQL query has errors', null, { response });
			}

			return get(response, 'data.update_app_collections.affected_rows');
		} catch (err) {
			throw new CustomError('Failed to update author for collections in the database', err, {
				authorId,
				collectionIds,
				query: 'BULK_UPDATE_AUTHOR_FOR_COLLECTIONS',
			});
		}
	}

	static async bulkDeleteCollections(
		collectionIds: string[],
		updatedByProfileId: string
	): Promise<number> {
		try {
			const response = await dataService.mutate({
				mutation: BULK_DELETE_COLLECTIONS,
				variables: {
					collectionIds,
					updatedByProfileId,
					now: new Date().toISOString(),
				},
				update: ApolloCacheManager.clearCollectionCache,
			});
			if (response.errors) {
				throw new CustomError('GraphQL query has errors', null, { response });
			}

			return get(response, 'data.update_app_collections.affected_rows');
		} catch (err) {
			throw new CustomError('Failed to delete collections in the database', err, {
				collectionIds,
				query: 'BULK_DELETE_COLLECTIONS',
			});
		}
	}

	static async bulkAddLabelsToCollections(
		labels: string[],
		collectionIds: string[],
		updatedByProfileId: string
	) {
		try {
			// First remove the labels, so we can add them without duplicate conflicts
			await CollectionsOrBundlesService.bulkRemoveLabelsFromCollections(
				labels,
				collectionIds,
				updatedByProfileId
			);

			// Add the labels
			const response = await dataService.mutate({
				mutation: BULK_ADD_LABELS_TO_COLLECTIONS,
				variables: {
					labels: flatten(
						labels.map((label) =>
							collectionIds.map((collectionId) => ({
								label,
								collection_uuid: collectionId,
							}))
						)
					),
				},
				update: ApolloCacheManager.clearCollectionCache,
			});
			if (response.errors) {
				throw new CustomError('GraphQL query has errors', null, { response });
			}
			await this.bulkUpdateDateAndLastAuthorCollections(collectionIds, updatedByProfileId);

			return get(response, 'data.insert_app_collection_labels.affected_rows');
		} catch (err) {
			throw new CustomError('Failed to bulk add labels to collections', err, {
				labels,
				collectionIds,
				query:
					'BULK_ADD_LABELS_TO_COLLECTIONS, BULK_UPDATE_DATE_AND_LAST_AUTHOR_COLLECTIONS',
			});
		}
	}

	static async bulkRemoveLabelsFromCollections(
		labels: string[],
		collectionIds: string[],
		updatedByProfileId: string
	) {
		try {
			const response = await dataService.mutate({
				mutation: BULK_DELETE_LABELS_FROM_COLLECTIONS,
				variables: {
					labels,
					collectionIds,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});
			if (response.errors) {
				throw new CustomError('GraphQL query has errors', null, { response });
			}
			await this.bulkUpdateDateAndLastAuthorCollections(collectionIds, updatedByProfileId);

			return get(response, 'data.delete_app_collection_labels.affected_rows');
		} catch (err) {
			throw new CustomError('Failed to bulk delete labels from collections', err, {
				labels,
				collectionIds,
				query: 'BULK_DELETE_LABELS_FROM_COLLECTIONS',
			});
		}
	}

	private static async bulkUpdateDateAndLastAuthorCollections(
		collectionIds: string[],
		updatedByProfileId: string
	) {
		const updateResponse = await dataService.mutate({
			mutation: BULK_UPDATE_DATE_AND_LAST_AUTHOR_COLLECTIONS,
			variables: {
				collectionIds,
				updatedByProfileId,
				now: new Date().toISOString(),
			},
			update: ApolloCacheManager.clearCollectionCache,
		});
		if (updateResponse.errors) {
			throw new CustomError('GraphQL query has errors', null, { updateResponse });
		}
	}
}
