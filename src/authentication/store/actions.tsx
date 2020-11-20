import { Location } from 'history';
import { get } from 'lodash-es';
import moment from 'moment';
import React from 'react';
import { Action, Dispatch } from 'redux';

import { Button, Spacer } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CustomError, getEnv } from '../../shared/helpers';
import { fetchWithLogout } from '../../shared/helpers/fetch-with-logout';
import { ToastService } from '../../shared/services';
import i18n from '../../shared/translations/i18n';
import { LoginMessage } from '../authentication.types';
import { logoutAndRedirectToLogin } from '../helpers/redirects';

import {
	LoginActionTypes,
	SetLoginErrorAction,
	SetLoginLoadingAction,
	SetLoginSuccessAction,
} from './types';

let checkSessionTimeoutTimerId: number | null = null;

function checkIfSessionExpires(expiresAt: string) {
	const date = moment(expiresAt);

	// Create fake location object
	const location = ({
		pathname: window.location.pathname,
		state: {
			from: { pathname: window.location.pathname, search: window.location.search },
		},
	} as unknown) as Location;
	if (date.subtract(5, 'minutes').valueOf() < new Date().getTime()) {
		logoutAndRedirectToLogin(location);
	} else if (date.subtract(10, 'minutes').valueOf() < new Date().getTime()) {
		// Show warning since user is about to be logged out
		ToastService.info(
			<>
				{i18n.t(
					'authentication/store/actions___je-sessie-gaat-over-5-min-verlopen-sla-je-werk-op-en-log-opnieuw-in'
				)}
				<Spacer margin="top-small">
					<Button
						label={i18n.t('authentication/store/actions___ga-naar-login')}
						onClick={() => logoutAndRedirectToLogin(location)}
						type="primary"
					/>
				</Spacer>
			</>,
			{
				autoClose: false,
				position: 'bottom-left',
			}
		);
	}
}

export const getLoginStateAction = () => {
	return async (dispatch: Dispatch, getState: any): Promise<Action | null> => {
		const { loginMessage } = getState();

		// don't fetch login state if we already logged in
		if (loginMessage && loginMessage.message === LoginMessage.LOGGED_IN) {
			return null;
		}

		dispatch(setLoginLoading());

		try {
			const loginStateResponse = await getLoginResponse();

			// Check if session is about to expire and show warning toast
			// Redirect to login page when session actually expires
			const expiresAt = get(loginStateResponse, 'sessionExpiresAt');
			if (expiresAt) {
				if (checkSessionTimeoutTimerId) {
					clearInterval(checkSessionTimeoutTimerId);
				}
				checkSessionTimeoutTimerId = window.setInterval(
					() => checkIfSessionExpires(expiresAt),
					5 * 60 * 1000
				);
			}

			return dispatch(setLoginSuccess(loginStateResponse));
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
