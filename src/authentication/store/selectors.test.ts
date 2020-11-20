import moment from 'moment';

import { Avo } from '@viaa/avo2-types';

import { AppState } from '../../store';
import { LoginMessage } from '../authentication.types';

import { selectLogin, selectLoginError, selectLoginLoading } from './selectors';

describe('login > store > selectors', () => {
	const store: AppState = {
		loginState: {
			data: {
				message: LoginMessage.LOGGED_IN,
				userInfo: {} as Avo.User.User,
				acceptedConditions: true,
				sessionExpiresAt: moment().add(1, 'days').toString(),
			},
			loading: false,
			error: false,
		},
		search: {
			data: null,
			loading: false,
			error: false,
		},
	};

	it('Should get the login error-state from the store', () => {
		expect(selectLoginError(store)).toEqual(false);
	});

	it('Should get the login loading-state from the store', () => {
		expect(selectLoginLoading(store)).toEqual(false);
	});

	it('Should get the login data from the store', () => {
		expect(selectLogin(store)).toMatchObject(store.loginState.data as any);
	});
});
