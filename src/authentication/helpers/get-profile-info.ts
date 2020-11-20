import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { SpecialUserGroup } from '../../admin/user-groups/user-group.const';
import { CustomError, getFullName, getProfile } from '../../shared/helpers';

export const getFirstName = (user: Avo.User.User | undefined, defaultName = ''): string => {
	if (!user) {
		throw new CustomError(
			'Failed to get user first name because the logged in user is undefined'
		);
	}
	return get(user, 'first_name') || defaultName;
};

export function hasIdpLinked(user: Avo.User.User, idpType: Avo.Auth.IdpType): boolean {
	return get(user, 'idpmaps', [] as Avo.Auth.IdpType[]).includes(idpType);
}

export const getLastName = (user: Avo.User.User | undefined, defaultName = ''): string => {
	if (!user) {
		throw new CustomError(
			'Failed to get user last name because the logged in user is undefined'
		);
	}
	return get(user, 'last_name') || defaultName;
};

export const getUserGroupLabel = (
	userOrProfile: Avo.User.Profile | { profile: Avo.User.Profile } | null | undefined
): string => {
	if (!userOrProfile) {
		console.error(
			new CustomError(
				'Failed to get profile user group label because the provided profile is undefined'
			)
		);
		return '';
	}

	const profile = getProfile(userOrProfile);
	return (
		get(profile, 'profile_user_groups[0].group.label') ||
		get(profile, 'profile_user_groups[0].groups[0].label') ||
		''
	);
};

export const getUserGroupId = (
	userOrProfile: Avo.User.Profile | { profile: Avo.User.Profile } | null | undefined
): number => {
	if (get(userOrProfile, 'userGroupIds[0]')) {
		return get(userOrProfile, 'userGroupIds[0]');
	}
	if (!userOrProfile) {
		console.error(
			new CustomError(
				'Failed to get profile user group id because the provided profile is undefined'
			)
		);
		return 0;
	}

	const profile = getProfile(userOrProfile);
	const userGroupId =
		get(profile, 'userGroupIds[0]') || get(profile, 'profile_user_groups[0].group.id') || '';
	if (!userGroupId) {
		console.error('Failed to get user group id from profile');
	}
	return userGroupId;
};

export function getProfileFromUser(
	user: Avo.User.User | undefined,
	silent: boolean = false
): Avo.User.Profile | null {
	if (!user) {
		if (silent) {
			return null;
		}
		throw new CustomError('Failed to get profile because the logged in user is undefined');
	}
	const profile = get(user, 'profile');
	if (!profile) {
		throw new CustomError('No profile could be found for the logged in user');
	}
	return profile;
}

export function getProfileName(user: Avo.User.User | undefined): string {
	if (!user) {
		throw new CustomError('Failed to get profile name because the logged in user is undefined');
	}
	const profileName = getFullName(user as any, true, false);
	if (!profileName) {
		throw new CustomError('No profile name could be found for the logged in user');
	}
	return profileName;
}

export function getProfileAlias(user: Avo.User.User | undefined): string {
	if (!user) {
		throw new CustomError(
			'Failed to get profile alias because the logged in user is undefined'
		);
	}
	return get(user, 'profile.alias', '');
}

export function getProfileAvatar(user: Avo.User.User | undefined): string {
	const profile = get(user, 'profile');
	if (!profile) {
		throw new CustomError(
			'Failed to get profile avatar because the logged in user/profile is undefined'
		);
	}
	return get(profile, 'organisation.logo_url') || get(profile, 'avatar') || undefined;
}

export function getProfileInitials(user: Avo.User.User | undefined): string {
	if (!user) {
		throw new CustomError(
			'Failed to get profile initials because the logged in user is undefined'
		);
	}
	return getFirstName(user, 'X')[0] + getLastName(user, 'X')[0];
}

export function isProfileComplete(user: Avo.User.User): boolean {
	const profile = get(user, 'profile');

	// Only teachers have to fill in their profile for now
	const userGroupId = getUserGroupId(get(user, 'profile'));
	if (
		userGroupId !== SpecialUserGroup.Teacher &&
		userGroupId !== SpecialUserGroup.TeacherSecondary
	) {
		return true;
	}

	if (!!profile && profile.is_exception) {
		return true;
	}

	return (
		!!profile &&
		!!profile.organizations &&
		!!profile.organizations.length &&
		!!profile.educationLevels &&
		!!profile.educationLevels.length &&
		!!profile.subjects &&
		!!profile.subjects.length
	);
}
