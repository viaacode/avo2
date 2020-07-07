import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../shared/helpers';
import { ApolloCacheManager, dataService } from '../../shared/services';

import { ITEMS_PER_PAGE, TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT } from './user.const';
import { GET_USER_BY_ID, GET_USER_ROLES, GET_USERS, UPDATE_USER_BLOCKED_STATUS } from './user.gql';
import { UserOverviewTableCol } from './user.types';

export class UserService {
	public static async getProfileById(profileId: string): Promise<Avo.User.Profile> {
		try {
			const response = await dataService.query({
				query: GET_USER_BY_ID,
				variables: {
					id: profileId,
				},
			});
			if (response.errors) {
				throw new CustomError('Response from gragpql contains errors', null, {
					response,
				});
			}
			const profile = get(response, 'data.users_profiles[0]');
			if (!profile) {
				throw new CustomError('Failed to find profile by id', null, { response });
			}
			return profile;
		} catch (err) {
			throw new CustomError('Failed to get profile by id from the database', err, {
				profileId,
				query: 'GET_USER_BY_ID',
			});
		}
	}

	private static getOrderObject(
		sortColumn: UserOverviewTableCol,
		sortOrder: Avo.Search.OrderDirection
	) {
		const getOrderFunc: Function | undefined =
			TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT[sortColumn];

		if (getOrderFunc) {
			return [getOrderFunc(sortOrder)];
		}

		return [{ [sortColumn]: sortOrder }];
	}

	public static async getProfiles(
		page: number,
		sortColumn: UserOverviewTableCol,
		sortOrder: Avo.Search.OrderDirection,
		queryText: string,
		itemsPerPage: number = ITEMS_PER_PAGE
	): Promise<[Avo.User.Profile[], number]> {
		let variables: any;
		try {
			variables = {
				offset: itemsPerPage * page,
				limit: itemsPerPage,
				orderBy: this.getOrderObject(sortColumn, sortOrder),
				queryText: `%${queryText}%`,
			};
			const response = await dataService.query({
				variables,
				query: GET_USERS,
			});
			if (response.errors) {
				throw new CustomError('Response from gragpql contains errors', null, {
					response,
				});
			}
			const profiles = get(response, 'data.users_profiles');
			const profileCount = get(response, 'data.users_profiles_aggregate.aggregate.count');

			if (!profiles) {
				throw new CustomError('Response does not contain any profiles', null, {
					response,
				});
			}

			return [profiles, profileCount];
		} catch (err) {
			throw new CustomError('Failed to get profiles from the database', err, {
				variables,
				query: 'GET_USERS',
			});
		}
	}

	public static async getUserRoles(): Promise<Avo.User.Role[]> {
		try {
			const response = await dataService.query({
				query: GET_USER_ROLES,
			});
			if (response.errors) {
				throw new CustomError('Response from gragpql contains errors', null, {
					response,
				});
			}
			const roles = get(response, 'data.shared_user_roles');

			if (!roles) {
				throw new CustomError('Response does not contain any roles', null, {
					response,
				});
			}

			return roles;
		} catch (err) {
			throw new CustomError('Failed to get user roles from the database', err, {
				query: 'GET_USER_ROLES',
			});
		}
	}

	/**
	 * Get user role name from user of profile object
	 * @param userOrProfile
	 * @returns userRole eg: leerling, lesgever, admin, ...  See database for all options: shared.user_roles
	 */
	public static getUserRole(
		userOrProfile: Avo.User.User | Avo.User.Profile | undefined | null
	): string | null {
		return get(userOrProfile, 'role.name') || get(userOrProfile, 'user.role.name') || null;
	}

	/**
	 * Get user role label from user of profile object
	 * @param userOrProfile
	 * @returns userRole eg: Leerling, Lesgever, Beheerder, ...  See database for all options: shared.user_roles
	 */
	public static getUserRoleLabel(
		userOrProfile: Avo.User.User | Avo.User.Profile | undefined | null
	): string | null {
		return get(userOrProfile, 'role.label') || get(userOrProfile, 'user.role.label') || null;
	}

	public static async updateBlockStatus(userId: string, isBlocked: boolean): Promise<void> {
		try {
			const response = await dataService.mutate({
				mutation: UPDATE_USER_BLOCKED_STATUS,
				variables: {
					userId,
					isBlocked,
				},
				update: ApolloCacheManager.clearUserCache,
			});

			if (response.errors) {
				throw new CustomError('Response from gragpql contains errors', null, {
					response,
				});
			}
		} catch (err) {
			throw new CustomError(
				'Failed to update is_blocked field for user in the database',
				err,
				{
					userId,
					isBlocked,
					query: 'UPDATE_ITEM_PUBLISH_STATE',
				}
			);
		}
	}
}
