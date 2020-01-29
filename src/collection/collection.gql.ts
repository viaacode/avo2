import { gql } from 'apollo-boost';

// TODO: Reduce to only what we need.
export const GET_COLLECTION_ID_BY_AVO1_ID = gql`
	query getCollectionIdByAvo1Id($avo1Id: String!) {
		app_collections(where: { avo1_id: { _eq: $avo1Id } }) {
			id
		}
	}
`;

export const GET_COLLECTION_BY_ID = gql`
	query getCollectionById($id: uuid!) {
		app_collections(where: { id: { _eq: $id } }) {
			id
			description
			collection_fragments {
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
				alternative_email
				avatar
				id
				location
				stamboek
				updated_at
				user_id
				user: usersByuserId {
					id
					created_at
					expires_at
					external_uid
					first_name
					last_name
					mail
					organisation_id
					role_id
					type
					uid
					updated_at
					role {
						id
						name
						label
					}
				}
				created_at
				updated_at
			}
			organisation_id
			is_public
			external_id
			depublish_at
			created_at
			label_redactie_id
			label_redactie {
				updated_at
				label
				id
				created_at
				alt_label
			}
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
		}
	}
`;

export const GET_ITEMS_BY_IDS = gql`
	query getCollectionsByIds($ids: [bpchar!]!) {
		items: app_item_meta(where: { external_id: { _in: $ids } }) {
			id
			external_id
			duration
			title
			description
			thumbnail_path
			issued
			type {
				id
				label
			}
			organisation {
				name
				logo_url
			}
		}
	}
`;

export const UPDATE_COLLECTION = gql`
	mutation updateCollectionById($id: Int!, $collection: app_collections_set_input!) {
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
				collection_fragments {
					id
				}
			}
		}
	}
`;

export const DELETE_COLLECTION = gql`
	mutation deleteCollectionById($id: Int!) {
		delete_app_collections(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;

export const UPDATE_COLLECTION_FRAGMENT = gql`
	mutation updateCollectionById($id: Int!, $fragment: app_collection_fragments_set_input!) {
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
				use_custom_fields
				updated_at
				start_oc
				position
				id
				external_id
				item_meta {
					id
					duration
					title
					description
					thumbnail_path
					issued
					type {
						id
						label
					}
					organisation {
						name
						logo_url
					}
				}
				end_oc
				custom_title
				custom_description
				created_at
				collection_uuid
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
			profile {
				id
				alias
				alternative_email
				avatar
				created_at
				location
				stamboek
				updated_at
				user_id
				user: usersByuserId {
					id
					first_name
					last_name
					role {
						id
						label
					}
				}
			}
			is_public
			external_id
			depublish_at
			created_at
			thumbnail_path
		}
	}
`;

export const GET_COLLECTIONS = gql`
	query getCollections($limit: Int!) {
		app_collections(limit: $limit) {
			id
			title
		}
	}
`;

export const GET_COLLECTION_TITLES_BY_OWNER = gql`
	query getCollectionNamesByOwner($owner_profile_id: uuid) {
		app_collections(where: { type_id: { _eq: 3 }, owner_profile_id: { _eq: $owner_profile_id } }) {
			id
			title
		}
	}
`;

export const GET_BUNDLE_TITLES_BY_OWNER = gql`
	query getCollectionNamesByOwner($owner_profile_id: uuid) {
		app_collections(where: { type_id: { _eq: 4 }, owner_profile_id: { _eq: $owner_profile_id } }) {
			id
			title
		}
	}
`;
