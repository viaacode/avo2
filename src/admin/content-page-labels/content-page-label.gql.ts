import { gql } from 'apollo-boost';

export const GET_CONTENT_PAGE_LABELS = gql`
	query getAllContentPageLabels(
		$where: app_content_labels_bool_exp!
		$offset: Int!
		$limit: Int!
		$orderBy: [app_content_labels_order_by!]!
	) {
		app_content_labels(offset: $offset, limit: $limit, order_by: $orderBy, where: $where) {
			label
			content_type
			link_to
			created_at
			updated_at
			id
		}
		app_content_labels_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;

export const DELETE_CONTENT_PAGE_LABEL = gql`
	mutation deleteContentPageLabelById($id: Int!) {
		delete_app_content_labels(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;

export const GET_CONTENT_PAGE_LABEL_BY_ID = gql`
	query getContentPageLabelById($id: Int!) {
		app_content_labels(where: { id: { _eq: $id } }) {
			label
			id
			content_type
			link_to
			created_at
			updated_at
		}
	}
`;

export const GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_LABEL = gql`
	query getContentPageLabelsByTypeAndLabels($contentType: String!, $labels: [String!]!) {
		app_content_labels(
			where: { label: { _in: $labels }, content_type: { _eq: $contentType } }
		) {
			label
			id
		}
	}
`;

export const GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_ID = gql`
	query getContentPageLabelsByTypeAndIds($contentType: String!, $labelIds: [Int!]!) {
		app_content_labels(where: { id: { _in: $labelIds }, content_type: { _eq: $contentType } }) {
			label
			id
		}
	}
`;

export const INSERT_CONTENT_PAGE_LABEL = gql`
	mutation insertContentPageLabel($contentPageLabel: app_content_labels_insert_input!) {
		insert_app_content_labels(objects: [$contentPageLabel]) {
			returning {
				id
			}
		}
	}
`;

export const UPDATE_CONTENT_PAGE_LABEL = gql`
	mutation insertContentPageLabel(
		$contentPageLabel: app_content_labels_set_input!
		$contentPageLabelId: Int!
	) {
		update_app_content_labels(
			where: { id: { _eq: $contentPageLabelId } }
			_set: $contentPageLabel
		) {
			affected_rows
		}
	}
`;
