import { gql } from 'apollo-boost';

// TODO: Reduce to only what we need.
export const GET_COLLECTION_BY_ID = gql`
	query getCollectionById($id: uuid!) {
		app_collections(where: { id: { _eq: $id } }) {
			id
			description
			description_long
			collection_fragments(order_by: { position: asc }) {
				use_custom_fields
				updated_at
				start_oc
				position
				id
				external_id
				end_oc
				custom_title
				custom_description
				created_at
				collection_uuid
				type
				thumbnail_path
			}
			updated_at
			type_id
			type {
				label
				id
			}
			title
			note
			thumbnail_path
			publish_at
			owner_profile_id
			profile {
				alias
				title
				alternative_email
				avatar
				id
				stamboek
				updated_at
				profile_user_groups {
					groups {
						label
						id
					}
				}
				user_id
				user: usersByuserId {
					id
					created_at
					expires_at
					external_uid
					first_name
					last_name
					mail
					uid
					updated_at
				}
				created_at
				updated_at
				organisation {
					logo_url
					name
					or_id
				}
			}
			is_public
			external_id
			depublish_at
			created_at
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
			updated_by {
				id
				user: usersByuserId {
					id
					first_name
					last_name
					profile {
						profile_user_groups {
							groups {
								label
								id
							}
						}
					}
				}
			}
			collection_labels {
				label
				id
			}
			relations(where: { predicate: { _eq: "IS_COPY_OF" } }) {
				object_meta {
					id
					title
				}
			}
		}
	}
`;

export const UPDATE_COLLECTION = gql`
	mutation updateCollectionById($id: uuid!, $collection: app_collections_set_input!) {
		update_app_collections(where: { id: { _eq: $id } }, _set: $collection) {
			affected_rows
		}
	}
`;

export const INSERT_COLLECTION = gql`
	mutation insertCollection($collection: app_collections_insert_input!) {
		insert_app_collections(objects: [$collection]) {
			affected_rows
			returning {
				id
				title
				collection_fragments(order_by: { position: asc }) {
					id
				}
			}
		}
	}
`;

export const DELETE_COLLECTION = gql`
	mutation deleteCollectionById($id: uuid!) {
		delete_app_collections(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;

export const UPDATE_COLLECTION_FRAGMENT = gql`
	mutation updateCollectionFragmentById(
		$id: Int!
		$fragment: app_collection_fragments_set_input!
	) {
		update_app_collection_fragments(where: { id: { _eq: $id } }, _set: $fragment) {
			affected_rows
		}
	}
`;

export const DELETE_COLLECTION_FRAGMENT = gql`
	mutation deleteCollectionFragmentById($id: Int!) {
		delete_app_collection_fragments(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;

export const INSERT_COLLECTION_FRAGMENTS = gql`
	mutation insertCollectionFragment(
		$id: Int!
		$fragments: [app_collection_fragments_insert_input!]!
	) {
		insert_app_collection_fragments(objects: $fragments) {
			affected_rows
			returning {
				id
			}
		}
	}
`;

export const GET_COLLECTIONS_BY_OWNER = gql`
	query getCollectionsByOwner(
		$owner_profile_id: uuid
		$type_id: Int
		$offset: Int = 0
		$limit: Int
		$order: [app_collections_order_by!] = { updated_at: desc }
	) {
		app_collections(
			where: { type_id: { _eq: $type_id }, owner_profile_id: { _eq: $owner_profile_id } }
			offset: $offset
			limit: $limit
			order_by: $order
		) {
			id
			updated_at
			type_id
			type {
				label
				id
			}
			title
			publish_at
			owner_profile_id
			profile {
				id
				alias
				title
				alternative_email
				avatar
				organisation {
					logo_url
					name
					or_id
				}
				created_at
				stamboek
				updated_at
				user_id
				user: usersByuserId {
					id
					first_name
					last_name
					profile {
						profile_user_groups {
							groups {
								label
								id
							}
						}
					}
				}
			}
			is_public
			external_id
			depublish_at
			created_at
			thumbnail_path
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

export const GET_PUBLIC_COLLECTIONS = gql`
	query getCollections($limit: Int!, $typeId: Int!) {
		app_collections(
			order_by: { title: asc }
			where: { type_id: { _eq: $typeId }, is_public: { _eq: true } }
			limit: $limit
		) {
			id
			title
		}
	}
`;

export const GET_PUBLIC_COLLECTIONS_BY_ID = gql`
	query getCollections($id: uuid!, $typeId: Int!, $limit: Int!) {
		app_collections(
			order_by: { title: asc }
			where: { type_id: { _eq: $typeId }, id: { _eq: $id }, is_public: { _eq: true } }
			limit: $limit
		) {
			id
			title
		}
	}
`;

export const GET_PUBLIC_COLLECTIONS_BY_TITLE = gql`
	query getCollections($title: String!, $typeId: Int!, $limit: Int!) {
		app_collections(
			order_by: { title: asc }
			where: {
				type_id: { _eq: $typeId }
				title: { _ilike: $title }
				is_public: { _eq: true }
			}
			limit: $limit
		) {
			id
			title
		}
	}
`;

export const GET_COLLECTION_TITLES_BY_OWNER = gql`
	query getCollectionNamesByOwner($owner_profile_id: uuid) {
		app_collections(
			where: { type_id: { _eq: 3 }, owner_profile_id: { _eq: $owner_profile_id } }
			order_by: { updated_at: desc }
		) {
			id
			title
		}
	}
`;

export const GET_BUNDLE_TITLES_BY_OWNER = gql`
	query getCollectionNamesByOwner($owner_profile_id: uuid) {
		app_collections(
			where: { type_id: { _eq: 4 }, owner_profile_id: { _eq: $owner_profile_id } }
			order_by: { updated_at: desc }
		) {
			id
			title
		}
	}
`;

export const GET_BUNDLES_CONTAINING_COLLECTION = gql`
	query getPublishedBundlesContainingCollection($id: String!) {
		app_collections(
			where: { is_public: { _eq: true }, collection_fragments: { external_id: { _eq: $id } } }
		) {
			id
			title
		}
	}
`;

export const INSERT_COLLECTION_LABELS = gql`
	mutation insertCollectionLabels($objects: [app_collection_labels_insert_input!]!) {
		insert_app_collection_labels(objects: $objects) {
			affected_rows
		}
	}
`;

export const DELETE_COLLECTION_LABELS = gql`
	mutation deleteCollectionLabels($labels: [String!]!, $collectionId: uuid!) {
		delete_app_collection_labels(
			where: { label: { _in: $labels }, collection_uuid: { _eq: $collectionId } }
		) {
			affected_rows
		}
	}
`;

export const GET_QUALITY_LABELS = gql`
	query getQualityLabels {
		lookup_enum_collection_labels {
			description
			value
		}
	}
`;

export const GET_COLLECTION_BY_TITLE_OR_DESCRIPTION = gql`
	query getCollectionByTitleOrDescription(
		$title: String!
		$description: String!
		$collectionId: uuid!
		$typeId: Int
	) {
		collectionByTitle: app_collections(
			where: {
				title: { _eq: $title }
				is_deleted: { _eq: false }
				is_public: { _eq: true }
				id: { _neq: $collectionId }
				type_id: { _eq: $typeId }
			}
			limit: 1
		) {
			id
		}
		collectionByDescription: app_collections(
			where: {
				description: { _eq: $description }
				is_deleted: { _eq: false }
				is_public: { _eq: true }
				id: { _neq: $collectionId }
				type_id: { _eq: $typeId }
			}
			limit: 1
		) {
			id
		}
	}
`;

export const GET_COLLECTIONS_BY_FRAGMENT_ID = gql`
	query getCollectionsByItemUuid($fragmentId: String!) {
		app_collections(where: { collection_fragments: { external_id: { _eq: $fragmentId } } }) {
			id
			title
			is_public
			profile {
				user: usersByuserId {
					first_name
					last_name
					id
				}
				id
				organisation {
					name
				}
			}
		}
	}
`;

export const INSERT_COLLECTION_RELATION = gql`
	mutation insertCollectionRelation(
		$originalId: uuid!
		$otherId: uuid!
		$relationType: lookup_enum_relation_types_enum!
	) {
		insert_app_collection_relations(
			objects: [{ object: $originalId, subject: $otherId, predicate: $relationType }]
		) {
			returning {
				id
			}
		}
	}
`;
