import moment from 'moment';

import { Avo } from '@viaa/avo2-types';

import { LoginMessage } from '../authentication.types';

import { setLoginError, setLoginLoading, setLoginSuccess } from './actions';
import initialState from './initial-state';
import loginReducer from './reducer';
import { LoginActionTypes } from './types';

describe('login > store > reducer', () => {
	it(`Correctly handle ${LoginActionTypes.SET_LOGIN_ERROR}`, () => {
		const state = loginReducer(initialState, setLoginError());

		expect(state.error).toEqual(true);
	});

	it(`Correctly handle ${LoginActionTypes.SET_LOGIN_LOADING}`, () => {
		const state = loginReducer(initialState, setLoginLoading());

		expect(state.loading).toEqual(true);
	});

	it(`Correctly handle ${LoginActionTypes.SET_LOGIN_SUCCESS}`, () => {
		const payload: Avo.Auth.LoginResponse = {
			message: LoginMessage.LOGGED_IN,
			userInfo: {} as any,
			acceptedConditions: true,
			sessionExpiresAt: moment().add(1, 'days').toString(),
		};

		const state = loginReducer(initialState, setLoginSuccess(payload));

		expect(state.data).toEqual(payload);
	});
});
