import { gql } from 'apollo-boost';

export const GET_PERMISSION_GROUPS = gql`
	query getAllPermissionGroups(
		$where: users_permission_groups_bool_exp!
		$offset: Int!
		$limit: Int!
		$orderBy: [users_permission_groups_order_by!]!
	) {
		users_permission_groups(offset: $offset, limit: $limit, order_by: $orderBy, where: $where) {
			label
			description
			created_at
			updated_at
			id
		}
		users_permission_groups_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;

export const DELETE_PERMISSION_GROUP = gql`
	mutation deletePermissionGroupById($id: Int!) {
		delete_users_permission_groups(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;

export const GET_PERMISSION_GROUP_BY_ID = gql`
	query getPermissionGroupById($id: Int!) {
		users_permission_groups(where: { id: { _eq: $id } }) {
			label
			id
			description
			created_at
			updated_at
			permission_group_user_permissions(order_by: { permission: { description: asc } }) {
				permissions {
					id
					label
					description
				}
			}
		}
	}
`;

export const GET_ALL_PERMISSIONS = gql`
	query getAllPermissions {
		users_permissions(order_by: { description: asc }) {
			id
			label
			description
		}
	}
`;

export const ADD_PERMISSIONS_TO_GROUP = gql`
	mutation insertPermissionInPermissionGroup(
		$objs: [users_permission_group_user_permissions_insert_input!]!
	) {
		insert_users_permission_group_user_permissions(objects: $objs) {
			affected_rows
		}
	}
`;

export const REMOVE_PERMISSIONS_FROM_GROUP = gql`
	mutation removePermissionInPermissionGroup($permissionGroupId: Int!, $permissionIds: [Int!]!) {
		delete_users_permission_group_user_permissions(
			where: {
				user_permission_group_id: { _eq: $permissionGroupId }
				user_permission_id: { _in: $permissionIds }
			}
		) {
			affected_rows
		}
	}
`;

export const INSERT_PERMISSIONS_GROUP = gql`
	mutation insertPermissionGroup($permissionGroup: users_permission_groups_insert_input!) {
		insert_users_permission_groups(objects: [$permissionGroup]) {
			returning {
				id
			}
		}
	}
`;

export const UPDATE_PERMISSIONS_GROUP = gql`
	mutation updatePermissionGroup(
		$permissionGroup: users_permission_groups_set_input!
		$permissionGroupId: Int!
	) {
		update_users_permission_groups(
			where: { id: { _eq: $permissionGroupId } }
			_set: $permissionGroup
		) {
			affected_rows
		}
	}
`;
