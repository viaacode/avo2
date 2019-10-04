import { gql } from 'apollo-boost';
import { ITEMS_PER_PAGE } from '../my-workspace/constants';

export const GET_ASSIGNMENT_BY_ID = gql`
	query getAssignmentsById($id: Int!) {
		app_assignments(where: { id: { _eq: $id } }) {
			answer_url
			assignment_assignment_tags {
				assignment_tag {
					color_enum_value
					color_override
					enum_color {
						label
					}
					id
				}
			}
			assignment_responses {
				id
			}
			assignment_type
			available_at
			class_room
			content_id
			content_label
			content_layout
			created_at
			deadline_at
			description
			id
			is_archived
			is_collaborative
			is_deleted
			title
			updated_at
		}
	}
`;

export const GET_ASSIGNMENTS_BY_OWNER_ID = gql`
  query getAssignmentsByOwner($ownerId: uuid, $archived: Boolean = false, $offset: Int = 0, $limit: Int = ${ITEMS_PER_PAGE}, $order: [app_assignments_order_by!] = {deadline_at: desc}, $filter: [app_assignments_bool_exp]) {
    assignments: app_assignments(where: { owner_uid: { _eq: $ownerId }, is_deleted: {_eq: false}, is_archived: {_eq: $archived}, _or: $filter}, offset: $offset, limit: $limit, order_by: $order) {
      assignment_assignment_tags {
        assignment_tag {
          color_enum_value
          color_override
          enum_color {
            label
          }
          id
        }
      }
      assignment_responses {
        id
      }
      assignment_type
      class_room
      deadline_at
      id
      is_archived
      is_deleted
      title
    }
		count: app_assignments_aggregate(where: { owner_uid: { _eq: $ownerId }, is_deleted: {_eq: false}, is_archived: {_eq: $archived}, _or: $filter}) {
			aggregate {
				count
			}
		}
  }
`;

export const UPDATE_ASSIGNMENT = gql`
	mutation updateAssignmentById($id: Int!, $assignment: app_assignments_set_input!) {
		update_app_assignments(where: { id: { _eq: $id } }, _set: $assignment) {
			affected_rows
		}
	}
`;

export const INSERT_ASSIGNMENT = gql`
	mutation insertAssignment($assignment: app_assignments_insert_input!) {
		insert_app_assignments(objects: [$assignment]) {
			affected_rows
			returning {
				id
			}
		}
	}
`;

export const DELETE_ASSIGNMENT = gql`
	mutation deleteAssignmentById($id: Int!) {
		delete_app_assignments(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;
