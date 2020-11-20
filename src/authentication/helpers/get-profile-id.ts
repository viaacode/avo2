import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../shared/helpers';
import store from '../../store';

export function getProfileId(user: Avo.User.User | undefined): string {
	const userInfo = user || get(store.getState(), 'loginState.data.userInfo', null);
	if (!userInfo) {
		throw new CustomError('Failed to get profile id because the logged in user is undefined');
	}
	const profileId = get(user, 'profile.id');
	if (!profileId) {
		throw new CustomError('No profile id could be found for the logged in user');
	}
	return profileId;
}
