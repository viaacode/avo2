import { Action, Dispatch } from 'redux';

import { Avo } from '@viaa/avo2-types';

import { CustomError, getEnv } from '../../shared/helpers';
import { fetchWithLogout } from '../../shared/helpers/fetch-with-logout';
import { LoginMessage } from '../authentication.types';

import {
	LoginActionTypes,
	SetLoginErrorAction,
	SetLoginLoadingAction,
	SetLoginSuccessAction,
} from './types';

export const getLoginStateAction = () => {
	return async (dispatch: Dispatch, getState: any): Promise<Action | null> => {
		const { loginMessage } = getState();

		// don't fetch login state if we already logged in
		if (loginMessage && loginMessage.message === LoginMessage.LOGGED_IN) {
			return null;
		}

		dispatch(setLoginLoading());

		try {
			return dispatch(setLoginSuccess(await getLoginResponse()));
		} catch (err) {
			console.error('failed to check login state', err);
			return dispatch(setLoginError());
		}
	};
};

export const setLoginSuccess = (data: Avo.Auth.LoginResponse | null): SetLoginSuccessAction => ({
	data,
	type: LoginActionTypes.SET_LOGIN_SUCCESS,
});

export const setLoginError = (): SetLoginErrorAction => ({
	type: LoginActionTypes.SET_LOGIN_ERROR,
	error: true,
});

export const setLoginLoading = (): SetLoginLoadingAction => ({
	type: LoginActionTypes.SET_LOGIN_LOADING,
	loading: true,
});

export const getLoginResponse = async (): Promise<Avo.Auth.LoginResponse> => {
	try {
		const url = `${getEnv('PROXY_URL')}/auth/check-login`;
		const response = await fetchWithLogout(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		const data = await response.json();

		if (data.statusCode < 200 || data.statusCode >= 400) {
			throw new CustomError(
				'Failed to check login, status code not in expected range (200-399)',
				null,
				{ response, data, message: data.message }
			);
		}

		return data as Avo.Auth.LoginResponse;
	} catch (err) {
		console.error('failed to check login state', err);
		throw err;
	}
};
