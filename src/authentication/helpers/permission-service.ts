import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';
import authClient from '../Auth';

type PermissionInfo = { permissionName: PermissionName; obj?: any | null };

export type Permissions = PermissionName | PermissionInfo | (PermissionName | PermissionInfo)[];

export const PERMISSIONS: { [permissionName: string]: string } = {
	EDIT_OWN_COLLECTION: 'EDIT_OWN_COLLECTION',
	EDIT_ALL_COLLECTIONS: 'EDIT_ALL_COLLECTIONS',
	DELETE_OWN_COLLECTION: 'DELETE_OWN_COLLECTION',
	DELETE_ALL_COLLECTIONS: 'DELETE_ALL_COLLECTIONS',
};

type PermissionName = keyof typeof PERMISSIONS;

export class PermissionService {
	// TODO replace with userInfo.permissions
	private static currentUserPermissions: PermissionName[] = Object.values(PERMISSIONS);

	public static hasPermissions(permissions: Permissions, profile: Avo.User.Profile | null) {
		// Reformat all permissions to format: PermissionInfo[]
		let permissionList: PermissionInfo[];
		if (typeof permissions === 'string') {
			// Single permission by name
			permissionList = [{ permissionName: permissions as PermissionName }];
		} else if ((permissions as PermissionInfo).permissionName) {
			// Single permission by name and object
			permissionList = [permissions as PermissionInfo];
		} else {
			// Permission list of strings and objects containing a permission name and an object
			permissionList = (permissions as (string | PermissionInfo)[]).map(
				(permission: string | PermissionInfo): PermissionInfo => {
					if (typeof permission === 'string') {
						// Single permission by name
						return { permissionName: permission as PermissionName };
					}
					// Single permission by name and object
					return permission as PermissionInfo;
				}
			);
		}
		// Check every permission and return true for the first permission that returns true (lazy eval)
		for (const perm of permissionList) {
			if (this.hasPermission(perm.permissionName, perm.obj, profile)) {
				return true;
			}
		}
		return false;
	}

	private static hasPermission(
		permissionName: PermissionName,
		obj: any | null | undefined,
		profile: Avo.User.Profile | null
	) {
		// Check if user has the requested permission
		if (!this.currentUserPermissions.includes(permissionName)) {
			return false;
		}
		// Special checks on top of permissionName being in the permission list
		switch (permissionName) {
			// TODO replace example permissions
			case PERMISSIONS.EDIT_OWN_COLLECTION:
				const profileId = get(profile, 'id');
				const ownerId = get(obj, 'owner_profile_id');
				return profileId && ownerId && profileId === ownerId;

			default:
				// The permission does not require any other checks besides is presence in the permission list
				return true;
		}
	}
}
