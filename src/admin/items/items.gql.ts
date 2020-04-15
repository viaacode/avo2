import { gql } from 'apollo-boost';

export const GET_ITEMS = gql`
	query getItems(
		$where: app_item_meta_bool_exp!
		$orderBy: [app_item_meta_order_by!]!
		$offset: Int!
		$limit: Int!
	) {
		app_item_meta(where: $where, order_by: $orderBy, offset: $offset, limit: $limit) {
			created_at
			depublish_at
			description
			duration
			expiry_date
			external_id
			uid
			is_deleted
			is_published
			issued
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
			org_id
			organisation {
				or_id
				name
			}
			publish_at
			published_at
			series
			title
			type {
				id
				label
			}
			updated_at
			view_counts_aggregate {
				aggregate {
					count
				}
			}
		}
	}
`;

export const GET_ITEM_BY_ID = gql`
	query getItems($id: uuid!) {
		app_item_meta(where: { uid: { _eq: $id } }) {
			thumbnail_path
			created_at
			depublish_at
			description
			duration
			expiry_date
			external_id
			uid
			is_deleted
			is_published
			issued
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
			org_id
			organisation {
				or_id
				name
			}
			publish_at
			published_at
			series
			title
			type {
				id
				label
			}
			updated_at
			view_counts_aggregate {
				aggregate {
					count
				}
			}
		}
	}
`;

export const GET_ITEM_BY_EXTERNAL_ID = gql`
	query getItems($externalId: bpchar!) {
		app_item_meta(where: { external_id: { _eq: $externalId } }) {
			thumbnail_path
			created_at
			depublish_at
			description
			duration
			expiry_date
			external_id
			uid
			is_deleted
			is_published
			issued
			lom_classification
			lom_context
			lom_intendedenduserrole
			lom_keywords
			lom_languages
			lom_typicalagerange
			org_id
			organisation {
				or_id
				name
			}
			publish_at
			published_at
			series
			title
			type {
				id
				label
			}
			updated_at
			view_counts_aggregate {
				aggregate {
					count
				}
			}
		}
	}
`;

export const UPDATE_ITEM = gql`
	mutation updateItemPublishedState($id: uuid!, $isPublished: Boolean!) {
		update_app_item_meta(where: { uid: { _eq: $id } }, _set: { is_published: $isPublished }) {
			affected_rows
		}
	}
`;
