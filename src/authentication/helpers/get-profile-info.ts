import { get } from 'lodash-es';
import store from '../../store';

import { Avo } from '@viaa/avo2-types';

import { getFullName } from '../../shared/helpers';
import { LoginMessage } from '../store/types';
import { IdpType } from './redirects';

export const getFirstName = (user: Avo.User.User | undefined, defaultName = ''): string => {
	if (!user) {
		throw new Error('Failed to get user first name because the logged in user is undefined');
	}
	return get(user, 'first_name') || defaultName;
};

export function hasIdpLinked(user: Avo.User.User, idpType: IdpType): boolean {
	return [...get(user, 'idpmaps', [])].includes(idpType);
}

export const getLastName = (user: Avo.User.User | undefined, defaultName = ''): string => {
	if (!user) {
		throw new Error('Failed to get user last name because the logged in user is undefined');
	}
	return get(user, 'last_name') || defaultName;
};

export function getProfile(user: Avo.User.User | undefined): Avo.User.Profile {
	if (!user) {
		throw new Error('Failed to get profile because the logged in user is undefined');
	}
	const profile = get(user, 'profile');
	if (!profile) {
		throw new Error('No profile could be found for the logged in user');
	}
	return profile;
}

export function getProfileId(user: Avo.User.User | undefined): string {
	const userInfo = user || get(store.getState(), 'loginState.data.userInfo', null);
	if (!userInfo) {
		throw new Error('Failed to get profile id because the logged in user is undefined');
	}
	const profileId = get(user, 'profile.id');
	if (!profileId) {
		throw new Error('No profile id could be found for the logged in user');
	}
	return profileId;
}

export function getProfileName(user: Avo.User.User | undefined): string {
	if (!user) {
		throw new Error('Failed to get profile name because the logged in user is undefined');
	}
	const profileName = getFullName(user);
	if (!profileName) {
		throw new Error('No profile name could be found for the logged in user');
	}
	return profileName;
}

export function getProfileAlias(user: Avo.User.User | undefined): string {
	if (!user) {
		throw new Error('Failed to get profile alias because the logged in user is undefined');
	}
	return get(user, 'profile.alias', '');
}

export function getProfileInitials(user: Avo.User.User | undefined): string {
	if (!user) {
		throw new Error('Failed to get profile initials because the logged in user is undefined');
	}
	return getFirstName(user, 'X')[0] + getLastName(user, 'X')[0];
}

export function getProfileStamboekNumber(user: Avo.User.User | undefined): string | null {
	if (!user) {
		throw new Error(
			'Failed to get profile stamboek number because the logged in user is undefined'
		);
	}
	return get(user, 'user.profile.stamboek', null);
}

export function isProfileComplete(user: Avo.User.User): boolean {
	const profile = get(user, 'profile');
	if (!profile) {
		return false;
	}
	return false; // TODO implement check based on user role
}

export function isLoggedIn(loginMessage?: LoginMessage): boolean {
	let message: LoginMessage | undefined = loginMessage;
	if (!message) {
		const state: any = store.getState();
		message = get(state, 'loginState.data.message');
	}

	// TODO add once we can save profile info
	return !!message && message === LoginMessage.LOGGED_IN; // && isProfileComplete();
}
