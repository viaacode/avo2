import { gql } from 'apollo-boost';

export const GET_USER_GROUP_BY_ID = gql`
	query getUserGroupById($id: Int!) {
		users_groups(where: { id: { _eq: $id } }) {
			label
			id
			description
			created_at
			updated_at
			group_user_permission_groups(order_by: { permission_group: { label: asc } }) {
				permission_group {
					label
					id
					created_at
					description
					updated_at
					permission_group_user_permissions(
						order_by: { permission: { description: asc } }
					) {
						permission {
							label
							description
							id
						}
					}
				}
			}
		}
	}
`;

export const GET_USER_GROUPS_WITH_FILTERS = gql`
	query getUserGroups(
		$limit: Int!
		$offset: Int!
		$orderBy: [users_groups_order_by!]!
		$where: users_groups_bool_exp!
	) {
		users_groups(limit: $limit, offset: $offset, order_by: $orderBy, where: $where) {
			label
			id
			created_at
			description
			updated_at
		}
		users_groups_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;

export const GET_ALL_PERMISSION_GROUPS = gql`
	query getAllPermissionGroups {
		users_permission_groups {
			id
			label
			description
			created_at
			updated_at
		}
	}
`;

export const ADD_PERMISSION_GROUPS_TO_USER_GROUP = gql`
	mutation linkPermissionGroupToUserGroup(
		$objs: [users_group_user_permission_groups_insert_input!]!
	) {
		insert_users_group_user_permission_groups(objects: $objs) {
			affected_rows
		}
	}
`;

export const REMOVE_PERMISSION_GROUPS_FROM_USER_GROUP = gql`
	mutation unlinkPermissionGroupFromUserGroup($userGroupId: Int!, $permissionGroupIds: [Int!]!) {
		delete_users_group_user_permission_groups(
			where: {
				user_group_id: { _eq: $userGroupId }
				user_permission_group_id: { _in: $permissionGroupIds }
			}
		) {
			affected_rows
		}
	}
`;

export const INSERT_USER_GROUP = gql`
	mutation insertUserGroup($userGroup: users_groups_insert_input!) {
		insert_users_groups(objects: [$userGroup]) {
			returning {
				id
			}
		}
	}
`;

export const UPDATE_USER_GROUP = gql`
	mutation updateUserGroup($userGroup: users_groups_set_input!, $userGroupId: Int!) {
		update_users_groups(where: { id: { _eq: $userGroupId } }, _set: $userGroup) {
			affected_rows
		}
	}
`;

export const DELETE_USER_GROUP = gql`
	mutation deleteUserGroup($userGroupId: Int!) {
		delete_users_groups(where: { id: { _eq: $userGroupId } }) {
			affected_rows
		}
	}
`;
