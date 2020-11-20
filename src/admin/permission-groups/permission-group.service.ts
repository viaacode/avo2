import { flatten, get, isNil, orderBy } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../shared/helpers';
import { ApolloCacheManager, dataService, ToastService } from '../../shared/services';
import i18n from '../../shared/translations/i18n';
import { GET_ALL_PERMISSION_GROUPS } from '../user-groups/user-group.gql';

import { ITEMS_PER_PAGE } from './permission-group.const';
import {
	ADD_PERMISSIONS_TO_GROUP,
	DELETE_PERMISSION_GROUP,
	GET_ALL_PERMISSIONS,
	GET_PERMISSION_GROUP_BY_ID,
	GET_PERMISSION_GROUPS,
	INSERT_PERMISSIONS_GROUP,
	REMOVE_PERMISSIONS_FROM_GROUP,
	UPDATE_PERMISSIONS_GROUP,
} from './permission-group.gql';
import {
	Permission,
	PermissionGroup,
	PermissionGroupOverviewTableCols,
} from './permission-group.types';

export class PermissionGroupService {
	public static async fetchPermissionGroups(
		page: number,
		sortColumn: PermissionGroupOverviewTableCols,
		sortOrder: Avo.Search.OrderDirection,
		where: any
	): Promise<[PermissionGroup[], number]> {
		let variables: any;
		try {
			variables = {
				where,
				offset: ITEMS_PER_PAGE * page,
				limit: ITEMS_PER_PAGE,
				orderBy: [{ [sortColumn]: sortOrder }],
			};
			const response = await dataService.query({
				variables,
				query: GET_PERMISSION_GROUPS,
			});
			const permissionGroups = get(response, 'data.users_permission_groups');
			const permissionGroupCount = get(
				response,
				'data.users_permission_groups_aggregate.aggregate.count'
			);

			if (!permissionGroups) {
				throw new CustomError('Response does not contain any permission groups', null, {
					response,
				});
			}

			return [permissionGroups, permissionGroupCount];
		} catch (err) {
			throw new CustomError('Failed to get permission groups from the database', err, {
				variables,
				query: 'GET_PERMISSION_GROUPS',
			});
		}
	}

	public static async fetchAllPermissionGroups(): Promise<PermissionGroup[]> {
		try {
			const response = await dataService.query({
				query: GET_ALL_PERMISSION_GROUPS,
			});

			if (response.errors) {
				throw new CustomError('Response contains errors', null, {
					response,
				});
			}

			const permissionGroups: PermissionGroup[] | undefined = get(
				response,
				'data.users_permission_groups'
			);

			if (!permissionGroups) {
				throw new CustomError('Response does not contain permissionGroups', null, {
					response,
				});
			}

			return permissionGroups;
		} catch (err) {
			throw new CustomError('Failed to get all permissionGroups from database', err, {
				query: 'GET_ALL_PERMISSION_GROUPS',
			});
		}
	}

	public static async fetchPermissionGroup(id: string): Promise<PermissionGroup> {
		try {
			const response = await dataService.query({
				query: GET_PERMISSION_GROUP_BY_ID,
				variables: { id },
			});

			const permissionGroupObj = get(response, 'data.users_permission_groups[0]');

			if (!permissionGroupObj) {
				throw new CustomError('Failed to find permission group by id', null, { response });
			}

			const permissions: Permission[] = flatten(
				get(permissionGroupObj, 'permission_group_user_permissions', []).map(
					(permissionGroupItem: any) => {
						return get(permissionGroupItem, 'permissions', []);
					}
				)
			);

			return {
				permissions,
				id: permissionGroupObj.id,
				label: permissionGroupObj.label,
				description: permissionGroupObj.description,
				created_at: permissionGroupObj.created_at,
				updated_at: permissionGroupObj.updated_at,
			};
		} catch (err) {
			throw new CustomError('Failed to get permission group by id', err, {
				query: 'GET_PERMISSION_GROUP_BY_ID',
				variables: { id },
			});
		}
	}

	public static async addPermissionsToGroup(
		permissionIds: number[],
		permissionGroupId: number | string
	): Promise<void> {
		try {
			const response = await dataService.mutate({
				mutation: ADD_PERMISSIONS_TO_GROUP,
				variables: {
					objs: permissionIds.map((permissionId) => ({
						user_permission_id: permissionId,
						user_permission_group_id: permissionGroupId,
					})),
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed to add permission to group', null, {
					errors: response.errors,
				});
			}
		} catch (err) {
			throw new CustomError('Failed to add  permissions to group', err, {
				query: 'ADD_PERMISSIONS_TO_GROUP',
				variables: {
					permissionIds,
					permissionGroupId,
				},
			});
		}
	}

	public static async removePermissionsFromPermissionGroup(
		permissionIds: number[],
		permissionGroupId: number | string
	): Promise<void> {
		try {
			const response = await dataService.mutate({
				mutation: REMOVE_PERMISSIONS_FROM_GROUP,
				variables: {
					permissionIds,
					permissionGroupId,
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed to remove permissions from group', null, {
					errors: response.errors,
				});
			}
		} catch (err) {
			throw new CustomError('Failed to remove permissions from group', err, {
				query: 'REMOVE_PERMISSIONS_FROM_GROUP',
				variables: {
					permissionIds,
					permissionGroupId,
				},
			});
		}
	}

	public static async insertPermissionGroup(permissionGroup: PermissionGroup): Promise<number> {
		try {
			const response = await dataService.mutate({
				mutation: INSERT_PERMISSIONS_GROUP,
				variables: {
					permissionGroup: {
						label: permissionGroup.label,
						description: permissionGroup.description,
					} as Partial<PermissionGroup>,
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed to insert permission group in the database', null, {
					response,
					errors: response.errors,
				});
			}
			const permissionGroupId = get(
				response,
				'data.insert_users_permission_groups.returning[0].id'
			);
			if (isNil(permissionGroupId)) {
				throw new CustomError(
					'Response from database does not contain the id of the inserted permission group',
					null,
					{ response }
				);
			}
			return permissionGroupId;
		} catch (err) {
			throw new CustomError('Failed to insert permission group in the database', err, {
				permissionGroup,
				query: 'INSERT_PERMISSIONS_GROUP',
			});
		}
	}

	static async updatePermissionGroup(permissionGroup: PermissionGroup) {
		try {
			const response = await dataService.mutate({
				mutation: UPDATE_PERMISSIONS_GROUP,
				variables: {
					permissionGroup: {
						label: permissionGroup.label,
						description: permissionGroup.description,
					} as Partial<PermissionGroup>,
					permissionGroupId: permissionGroup.id,
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed to update permission group in the database', null, {
					response,
					errors: response.errors,
				});
			}
		} catch (err) {
			throw new CustomError('Failed to update permission group in the database', err, {
				permissionGroup,
				query: 'UPDATE_PERMISSIONS_GROUP',
			});
		}
	}

	public static async deletePermissionGroup(permissionGroupId: number | null | undefined) {
		try {
			if (isNil(permissionGroupId)) {
				throw new CustomError(
					'Failed to delete permission group since the id is nil',
					null,
					{
						permissionGroupId,
					}
				);
			}
			const response = await dataService.mutate({
				mutation: DELETE_PERMISSION_GROUP,
				variables: {
					id: permissionGroupId,
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed to delete permission group from the database', null, {
					response,
					errors: response.errors,
				});
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to delete permission group from the database', err, {
					permissionGroupId,
					query: 'DELETE_PERMISSION_GROUP',
				})
			);
			ToastService.danger(
				i18n.t(
					'admin/permission-groups/permission-group___het-verwijderen-van-de-permissie-groep-is-mislukt'
				)
			);
		}
	}

	public static async fetchAllPermissions(): Promise<Permission[]> {
		try {
			const response = await dataService.query({
				query: GET_ALL_PERMISSIONS,
			});

			const permissions: Permission[] | undefined = get(response, 'data.users_permissions');

			if (!permissions) {
				throw new CustomError('Response does not contain permissions', null, { response });
			}

			return permissions;
		} catch (err) {
			throw new CustomError('Failed to get all permissions from database', err, {
				query: 'GET_ALL_PERMISSIONS',
			});
		}
	}

	static sortPermissions(
		permissions: Permission[],
		sortColumn: string,
		sortOrder: Avo.Search.OrderDirection
	): Permission[] {
		return orderBy(permissions, [sortColumn], [sortOrder]);
	}
}
