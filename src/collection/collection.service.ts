import { ExecutionResult, MutationFunction } from '@apollo/react-common';
import { cloneDeep, compact, get, isNil, without } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { getProfileId } from '../authentication/helpers/get-profile-info';
import { GET_BUNDLES, GET_BUNDLES_BY_TITLE, GET_COLLECTIONS_BY_IDS } from '../bundle/bundle.gql';
import { APP_PATH } from '../constants';
import { CustomError } from '../shared/helpers';
import { isUuid } from '../shared/helpers/uuid';
import { ApolloCacheManager, dataService, ToastService } from '../shared/services';
import { getThumbnailForCollection } from '../shared/services/stills-service';
import i18n from '../shared/translations/i18n';

import {
	GET_BUNDLE_TITLES_BY_OWNER,
	GET_BUNDLES_CONTAINING_COLLECTION,
	GET_COLLECTION_BY_ID,
	GET_COLLECTION_ID_BY_AVO1_ID,
	GET_COLLECTION_TITLES_BY_OWNER,
	GET_COLLECTIONS,
	GET_COLLECTIONS_BY_TITLE,
	GET_ITEMS_BY_IDS,
} from './collection.gql';
import {
	cleanCollectionBeforeSave,
	getFragmentIdsFromCollection,
	getFragmentsFromCollection,
	getValidationErrorForSave,
	getValidationErrorsForPublish,
} from './collection.helpers';
import { ContentTypeNumber } from './collection.types';

export class CollectionService {
	/**
	 * Insert collection and underlying collection fragments.
	 *
	 * @param newCollection Collection that must be inserted.
	 */
	// TODO: apply queryServer.mutate
	public static async insertCollection(
		newCollection: Partial<Avo.Collection.Collection>,
		triggerCollectionInsert: any | undefined, // can be undefined when saving an existing collection TODO: type
		triggerCollectionFragmentsInsert: MutationFunction<any>
	): Promise<Avo.Collection.Collection> {
		try {
			newCollection.created_at = new Date().toISOString();
			newCollection.updated_at = newCollection.created_at;
			const cleanedCollection = cleanCollectionBeforeSave(newCollection);

			// insert collection // TODO: handle undefined TriggerCollectionInsert
			const insertResponse: void | ExecutionResult<
				Avo.Collection.Collection
			> = await triggerCollectionInsert({
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

			// retrieve collection ragments from inserted collection
			const fragments = getFragmentsFromCollection(newCollection);

			// insert fragments
			if (fragments && fragments.length) {
				newCollection.collection_fragments = await this.insertFragments(
					newCollection.id,
					fragments,
					triggerCollectionFragmentsInsert
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

	/**
	 * Update collection and underlying collection fragments.
	 *
	 * @param initialCollection Original collection object.
	 * @param updatedCollection Collection that must be updated.
	 */
	// TODO: apply queryServer.mutate
	public static async updateCollection(
		initialCollection: Avo.Collection.Collection | null,
		updatedCollection: Avo.Collection.Collection,
		triggerCollectionUpdate: MutationFunction<any>,
		triggerCollectionFragmentInsert: MutationFunction<any>,
		triggerCollectionFragmentDelete: MutationFunction<any>,
		triggerCollectionFragmentUpdate: MutationFunction<any>
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
				validationErrors = getValidationErrorsForPublish(updatedCollection);
			} else {
				validationErrors = getValidationErrorForSave(updatedCollection);
			}

			// display validation errors
			if (validationErrors.length) {
				ToastService.danger(validationErrors);
				return null;
			}

			let newCollection: Partial<Avo.Collection.Collection> = cloneDeep(updatedCollection);

			// remove custom_title and custom_description if user wants to use the item's original title and description
			(newCollection.collection_fragments || []).forEach(
				(fragment: Avo.Collection.Fragment) => {
					if (!fragment.use_custom_fields) {
						delete fragment.custom_title;
						delete fragment.custom_description;
					}
				}
			);

			// null should not default to to prevent defaulting of null, we don't use lodash's default value parameter
			const initialFragmentIds: number[] = getFragmentIdsFromCollection(initialCollection);
			const currentFragmentIds: number[] = getFragmentIdsFromCollection(updatedCollection);
			const newFragmentIds: number[] = getFragmentIdsFromCollection(newCollection);
			const currentFragments: Avo.Collection.Fragment[] = get(
				updatedCollection,
				'collection_fragments',
				[]
			);

			// insert fragments that were added to collection
			const insertFragmentIds = without(newFragmentIds, ...initialFragmentIds);

			// delete fragments that were removed from collection
			const deleteFragmentIds = without(initialFragmentIds, ...newFragmentIds);

			// update fragments that are neither inserted nor deleted
			const updateFragmentIds = currentFragmentIds.filter((fragmentId: number) =>
				initialFragmentIds.includes(fragmentId)
			);

			// insert fragments
			const insertPromises: Promise<any>[] = [];

			insertFragmentIds.forEach(tempId => {
				insertPromises.push(
					this.insertFragment(
						updatedCollection,
						tempId,
						currentFragments,
						triggerCollectionFragmentInsert
					)
				);
			});

			// delete fragments
			const deletePromises: Promise<any>[] = [];

			deleteFragmentIds.forEach((id: number) => {
				deletePromises.push(
					triggerCollectionFragmentDelete({
						variables: { id },
					})
				);
			});

			// update fragments
			const updatePromises: Promise<any>[] = [];
			updateFragmentIds.forEach((id: number) => {
				let fragmentToUpdate:
					| Avo.Collection.Fragment
					| undefined = getFragmentsFromCollection(updatedCollection).find(
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
					return;
				}

				fragmentToUpdate = cloneDeep(fragmentToUpdate);

				delete (fragmentToUpdate as any).__typename;
				delete fragmentToUpdate.item_meta;

				updatePromises.push(
					triggerCollectionFragmentUpdate({
						variables: {
							id,
							fragment: fragmentToUpdate,
						},
					})
				);
			});

			// perform crud requests in parallel
			const crudPromises: Promise<any[]>[] = [
				Promise.all(insertPromises),
				Promise.all(deletePromises),
				Promise.all(updatePromises),
			];

			const crudResponses = await Promise.all(crudPromises);

			// process responses of inserted fragments
			crudResponses[0].forEach((data: any) => {
				const newFragments = [
					...getFragmentsFromCollection(newCollection).filter(
						(fragment: Avo.Collection.Fragment) => fragment.id !== data.oldId
					),
					data.newFragment,
				];
				newCollection = {
					...newCollection,
					collection_fragments: newFragments,
				};
			});

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

			await triggerCollectionUpdate({
				variables: {
					id: cleanedCollection.id,
					collection: cleanedCollection,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});

			return newCollection as Avo.Collection.Collection;
		} catch (err) {
			// handle error
			const customError = new CustomError(
				'Failed to update collection or its fragments',
				err,
				{
					initialCollection,
					updatedCollection,
					triggerCollectionUpdate,
					triggerCollectionFragmentInsert,
					triggerCollectionFragmentDelete,
					triggerCollectionFragmentUpdate,
				}
			);

			console.error(customError);

			return null;
		}
	}

	/**
	 * Delete collection by id.
	 *
	 * @param history Object to allow navigation when successful.
	 * @param collectionId Unique identifier of the collection.
	 */
	// TODO: apply queryServer.mutate
	public static deleteCollection = async (
		history: any,
		collectionId: string,
		triggerCollectionDelete: any
	) => {
		try {
			// delete collection by id
			await triggerCollectionDelete({
				variables: {
					id: collectionId,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});

			// navigate to workspace TODO: This should not be in the service.
			history.push(APP_PATH.WORKSPACE.route);

			// display success toast
			ToastService.success(
				i18n.t(
					'collection/views/collection-detail___de-collectie-werd-succesvol-verwijderd'
				)
			);
		} catch (err) {
			// handle error
			const customError = new CustomError('Failed to delete collection', err, {
				collectionId,
			});

			console.error(customError);

			// display error toast
			ToastService.danger(
				i18n.t(
					'collection/views/collection-detail___het-verwijderen-van-de-collectie-is-mislukt'
				)
			);
		}
	};

	/**
	 * Add duplicate of collection
	 *
	 * @param history Object to allow navigation when successful.
	 * @param collectionId Unique identifier of the collection.
	 *
	 * @returns Duplicate collection.
	 */
	// TODO: apply queryServer.mutate
	public static async duplicateCollection(
		collection: Avo.Collection.Collection,
		user: Avo.User.User,
		copyPrefix: string,
		copyRegex: RegExp,
		triggerCollectionInsert: any,
		triggerCollectionFragmentsInsert: any
	): Promise<Avo.Collection.Collection> {
		const collectionToInsert = { ...collection };

		// update attributes specific to duplicate
		collectionToInsert.owner_profile_id = getProfileId(user);
		collectionToInsert.is_public = false;

		// remove id from duplicate
		delete collectionToInsert.id;

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

		// insert duplicated collection // TODO: Surround with try/catch
		return await CollectionService.insertCollection(
			collectionToInsert,
			triggerCollectionInsert,
			triggerCollectionFragmentsInsert
		);
	}

	/**
	 * Retrieve collections.
	 *
	 * @param limit Numeric value to define the maximum amount of items in response.
	 *
	 * @returns Collections limited by `limit`.
	 */
	// TODO: apply queryServer.mutate
	public static async fetchCollections(limit: number): Promise<Avo.Collection.Collection[]> {
		try {
			// retrieve collections
			const response = await dataService.query({
				query: GET_COLLECTIONS,
				variables: { limit },
			});

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle error
			const customError = new CustomError('Het ophalen van de collecties is mislukt.', err, {
				query: 'GET_COLLECTIONS',
				variables: { limit },
			});

			console.error(customError);

			throw customError;
		}
	}

	/**
	 * Retrieve bundles.
	 *
	 * @param limit Numeric value to define the maximum amount of items in response.
	 *
	 * @returns Bundles limited by `limit`.
	 */
	// TODO: apply queryServer.mutate
	// TODO: Move to bundle.service.ts
	public static async fetchBundles(limit?: number): Promise<Avo.Collection.Collection[]> {
		try {
			// retrieve bundles
			const response = await dataService.query({
				query: GET_BUNDLES,
				variables: { limit },
			});

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle error
			const customError = new CustomError('Failed to retrieve bundles', err, {
				query: 'GET_BUNDLES',
			});

			console.error(customError);

			throw customError;
		}
	}

	/**
	 * Retrieve collections by title.
	 *
	 * @param title Keyword to search for collection title.
	 * @param limit Numeric value to define the maximum amount of items in response.
	 *
	 * @returns Collections limited by `limit`, found using the `title` wildcarded keyword.
	 */
	// TODO: apply queryServer.mutate
	public static async fetchCollectionsByTitle(
		title: string,
		limit: number
	): Promise<Avo.Collection.Collection[]> {
		try {
			// retrieve collections by title
			const response = await dataService.query({
				query: GET_COLLECTIONS_BY_TITLE,
				variables: { title, limit },
			});

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle erroor
			const customError = new CustomError('Het ophalen van de collecties is mislukt.', err, {
				query: 'GET_COLLECTIONS_BY_TITLE',
				variables: { title, limit },
			});

			console.error(customError);

			throw customError;
		}
	}

	/**
	 * Retrieve bundles by title.
	 *
	 * @param title Keyword to search for bundle title.
	 * @param limit Numeric value to define the maximum amount of items in response.
	 *
	 * @returns Bundles limited by `limit`, found using the `title` wildcarded keyword.
	 */
	// TODO: apply queryServer.mutate
	// TODO: Move to bundle.service.ts
	public static async fetchBundlesByTitle(
		title: string,
		limit?: number
	): Promise<Avo.Collection.Collection[]> {
		try {
			// retrieve bundles by title
			const response = await dataService.query({
				query: GET_BUNDLES_BY_TITLE,
				variables: { title, limit },
			});

			return get(response, 'data.app_collections', []);
		} catch (err) {
			// handle error
			const customError = new CustomError('Het ophalen van de bundels is mislukt.', err, {
				query: 'GET_BUNDLES_BY_TITLE',
			});

			console.error(customError);

			throw customError;
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
	// TODO: apply queryServer.mutate
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
	// TODO: apply queryServer.mutate
	public static async fetchCollectionOrBundleById(
		collectionId: string,
		type: 'collection' | 'bundle'
	): Promise<Avo.Collection.Collection | undefined> {
		// fetch collection or bundle by id // TODO: Add try/catch.
		const response = await dataService.query({
			query: GET_COLLECTION_BY_ID,
			variables: { id: collectionId },
		});

		if (response.errors) {
			throw new CustomError(
				`Failed to retrieve ${type} from database because of graphql errors`,
				null,
				{
					collectionId,
					errors: response.errors,
				}
			);
		}

		const collectionObj: Avo.Collection.Collection | null = get(
			response,
			'data.app_collections[0]'
		);

		if (!collectionObj) {
			throw new CustomError(`query for ${type} returned empty result`, null, {
				collectionId,
				response,
			});
		}
		// Collection/bundle loaded successfully
		if (collectionObj.type_id !== ContentTypeNumber[type]) {
			return undefined;
		}

		return collectionObj;
	}

	/**
	 * Retrieve collection or bundle and underlying items or collections by id.
	 *
	 * @param collectionId Unique id of the collection that must be fetched.
	 * @param type Type of which items should be fetched.
	 *
	 * @returns Collection or bundle.
	 */
	// TODO: apply queryServer.mutate // TODO: Add try/catch
	public static async fetchCollectionsOrBundlesWithItemsById(
		collectionId: string,
		type: 'collection' | 'bundle'
	): Promise<Avo.Collection.Collection | undefined> {
		// retrieve collection or bundle by id
		const collectionOrBundle = await this.fetchCollectionOrBundleById(collectionId, type);

		// handle empty response
		if (!collectionOrBundle) {
			return undefined;
		}

		// retrieve items/collections for each collection_fragment that has an external_id set
		const ids: string[] = compact(
			(collectionOrBundle.collection_fragments || []).map((collectionFragment, index) => {
				// reset positions to a list of ordered integers, db ensures sorting on previoous positin
				collectionFragment.position = index;

				// TODO: replace this by a check on collectionFragment.type === 'ITEM' || collectionFragment.type === 'COLLECTION'
				// return external id if set
				if (collectionFragment.external_id !== '-1') {
					return collectionFragment.external_id;
				}

				return null;
			})
		);

		try {
			// retrieve items of collection or bundle
			const response = await dataService.query({
				query: type === 'collection' ? GET_ITEMS_BY_IDS : GET_COLLECTIONS_BY_IDS,
				variables: { ids },
			});

			// add meta data to each item
			const itemInfos: any[] = get(response, 'data.items', []);

			itemInfos.forEach((itemInfo: any) => {
				const collectionFragment:
					| Avo.Collection.Fragment
					| undefined = collectionOrBundle.collection_fragments.find(
					fragment =>
						fragment.external_id ===
						(type === 'collection' ? itemInfo.external_id : itemInfo.id)
				);

				if (collectionFragment) {
					collectionFragment.item_meta = itemInfo;

					if (!collectionFragment.use_custom_fields) {
						collectionFragment.custom_description = itemInfo.description;
						collectionFragment.custom_title = itemInfo.title;
					}
				}
			});

			return collectionOrBundle;
		} catch (err) {
			// handle error
			const customError = new CustomError(
				'Failed to get fragments inside the collection',
				err,
				{
					ids,
				}
			);

			console.error(customError);

			throw customError;
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

	private static async insertFragments(
		collectionId: string,
		fragments: Avo.Collection.Fragment[],
		triggerCollectionFragmentsInsert: any
	): Promise<Avo.Collection.Fragment[]> {
		fragments.forEach(fragment => ((fragment as any).collection_uuid = collectionId));
		fragments.forEach(fragment => ((fragment as any).collection_id = '')); // TODO remove once database allows it

		const cleanedFragments = cloneDeep(fragments).map(fragment => {
			delete fragment.id;
			delete (fragment as any).__typename;
			delete fragment.item_meta;
			return fragment;
		});

		const response = await triggerCollectionFragmentsInsert({
			variables: {
				id: collectionId,
				fragments: cleanedFragments,
			},
			update: ApolloCacheManager.clearCollectionCache,
		});

		get(response, 'data.insert_app_collection_fragments.returning', []).forEach(
			(f: { id: number }, index: number) => {
				fragments[index].id = f.id;
			}
		);

		return fragments;
	}

	private static async insertFragment(
		collection: Partial<Avo.Collection.Collection>,
		tempId: number,
		currentFragments: Avo.Collection.Fragment[],
		triggerCollectionFragmentInsert: any
	) {
		if (!collection) {
			ToastService.danger(i18n.t('collection/collection___de-collectie-was-niet-ingesteld'));
			return;
		}

		const tempFragment = currentFragments.find(
			(fragment: Avo.Collection.Fragment) => fragment.id === tempId
		);

		if (!tempFragment) {
			ToastService.info(
				i18n.t('collection/collection___fragment-om-toe-te-voegen-is-niet-gevonden-id-id', {
					id: tempId,
				})
			);
			return;
		}

		const fragmentToAdd: Avo.Collection.Fragment = { ...tempFragment };
		const oldId = fragmentToAdd.id;

		delete fragmentToAdd.id;
		delete (fragmentToAdd as any).__typename;
		delete fragmentToAdd.item_meta;

		const response = await triggerCollectionFragmentInsert({
			variables: {
				id: collection.id,
				fragments: fragmentToAdd,
			},
			update: ApolloCacheManager.clearCollectionCache,
		});

		const newFragment = get(response, 'data.insert_app_collection_fragments.returning[0]');

		return {
			newFragment,
			oldId,
		};
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
				return await getThumbnailForCollection(collection);
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

	public static getCollectionIdByAvo1Id = async (id: string) => {
		if (isUuid(id)) {
			return id;
		}

		const response = await dataService.query({
			query: GET_COLLECTION_ID_BY_AVO1_ID,
			variables: {
				avo1Id: id,
			},
		});

		if (!response) {
			return null;
		}

		return get(response, 'data.app_collections[0].id', null);
	};

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
		const titles = collections.map(c => c.title);

		let index = 0;
		let candidateTitle: string;
		const titleWithoutCopy = existingTitle.replace(copyRegex, '');

		do {
			index += 1;
			candidateTitle = copyPrefix.replace('%index%', String(index)) + titleWithoutCopy;
		} while (titles.includes(candidateTitle));

		return candidateTitle;
	};
}
