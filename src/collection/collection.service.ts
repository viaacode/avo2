import { FetchResult } from 'apollo-link';
import { cloneDeep, compact, fromPairs, get, isNil, without } from 'lodash-es';
import queryString from 'query-string';

import { Avo } from '@viaa/avo2-types';
import { CollectionLabelSchema } from '@viaa/avo2-types/types/collection';

import { getProfileId } from '../authentication/helpers/get-profile-id';
import { CustomError, getEnv, performQuery } from '../shared/helpers';
import { fetchWithLogout } from '../shared/helpers/fetch-with-logout';
import { isUuid } from '../shared/helpers/uuid';
import { ApolloCacheManager, dataService, ToastService } from '../shared/services';
import { RelationService } from '../shared/services/relation-service/relation.service';
import { VideoStillService } from '../shared/services/video-stills-service';
import i18n from '../shared/translations/i18n';

import {
	DELETE_COLLECTION,
	DELETE_COLLECTION_FRAGMENT,
	DELETE_COLLECTION_LABELS,
	GET_BUNDLE_TITLES_BY_OWNER,
	GET_BUNDLES_CONTAINING_COLLECTION,
	GET_COLLECTION_BY_ID,
	GET_COLLECTION_BY_TITLE_OR_DESCRIPTION,
	GET_COLLECTION_TITLES_BY_OWNER,
	GET_COLLECTIONS_BY_FRAGMENT_ID,
	GET_COLLECTIONS_BY_OWNER,
	GET_PUBLIC_COLLECTIONS,
	GET_PUBLIC_COLLECTIONS_BY_ID,
	GET_PUBLIC_COLLECTIONS_BY_TITLE,
	GET_QUALITY_LABELS,
	INSERT_COLLECTION,
	INSERT_COLLECTION_FRAGMENTS,
	INSERT_COLLECTION_LABELS,
	UPDATE_COLLECTION,
	UPDATE_COLLECTION_FRAGMENT,
} from './collection.gql';
import {
	cleanCollectionBeforeSave,
	getFragmentIdsFromCollection,
	getFragmentsFromCollection,
	getValidationErrorForSave,
	getValidationErrorsForPublish,
} from './collection.helpers';
import { ContentTypeNumber, QualityLabel } from './collection.types';

export class CollectionService {
	private static collectionLabels: { [id: string]: string } | null;

	public static async getCollectionById(id: string): Promise<Avo.Collection.Collection> {
		try {
			const response = await dataService.query({
				query: GET_COLLECTION_BY_ID,
				variables: { id },
			});

			if (response.errors) {
				throw new CustomError('Response contains graphql errors', null, response);
			}

			const collection = get(response, 'data.app_collections[0]');

			if (!collection) {
				throw new CustomError('Response does not contain a collection', null, { response });
			}

			return collection;
		} catch (err) {
			throw new CustomError('Failed to fetch collection by id from the database', err, {
				query: 'GET_COLLECTION_BY_ID',
				variables: { id },
			});
		}
	}

	/**
	 * Insert collection and underlying collection fragments.
	 *
	 * @param newCollection Collection that must be inserted.
	 */
	public static async insertCollection(
		newCollection: Partial<Avo.Collection.Collection>
	): Promise<Avo.Collection.Collection> {
		try {
			newCollection.created_at = new Date().toISOString();
			newCollection.updated_at = newCollection.created_at;
			const cleanedCollection = cleanCollectionBeforeSave(newCollection);

			// insert collection
			const insertResponse: void | FetchResult<
				Avo.Collection.Collection
			> = await dataService.mutate({
				mutation: INSERT_COLLECTION,
				variables: {
					collection: cleanedCollection,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});

			if (!insertResponse || insertResponse.errors) {
				throw new CustomError('Failed to insert collection', null, {
					insertResponse,
				});
			}

			// retrieve inserted collection from response
			const insertedCollection: Avo.Collection.Collection | null = get(
				insertResponse,
				'data.insert_app_collections.returning[0]'
			);

			if (!insertedCollection || isNil(insertedCollection.id)) {
				throw new CustomError('Failed to fetch inserted collection', null, {
					insertResponse,
				});
			}

			newCollection.id = insertedCollection.id;

			// retrieve collection fragments from inserted collection
			const fragments = getFragmentsFromCollection(newCollection);

			// insert fragments
			if (fragments && fragments.length) {
				newCollection.collection_fragments = await CollectionService.insertFragments(
					newCollection.id,
					fragments
				);
			}

			return newCollection as Avo.Collection.Collection;
		} catch (err) {
			// handle error
			throw new CustomError('Failed to insert collection', err, {
				newCollection,
			});
		}
	}

	private static getLabels(
		collection: Partial<Avo.Collection.Collection> | null
	): CollectionLabelSchema[] {
		return get(collection, 'collection_labels', []) as CollectionLabelSchema[];
	}

	/**
	 * Update collection and underlying collection fragments.
	 *
	 * @param initialCollection Original collection object.
	 * @param updatedCollection Collection that must be updated.
	 */
	public static async updateCollection(
		initialCollection: Avo.Collection.Collection | null,
		updatedCollection: Partial<Avo.Collection.Collection>
	): Promise<Avo.Collection.Collection | null> {
		try {
			// abort if updatedCollection is empty
			if (!updatedCollection) {
				ToastService.danger(
					i18n.t('collection/collection___de-huidige-collectie-is-niet-gevonden')
				);
				return null;
			}

			// validate collection before update
			let validationErrors: string[];

			if (updatedCollection.is_public) {
				validationErrors = await getValidationErrorsForPublish(updatedCollection);
			} else {
				validationErrors = await getValidationErrorForSave(updatedCollection);
			}

			// display validation errors
			if (validationErrors.length) {
				ToastService.danger(validationErrors);
				return null;
			}

			const newCollection: Partial<Avo.Collection.Collection> = cloneDeep(updatedCollection);

			// remove custom_title and custom_description if user wants to use the item's original title and description
			(newCollection.collection_fragments || []).forEach(
				(fragment: Avo.Collection.Fragment) => {
					if (!fragment.use_custom_fields) {
						fragment.custom_title = null;
						fragment.custom_description = null;
					}
				}
			);

			// null should not default to to prevent defaulting of null, we don't use lodash's default value parameter
			const initialFragmentIds: number[] = getFragmentIdsFromCollection(initialCollection);
			const currentFragmentIds: number[] = getFragmentIdsFromCollection(newCollection);

			// Fragments to insert do not have an id yet
			const newFragments = getFragmentsFromCollection(newCollection).filter(
				(fragment) => fragment.id < 0 || isNil(fragment.id)
			);

			// delete fragments that were removed from collection
			const deleteFragmentIds = without(initialFragmentIds, ...currentFragmentIds);

			// update fragments that are neither inserted nor deleted
			const updateFragmentIds = currentFragmentIds.filter((fragmentId: number) =>
				initialFragmentIds.includes(fragmentId)
			);

			// insert fragments. New fragments do not have a fragment id yet
			const insertPromise = CollectionService.insertFragments(
				newCollection.id as string,
				newFragments
			);

			// delete fragments
			const deletePromises = deleteFragmentIds.map((id: number) =>
				dataService.mutate({
					mutation: DELETE_COLLECTION_FRAGMENT,
					variables: { id },
					update: ApolloCacheManager.clearCollectionCache,
				})
			);

			// update fragments
			const updatePromises = compact(
				updateFragmentIds.map((id: number) => {
					let fragmentToUpdate:
						| Avo.Collection.Fragment
						| undefined = getFragmentsFromCollection(newCollection).find(
						(fragment: Avo.Collection.Fragment) => {
							return Number(id) === fragment.id;
						}
					);

					if (!fragmentToUpdate) {
						ToastService.info(
							i18n.t(
								'collection/collection___kan-het-te-updaten-fragment-niet-vinden-id-id',
								{ id }
							)
						);
						return null;
					}

					fragmentToUpdate = cloneDeep(fragmentToUpdate);

					delete (fragmentToUpdate as any).__typename;
					delete fragmentToUpdate.item_meta;

					return dataService.mutate({
						mutation: UPDATE_COLLECTION_FRAGMENT,
						variables: {
							id,
							fragment: fragmentToUpdate,
						},
						update: ApolloCacheManager.clearCollectionCache,
					});
				})
			);

			// perform crud requests in parallel
			await Promise.all([
				insertPromise as Promise<any>,
				...(deletePromises as Promise<any>[]),
				...(updatePromises as Promise<any>[]),
			]);

			if (newCollection.type_id === ContentTypeNumber.collection) {
				// determine new thumbnail path since videos could have changed order / been deleted
				newCollection.thumbnail_path = await this.getThumbnailPathForCollection(
					newCollection
				);
			}

			// update collection
			const cleanedCollection: Partial<Avo.Collection.Collection> = cleanCollectionBeforeSave(
				newCollection
			);

			await this.updateCollectionProperties(newCollection.id as string, cleanedCollection);

			// Update collection labels
			const initialLabels: string[] = this.getLabels(initialCollection).map(
				(labelObj: any) => labelObj.label
			);
			const updatedLabels: string[] = this.getLabels(newCollection).map(
				(labelObj: any) => labelObj.label
			);

			const addedLabels: string[] = without(updatedLabels, ...initialLabels);
			const deletedLabels: string[] = without(initialLabels, ...updatedLabels);
			await Promise.all([
				CollectionService.addLabelsToCollection(newCollection.id as string, addedLabels),
				CollectionService.deleteLabelsFromCollection(
					newCollection.id as string,
					deletedLabels
				),
			]);

			return newCollection as Avo.Collection.Collection;
		} catch (err) {
			// handle error
			const customError = new CustomError(
				'Failed to update collection or its fragments',
				err,
				{
					initialCollection,
					updatedCollection,
				}
			);

			console.error(customError);

			return null;
		}
	}

	public static updateCollectionProperties = async (
		id: string,
		collection: Partial<Avo.Collection.Collection>
	) => {
		try {
			await dataService.mutate({
				mutation: UPDATE_COLLECTION,
				variables: {
					id,
					collection,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});
		} catch (err) {
			console.error(
				new CustomError('Failed to update collection properties', err, {
					id,
					collection,
				})
			);
		}
	};

	/**
	 * Delete collection by id.
	 *
	 * @param collectionId Unique identifier of the collection.
	 */
	public static deleteCollection = async (collectionId: string) => {
		try {
			// delete collection by id
			await dataService.mutate({
				mutation: DELETE_COLLECTION,
				variables: {
					id: collectionId,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});
		} catch (err) {
			console.error(
				new CustomError(`Failed to delete collection or bundle'}`, err, {
					collectionId,
				})
			);
		}
	};

	/**
	 * Add duplicate of collection
	 *
	 * @param collection
	 * @param user
	 * @param copyPrefix
	 * @param copyRegex
	 *
	 * @returns Duplicate collection.
	 */
	public static async duplicateCollection(
		collection: Avo.Collection.Collection,
		user: Avo.User.User,
		copyPrefix: string,
		copyRegex: RegExp
	): Promise<Avo.Collection.Collection> {
		try {
			const collectionToInsert = { ...collection };

			// update attributes specific to duplicate
			collectionToInsert.owner_profile_id = getProfileId(user);
			collectionToInsert.is_public = false;

			// remove id from duplicate
			delete (collectionToInsert as any).id;

			try {
				collectionToInsert.title = await this.getCopyTitleForCollection(
					copyPrefix,
					copyRegex,
					collectionToInsert.title,
					user
				);
			} catch (err) {
				// handle error
				const customError = new CustomError(
					'Failed to retrieve title for duplicate collection',
					err,
					{
						collectionToInsert,
					}
				);

				console.error(customError);

				// fallback to simple copy title
				collectionToInsert.title = `${copyPrefix.replace(' %index%', '')}${
					collectionToInsert.title
				}`;
			}

			// insert duplicated collection
			const duplicatedCollection = await CollectionService.insertCollection(
				collectionToInsert
			);

			await RelationService.insertRelation(
				'collection',
				duplicatedCollection.id,
				'IS_COPY_OF',
				collection.id
			);

			return duplicatedCollection;
		} catch (err) {
			throw new CustomError('Failed to duplicate collection', err, {
				collection,
				user,
				copyPrefix,
				copyRegex,
			});
		}
	}

	/**
	 * Retrieve collections or bundles.
	 *
	 * @param limit Numeric value to define the maximum amount of items in response.
	 * @param typeId 3 for collections, 4 for bundles
	 * @returns Collections limited by `limit`.
	 */
	public static async fetchCollectionsOrBundles(
		limit: number,
		typeId: ContentTypeNumber
	): Promise<Avo.Collection.Collection[]> {
		try {
			// retrieve collections
			const response = await dataService.query({
				query: GET_PUBLIC_COLLECTIONS,
				variables: { limit, typeId },
			});

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle error
			const customError = new CustomError('Het ophalen van de collecties is mislukt.', err, {
				query: 'GET_PUBLIC_COLLECTIONS',
				variables: { limit },
			});

			console.error(customError);

			throw customError;
		}
	}

	public static async fetchCollectionsOrBundlesByTitleOrId(
		isCollection: boolean,
		titleOrId: string,
		limit: number
	): Promise<Avo.Collection.Collection[]> {
		try {
			const isUuidFormat = isUuid(titleOrId);
			const variables: any = {
				limit,
				typeId: isCollection ? ContentTypeNumber.collection : ContentTypeNumber.bundle,
			};
			if (isUuidFormat) {
				variables.id = titleOrId;
			} else {
				variables.title = `%${titleOrId}%`;
			}

			return (
				(await performQuery(
					{
						variables,
						query: isUuidFormat
							? GET_PUBLIC_COLLECTIONS_BY_ID
							: GET_PUBLIC_COLLECTIONS_BY_TITLE,
					},
					'data.app_collections',
					'Failed to retrieve items by title or external id.'
				)) || []
			);
		} catch (err) {
			throw new CustomError('Failed to fetch collections or bundles', err, {
				query: 'GET_PUBLIC_COLLECTIONS_BY_ID or GET_PUBLIC_COLLECTIONS_BY_TITLE',
				variables: { titleOrId, isCollection, limit },
			});
		}
	}

	/**
	 * Retrieve collections by title.
	 *
	 * @param titleOrId Keyword to search for collection title or the collection id
	 * @param limit Numeric value to define the maximum amount of items in response.
	 *
	 * @returns Collections limited by `limit`, found using the `title` wildcarded keyword.
	 */
	public static async fetchCollectionsByTitleOrId(
		titleOrId: string,
		limit: number
	): Promise<Avo.Collection.Collection[]> {
		return CollectionService.fetchCollectionsOrBundlesByTitleOrId(true, titleOrId, limit);
	}

	/**
	 * Retrieve bundles by title.
	 *
	 * @param titleOrId Keyword to search for bundle title.
	 * @param limit Numeric value to define the maximum amount of items in response.
	 *
	 * @returns Bundles limited by `limit`, found using the `title` wildcarded keyword.
	 */
	public static async fetchBundlesByTitleOrId(
		titleOrId: string,
		limit: number
	): Promise<Avo.Collection.Collection[]> {
		return CollectionService.fetchCollectionsOrBundlesByTitleOrId(false, titleOrId, limit);
	}

	public static async fetchQualityLabels(): Promise<QualityLabel[]> {
		try {
			const response = await dataService.query({
				query: GET_QUALITY_LABELS,
			});

			if (response.errors) {
				throw new CustomError('Response contains errors', null, { response });
			}

			return get(response, 'data.lookup_enum_collection_labels', []);
		} catch (err) {
			throw new CustomError('Failed to get quality labels', err, {
				query: 'GET_QUALITY_LABELS',
			});
		}
	}

	/**
	 * Retrieve collections or bundles by user.
	 *
	 * @param type Type of which items should be fetched.
	 * @param user User object defining the owner fo the collection or bundle.
	 *
	 * @returns Collections or bundles owned by the user.
	 */
	public static async fetchCollectionsOrBundlesByUser(
		type: 'collection' | 'bundle',
		user: Avo.User.User | undefined
	): Promise<Partial<Avo.Collection.Collection>[]> {
		let queryInfo: any;

		try {
			// retrieve collections or bundles according to given type and user
			queryInfo = {
				query:
					type === 'collection'
						? GET_COLLECTION_TITLES_BY_OWNER
						: GET_BUNDLE_TITLES_BY_OWNER,
				variables: { owner_profile_id: getProfileId(user) },
			};

			const response = await dataService.query(queryInfo);

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle error
			const customError = new CustomError(
				'Failed to fetch existing bundle titles by owner',
				err,
				{
					user,
					type,
					query:
						type === 'collection'
							? 'GET_COLLECTION_TITLES_BY_OWNER'
							: 'GET_BUNDLE_TITLES_BY_OWNER',
				}
			);

			console.error(customError);

			throw customError;
		}
	}

	/**
	 * Retrieve collection or bundle by id.
	 *
	 * @param collectionId Unique id of the collection that must be fetched.
	 * @param type Type of which items should be fetched.
	 *
	 * @returns Collection or bundle.
	 */
	public static async fetchCollectionOrBundleById(
		collectionId: string,
		type: 'collection' | 'bundle'
	): Promise<Avo.Collection.Collection | undefined> {
		try {
			const collectionObj = await CollectionService.getCollectionById(collectionId);

			// Collection/bundle loaded successfully
			// If we find a bundle but the function type param asked for a collection, we return undefined (and vice versa)
			if (collectionObj.type_id !== ContentTypeNumber[type]) {
				return undefined;
			}

			return collectionObj;
		} catch (err) {
			throw new CustomError('Failed to fetch collection or bundle by id', err, {
				collectionId,
				type,
			});
		}
	}

	/**
	 * Retrieve collection or bundle and underlying items or collections by id.
	 *
	 * @param collectionId Unique id of the collection that must be fetched.
	 * @param type Type of which items should be fetched.
	 * @param assignmentId Collection can be fetched if it's not public and you're not the owner,
	 *        but if it is linked to an assignment that you're trying to view
	 *
	 * @returns Collection or bundle.
	 */
	public static async fetchCollectionOrBundleWithItemsById(
		collectionId: string,
		type: 'collection' | 'bundle',
		assignmentId: number | undefined
	): Promise<Avo.Collection.Collection | null> {
		try {
			const response = await fetchWithLogout(
				`${getEnv('PROXY_URL')}/collections/fetch-with-items-by-id?${queryString.stringify({
					type,
					assignmentId,
					id: collectionId,
				})}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				}
			);
			if (response.status === 404) {
				return null;
			}
			if (response.status < 200 || response.status >= 400) {
				throw new CustomError('invalid status code', null, {
					collectionId,
					type,
					response,
					statusCode: response.status,
				});
			}
			return await response.json();
		} catch (err) {
			throw new CustomError('Failed to get collection or bundle with items', err, {
				collectionId,
				type,
			});
		}
	}

	public static async getPublishedBundlesContainingCollection(
		id: string
	): Promise<Avo.Collection.Collection[]> {
		const response = await dataService.query({
			query: GET_BUNDLES_CONTAINING_COLLECTION,
			variables: { id },
		});

		if (response.errors) {
			throw new CustomError(
				`Failed to  get bundles from database because of graphql errors`,
				null,
				{
					collectionId: id,
					errors: response.errors,
				}
			);
		}

		return get(response, 'data.app_collections', []);
	}

	public static async insertFragments(
		collectionId: string,
		fragments: Partial<Avo.Collection.Fragment>[]
	): Promise<Avo.Collection.Fragment[]> {
		try {
			fragments.forEach((fragment) => (fragment.collection_uuid = collectionId));

			const cleanedFragments = cloneDeep(fragments).map((fragment) => {
				delete fragment.id;
				delete (fragment as any).__typename;
				delete fragment.item_meta;
				return fragment;
			});

			const response = await dataService.mutate({
				mutation: INSERT_COLLECTION_FRAGMENTS,
				variables: {
					id: collectionId,
					fragments: cleanedFragments,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});

			if (response.errors) {
				throw new CustomError('Response contains graphql errors', null, { response });
			}

			const fragmentIds = get(response, 'data.insert_app_collection_fragments.returning');
			if (!fragmentIds) {
				throw new CustomError('Response does not contain any fragment ids', null, {
					response,
				});
			}
			get(response, 'data.insert_app_collection_fragments.returning', []).forEach(
				(f: { id: number }, index: number) => {
					fragments[index].id = f.id;
				}
			);

			return fragments as Avo.Collection.Fragment[];
		} catch (err) {
			throw new CustomError('Failed to insert fragments into collection', err, {
				collectionId,
				fragments,
				query: 'INSERT_COLLECTION_FRAGMENTS',
			});
		}
	}

	private static async getThumbnailPathForCollection(
		collection: Partial<Avo.Collection.Collection>
	): Promise<string | null> {
		try {
			// TODO: check if thumbnail was automatically selected from the first media fragment => need to update every save
			// or if the thumbnail was selected by the user => need to update only if video is not available anymore
			// This will need a new field in the database: thumbnail_type = 'auto' | 'chosen' | 'uploaded'
			// TODO:  || collection.thumbnail_type === 'auto'
			if (!collection.thumbnail_path) {
				return await VideoStillService.getThumbnailForCollection(collection);
			}

			return collection.thumbnail_path;
		} catch (err) {
			const customError = new CustomError(
				'Failed to get the thumbnail path for collection',
				err,
				{
					collection,
				}
			);
			console.error(customError);

			ToastService.danger([
				i18n.t(
					'collection/collection___het-ophalen-van-de-eerste-video-thumbnail-is-mislukt'
				),
				i18n.t(
					'collection/collection___de-collectie-zal-opgeslagen-worden-zonder-thumbnail'
				),
			]);

			return null;
		}
	}

	/**
	 * Find name that isn't a duplicate of an existing name of a collection of this user
	 * eg if these collections exist:
	 * copy 1: test
	 * copy 2: test
	 * copy 4: test
	 *
	 * Then the algorithm will propose: copy 3: test
	 * @param copyPrefix
	 * @param copyRegex
	 * @param existingTitle
	 * @param user
	 *
	 * @returns Potential title for duplicate collection.
	 */
	public static getCopyTitleForCollection = async (
		copyPrefix: string,
		copyRegex: RegExp,
		existingTitle: string,
		user: Avo.User.User
	): Promise<string> => {
		const collections = await CollectionService.fetchCollectionsOrBundlesByUser(
			'collection',
			user
		);
		const titles = collections.map((c) => c.title);

		let index = 0;
		let candidateTitle: string;
		const titleWithoutCopy = existingTitle.replace(copyRegex, '');

		do {
			index += 1;
			candidateTitle = copyPrefix.replace('%index%', String(index)) + titleWithoutCopy;
		} while (titles.includes(candidateTitle));

		return candidateTitle;
	};

	public static async addLabelsToCollection(
		collectionId: string,
		labels: string[]
	): Promise<void> {
		let variables: any;
		try {
			variables = {
				objects: labels.map((label) => ({
					label,
					collection_uuid: collectionId,
				})),
			};
			const response = await dataService.mutate({
				variables,
				mutation: INSERT_COLLECTION_LABELS,
				update: ApolloCacheManager.clearCollectionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
		} catch (err) {
			throw new CustomError('Failed to insert collection labels in the database', err, {
				variables,
				query: 'INSERT_COLLECTION_LABELS',
			});
		}
	}

	public static async deleteLabelsFromCollection(
		collectionId: string,
		labels: string[]
	): Promise<void> {
		let variables: any;
		try {
			variables = {
				collectionId,
				labels,
			};
			const response = await dataService.mutate({
				variables,
				mutation: DELETE_COLLECTION_LABELS,
				update: ApolloCacheManager.clearCollectionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
		} catch (err) {
			throw new CustomError('Failed to delete collection labels from the database', err, {
				variables,
				query: 'DELETE_COLLECTION_LABELS',
			});
		}
	}

	public static async getCollectionLabels(): Promise<{ [id: string]: string }> {
		try {
			if (!CollectionService.collectionLabels) {
				// Fetch collection labels and cache them in memory

				const labels: QualityLabel[] = (await CollectionService.fetchQualityLabels()) || [];

				// Map result array to dictionary
				CollectionService.collectionLabels = fromPairs(
					labels.map((collectionLabel) => [
						collectionLabel.value,
						collectionLabel.description,
					])
				);
			}

			return CollectionService.collectionLabels;
		} catch (err) {
			throw new CustomError('Failed to get collection labels', err, {
				query: 'GET_COLLECTION_LABELS',
			});
		}
	}

	static async getCollectionByTitleOrDescription(
		title: string,
		description: string | null,
		collectionId: string,
		typeId: ContentTypeNumber
	): Promise<{ byTitle: boolean; byDescription: boolean }> {
		try {
			const response = await dataService.query({
				query: GET_COLLECTION_BY_TITLE_OR_DESCRIPTION,
				variables: { title, description, collectionId, typeId },
			});

			if (response.errors) {
				throw new CustomError('response contains graphql errors', null, { response });
			}

			const collectionWithSameTitleExists: boolean = !!get(
				response,
				'data.collectionByTitle',
				[]
			).length;

			const collectionWithSameDescriptionExists: boolean = !!get(
				response,
				'data.collectionByDescription',
				[]
			).length;

			return {
				byTitle: collectionWithSameTitleExists,
				byDescription: collectionWithSameDescriptionExists,
			};
		} catch (err) {
			throw new CustomError(
				'Failed to get duplicate collections by title or description',
				err,
				{
					title,
					description,
					query: 'GET_COLLECTION_BY_TITLE_OR_DESCRIPTION',
				}
			);
		}
	}

	public static async fetchCollectionsByFragmentId(
		fragmentId: string
	): Promise<Avo.Collection.Collection[]> {
		try {
			// retrieve collections
			const response = await dataService.query({
				query: GET_COLLECTIONS_BY_FRAGMENT_ID,
				variables: { fragmentId },
			});

			if (response.errors) {
				throw new CustomError('graphql response contains errors', null, { response });
			}

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle error
			throw new CustomError('Fetch collections by fragment id failed', err, {
				query: 'GET_COLLECTIONS_BY_FRAGMENT_ID',
				variables: { fragmentId },
			});
		}
	}

	public static async fetchCollectionsByOwner(
		user: Avo.User.User,
		offset: number,
		limit: number,
		order: any,
		contentTypeId: ContentTypeNumber.collection | ContentTypeNumber.bundle
	) {
		let variables: any;
		try {
			variables = {
				offset,
				limit,
				order,
				type_id: contentTypeId,
				owner_profile_id: getProfileId(user),
			};
			const response = await dataService.query({
				variables,
				query: GET_COLLECTIONS_BY_OWNER,
			});

			if (response.errors) {
				throw new CustomError('graphql response contains errors', null, { response });
			}

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle error
			throw new CustomError('Fetch collections by fragment id failed', err, {
				variables,
				query: 'GET_COLLECTIONS_BY_OWNER',
			});
		}
	}

	public static async fetchUuidByAvo1Id(avo1Id: string): Promise<string | null> {
		try {
			const response = await fetchWithLogout(
				`${getEnv('PROXY_URL')}/collections/fetch-uuid-by-avo1-id?${queryString.stringify({
					id: avo1Id,
				})}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				}
			);
			if (response.status < 200 || response.status >= 400) {
				throw new CustomError(
					'Failed to get external_id from /collections/fetch-uuid-by-avo1-id',
					null,
					{
						response,
					}
				);
			}
			return get(await response.json(), 'uuid') || null;
		} catch (err) {
			throw new CustomError('Failed to get collection or bundle uuid by avo1 id', err, {
				avo1Id,
			});
		}
	}
}
