import { get, isString, some } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { ContentPageInfo } from '../../admin/content/content.types';
import { CollectionService } from '../../collection/collection.service';
import { CustomError, getEnv } from '../../shared/helpers';
import { fetchWithLogout } from '../../shared/helpers/fetch-with-logout';
import { ContentPageService } from '../../shared/services/content-page-service';

import { getProfileId } from './get-profile-id';
import { PermissionName } from './permission-names';

export { PermissionName };

type PermissionInfo = { name: PermissionName; obj?: any | null };

export type Permissions = PermissionName | PermissionInfo | (PermissionName | PermissionInfo)[];

export class PermissionService {
	public static hasPerm(user: Avo.User.User | undefined, permName: PermissionName): boolean {
		return PermissionService.getUserPermissions(user).includes(permName);
	}

	public static hasAtLeastOnePerm(
		user: Avo.User.User | undefined,
		permNames: PermissionName[]
	): boolean {
		return some(permNames, (permName) =>
			PermissionService.getUserPermissions(user).includes(permName)
		);
	}

	public static getUserPermissions(user: Avo.User.User | undefined): PermissionName[] {
		return get(user, 'profile.permissions', []);
	}

	public static async hasPermissions(
		permissions: Permissions,
		user: Avo.User.User | null
	): Promise<boolean> {
		// Reformat all permissions to format: PermissionInfo[]
		let permissionList: PermissionInfo[];
		if (typeof permissions === 'string') {
			// Single permission by name
			permissionList = [{ name: permissions as PermissionName }];
		} else if ((permissions as PermissionInfo).name) {
			// Single permission by name and object
			permissionList = [permissions as PermissionInfo];
		} else {
			// Permission list of strings and objects containing a permission name and an object
			permissionList = (permissions as (string | PermissionInfo)[]).map(
				(permission: string | PermissionInfo): PermissionInfo => {
					if (typeof permission === 'string') {
						// Single permission by name
						return { name: permission as PermissionName };
					}
					// Single permission by name and object
					return permission as PermissionInfo;
				}
			);
		}
		if (!permissionList.length) {
			return true; // If no required permissions are passed, then the user is allowed to see the item/page
		}
		if (!user) {
			console.warn('Checking permissions without user object', { permissionList, user });
			return false;
		}
		// Check every permission and return true for the first permission that returns true (lazy eval)
		for (const perm of permissionList) {
			if (await PermissionService.hasPermission(perm.name, perm.obj, user)) {
				return true;
			}
		}
		return false;
	}

	public static async hasPermission(
		permissionName: PermissionName,
		obj: any | null | undefined,
		user: Avo.User.User
	): Promise<boolean> {
		const userPermissions = PermissionService.getUserPermissions(user);
		if (!user || !userPermissions) {
			return false;
		}
		// Check if user has the requested permission
		const profileId = getProfileId(user);
		if (!userPermissions.includes(permissionName)) {
			// If the user doesn't have the permission, then we don't even need to check if the user is the owner of the object.
			return false;
		}
		if (!obj) {
			// Eg: Check if user has permission to view own collections, without checking a specific collection
			// This is used to show the workspace overview, since there only the owner's collections are shown
			return true;
		}
		// Special checks on top of name being in the permission list
		switch (permissionName) {
			case PermissionName.EDIT_OWN_COLLECTIONS:
			case PermissionName.PUBLISH_OWN_COLLECTIONS:
			case PermissionName.DELETE_OWN_COLLECTIONS:
			case PermissionName.VIEW_OWN_COLLECTIONS:
				const collection = isString(obj)
					? await CollectionService.fetchCollectionOrBundleById(obj, 'collection')
					: obj;
				const collectionOwnerId = get(collection, 'owner_profile_id');
				return !!profileId && !!collectionOwnerId && profileId === collectionOwnerId;

			case PermissionName.EDIT_OWN_BUNDLES:
			case PermissionName.PUBLISH_OWN_BUNDLES:
			case PermissionName.DELETE_OWN_BUNDLES:
			case PermissionName.VIEW_OWN_BUNDLES:
				const bundle = isString(obj)
					? await CollectionService.fetchCollectionOrBundleById(obj, 'bundle')
					: obj;
				const bundleOwnerId = get(bundle, 'owner_profile_id');
				return !!profileId && !!bundleOwnerId && profileId === bundleOwnerId;

			case PermissionName.EDIT_OWN_CONTENT_PAGES:
				const contentPage: ContentPageInfo = isString(obj)
					? await ContentPageService.getContentPageByPath(obj)
					: obj;
				const contentPageOwnerId = get(contentPage, 'user_profile_id');
				return !!profileId && !!contentPageOwnerId && profileId === contentPageOwnerId;

			default:
				// The permission does not require any other checks besides is presence in the permission list
				return true;
		}
	}

	/**
	 * Triggers an update of all the database permissions
	 */
	public static async getUpdatePermissionsProgress(): Promise<number | null> {
		let url: string | undefined = undefined;
		try {
			url = `${getEnv('PROXY_URL')}/auth/update-database-permissions`;
			const response = await fetchWithLogout(url, {
				method: 'GET',
				credentials: 'include',
			});

			const body = await response.json();
			if (response.status < 200 || response.status >= 400) {
				throw new CustomError('Response code indicates failure', null, {
					response,
					body,
				});
			}
			return body.progress;
		} catch (err) {
			throw new CustomError('Failed to trigger MAM sync', err, {
				url,
			});
		}
	}

	/**
	 * Triggers an update of all the database permissions
	 */
	public static async triggerUpdatePermissions(): Promise<{ message?: string; error?: string }> {
		let url: string | undefined = undefined;
		try {
			url = `${getEnv('PROXY_URL')}/auth/update-database-permissions`;
			const response = await fetchWithLogout(url, {
				method: 'POST',
				credentials: 'include',
			});

			const body = await response.json();
			if (response.status < 200 || response.status >= 400) {
				throw new CustomError('Response code indicates failure', null, {
					response,
					body,
				});
			}
			return body;
		} catch (err) {
			throw new CustomError('Failed to trigger MAM sync', err, {
				url,
			});
		}
	}
}
