import { gql } from 'apollo-boost';

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
						value
					}
					id
					label
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
			owner_profile_id
		}
	}
`;

export const GET_ASSIGNMENT_BY_CONTENT_ID_AND_TYPE = gql`
	query getAssignmentsByContentIdAndType(
		$contentId: String!
		$contentType: lookup_enum_assignment_content_labels_enum!
	) {
		app_assignments(
			where: {
				content_id: { _eq: $contentId }
				content_label: { _eq: $contentType }
				is_deleted: { _eq: false }
			}
		) {
			id
			title
			profile {
				user: usersByuserId {
					id
					first_name
					last_name
				}
			}
			is_archived
		}
	}
`;

export const GET_ASSIGNMENTS_BY_OWNER_ID = gql`
	query getAssignmentsByOwner(
		$owner_profile_id: uuid
		$offset: Int = 0
		$limit: Int
		$order: app_assignments_order_by! = { deadline_at: desc }
		$filter: [app_assignments_bool_exp]
	) {
		app_assignments(
			where: {
				owner_profile_id: { _eq: $owner_profile_id }
				is_deleted: { _eq: false }
				_and: $filter
			}
			offset: $offset
			limit: $limit
			order_by: [$order]
		) {
			assignment_assignment_tags(order_by: { assignment_tag: { label: asc } }) {
				assignment_tag {
					color_enum_value
					color_override
					enum_color {
						label
						value
					}
					id
					label
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
			owner_profile_id
			created_at
		}
		count: app_assignments_aggregate(
			where: {
				owner_profile_id: { _eq: $owner_profile_id }
				is_deleted: { _eq: false }
				_or: $filter
			}
		) {
			aggregate {
				count
			}
		}
	}
`;

export const GET_ASSIGNMENTS_BY_RESPONSE_OWNER_ID = gql`
	query getAssignmentsByResponseOwnerId(
		$owner_profile_id: String!
		$offset: Int = 0
		$limit: Int
		$filter: [app_assignments_bool_exp]
		$order: app_assignments_order_by!
	) {
		app_assignments(
			where: {
				assignment_responses: { owner_profile_ids: { _has_key: $owner_profile_id } }
				is_deleted: { _eq: false }
				_and: $filter
			}
			limit: $limit
			offset: $offset
			order_by: [$order]
		) {
			assignment_assignment_tags {
				assignment_tag {
					color_enum_value
					color_override
					enum_color {
						label
						value
					}
					id
					label
				}
			}
			assignment_responses {
				id
				submitted_at
			}
			assignment_type
			class_room
			deadline_at
			id
			is_archived
			is_deleted
			title
			created_at
			owner_profile_id
			profile {
				user: usersByuserId {
					first_name
					last_name
					id
				}
				avatar
				organisation {
					logo_url
					name
					or_id
				}
				id
			}
		}
		count: app_assignments_aggregate(
			where: {
				assignment_responses: { owner_profile_ids: { _has_key: $owner_profile_id } }
				is_deleted: { _eq: false }
				_or: $filter
			}
		) {
			aggregate {
				count
			}
		}
	}
`;

export const GET_ASSIGNMENT_RESPONSES = gql`
	query getAssignmentResponses($profileId: String!, $assignmentId: Int) {
		app_assignment_responses(
			where: {
				owner_profile_ids: { _has_key: $profileId }
				assignment_id: { _eq: $assignmentId }
			}
		) {
			id
			assignment_id
		}
	}
`;

export const GET_ASSIGNMENT_WITH_RESPONSE = gql`
	query getAssignmentWithResponse($assignmentId: Int!, $pupilUuid: String!) {
		assignments: app_assignments(
			where: {
				id: { _eq: $assignmentId }
				is_deleted: { _eq: false }
				is_archived: { _eq: false }
			}
			order_by: [{ deadline_at: desc }]
		) {
			assignment_assignment_tags {
				id
				assignment_tag {
					color_enum_value
					color_override
					enum_color {
						label
						value
					}
					id
					label
				}
			}
			assignment_responses(where: { owner_profile_ids: { _has_key: $pupilUuid } }) {
				id
				created_at
				submitted_at
				owner_profile_ids
				assignment_id
				collection_uuid
			}
			assignment_type
			class_room
			deadline_at
			id
			is_archived
			is_deleted
			title
			description
			content_id
			content_label
			content_layout
			created_at
			updated_at
			answer_url
			owner_profile_id
			profile {
				id
				organisation {
					logo_url
					name
					or_id
				}
				profile_user_groups {
					groups {
						label
						id
					}
				}
				user: usersByuserId {
					id
					first_name
					last_name
				}
			}
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

export const UPDATE_ASSIGNMENT = gql`
	mutation updateAssignmentById($id: Int!, $assignment: app_assignments_set_input!) {
		update_app_assignments(where: { id: { _eq: $id } }, _set: $assignment) {
			affected_rows
		}
	}
`;

export const UPDATE_ASSIGNMENT_ARCHIVE_STATUS = gql`
	mutation toggleAssignmentArchiveStatus($id: Int!, $archived: Boolean!) {
		update_app_assignments(where: { id: { _eq: $id } }, _set: { is_archived: $archived }) {
			affected_rows
		}
	}
`;

export const UPDATE_ASSIGNMENT_RESPONSE_SUBMITTED_STATUS = gql`
	mutation toggleAssignmentResponseSubmitStatus($id: Int!, $submittedAt: timestamptz) {
		update_app_assignment_responses(
			where: { id: { _eq: $id } }
			_set: { submitted_at: $submittedAt }
		) {
			affected_rows
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

export const INSERT_ASSIGNMENT_RESPONSE = gql`
	mutation insertAssignmentResponse(
		$assignmentResponses: [app_assignment_responses_insert_input!]!
	) {
		insert_app_assignment_responses(objects: $assignmentResponses) {
			affected_rows
			returning {
				id
				created_at
				submitted_at
				owner_profile_ids
				assignment_id
				collection_uuid
			}
		}
	}
`;
