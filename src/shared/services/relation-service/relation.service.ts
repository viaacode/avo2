import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';
import { RelationEntry, RelationType } from '@viaa/avo2-types/types/collection';

import { CustomError } from '../../helpers';
import { ApolloCacheManager, dataService } from '../data-service';

import {
	DELETE_COLLECTION_RELATIONS_BY_OBJECT,
	DELETE_COLLECTION_RELATIONS_BY_SUBJECT,
	DELETE_ITEM_RELATIONS_BY_OBJECT,
	DELETE_ITEM_RELATIONS_BY_SUBJECT,
	FETCH_COLLECTION_RELATIONS_BY_OBJECTS,
	FETCH_COLLECTION_RELATIONS_BY_SUBJECTS,
	FETCH_ITEM_RELATIONS_BY_OBJECTS,
	FETCH_ITEM_RELATIONS_BY_SUBJECTS,
	INSERT_COLLECTION_RELATION,
	INSERT_ITEM_RELATION,
} from './relation.gql';

export class RelationService {
	public static async fetchRelationsByObject(
		type: 'collection' | 'item',
		relationType: RelationType,
		objectIds: string[]
	): Promise<RelationEntry<Avo.Item.Item | Avo.Collection.Collection>[]> {
		return this.fetchRelations(type, null, relationType, objectIds);
	}

	public static async fetchRelationsBySubject(
		type: 'collection' | 'item',
		subjectIds: string[],
		relationType: RelationType
	): Promise<RelationEntry<Avo.Item.Item | Avo.Collection.Collection>[]> {
		return this.fetchRelations(type, subjectIds, relationType, null);
	}

	private static async fetchRelations(
		type: 'collection' | 'item',
		subjectIds: string[] | null,
		relationType: RelationType,
		objectIds: string[] | null
	): Promise<RelationEntry<Avo.Item.Item | Avo.Collection.Collection>[]> {
		let variables: any;
		const isCollection = type === 'collection';
		try {
			variables = {
				relationType,
				...(objectIds ? { objectIds } : {}),
				...(subjectIds ? { subjectIds } : {}),
			};
			const collectionQuery = objectIds
				? FETCH_COLLECTION_RELATIONS_BY_OBJECTS
				: FETCH_COLLECTION_RELATIONS_BY_SUBJECTS;
			const itemQuery = objectIds
				? FETCH_ITEM_RELATIONS_BY_OBJECTS
				: FETCH_ITEM_RELATIONS_BY_SUBJECTS;
			const response = await dataService.mutate({
				variables,
				mutation: isCollection ? collectionQuery : itemQuery,
			});
			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
			return (
				get(
					response,
					isCollection ? 'data.app_collection_relations' : 'data.app_item_relations'
				) || []
			);
		} catch (err) {
			throw new CustomError('Failed to get relation from the database', err, {
				variables,
				query: isCollection
					? 'FETCH_COLLECTION_RELATIONS_BY_OBJECTS or FETCH_COLLECTION_RELATIONS_BY_SUBJECTS'
					: 'FETCH_ITEM_RELATIONS_BY_OBJECTS or FETCH_ITEM_RELATIONS_BY_SUBJECTS',
			});
		}
	}

	/**
	 * Inserts relationship between object and subject defined by the relationshipType
	 * @param type
	 * @param subjectId
	 * @param relationType
	 * @param objectId
	 */
	public static async insertRelation(
		type: 'collection' | 'item',
		subjectId: string,
		relationType: RelationType,
		objectId: string
	): Promise<number> {
		let variables: any;
		const isCollection = type === 'collection';
		try {
			variables = {
				relationType,
				objectId,
				subjectId,
			};
			const response = await dataService.mutate({
				variables,
				mutation: isCollection ? INSERT_COLLECTION_RELATION : INSERT_ITEM_RELATION,
				update: isCollection
					? ApolloCacheManager.clearCollectionCache
					: ApolloCacheManager.clearItemCache,
			});
			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
			const relationId = get(
				response,
				`data.${
					isCollection ? 'insert_app_collection_relations' : 'insert_app_item_relations'
				}.returning[0].id`
			);
			if (!relationId) {
				throw new CustomError('Response does not contain a relation id', null, {
					response,
				});
			}
			return relationId;
		} catch (err) {
			throw new CustomError('Failed to insert relation into the database', err, {
				variables,
				query: isCollection ? 'INSERT_COLLECTION_RELATION' : 'INSERT_ITEM_RELATION',
			});
		}
	}

	public static async deleteRelationsByObject(
		type: 'collection' | 'item',
		relationType: RelationType,
		objectId: string
	): Promise<void> {
		return RelationService.deleteRelations(type, null, relationType, objectId);
	}

	public static async deleteRelationsBySubject(
		type: 'collection' | 'item',
		subjectId: string,
		relationType: RelationType
	): Promise<void> {
		return RelationService.deleteRelations(type, subjectId, relationType, null);
	}

	private static async deleteRelations(
		type: 'collection' | 'item',
		subjectId: string | null,
		relationType: RelationType,
		objectId: string | null
	): Promise<void> {
		const isCollection = type === 'collection';
		let variables: any;
		try {
			variables = {
				relationType,
				...(objectId ? { objectId } : {}),
				...(subjectId ? { subjectId } : {}),
			};
			const collectionQuery = objectId
				? DELETE_COLLECTION_RELATIONS_BY_OBJECT
				: DELETE_COLLECTION_RELATIONS_BY_SUBJECT;
			const itemQuery = objectId
				? DELETE_ITEM_RELATIONS_BY_OBJECT
				: DELETE_ITEM_RELATIONS_BY_SUBJECT;
			const response = await dataService.mutate({
				variables,
				mutation: isCollection ? collectionQuery : itemQuery,
				update: isCollection
					? ApolloCacheManager.clearCollectionCache
					: ApolloCacheManager.clearItemCache,
			});
			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
		} catch (err) {
			throw new CustomError('Failed to delete relation from the database', err, {
				variables,
				query: isCollection ? 'DELETE_COLLECTION_RELATIONS' : 'DELETE_ITEM_RELATIONS',
			});
		}
	}
}
