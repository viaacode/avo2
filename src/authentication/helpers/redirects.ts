import { History, Location } from 'history';
import { get, isString, omit, trimEnd, trimStart } from 'lodash-es';
import queryString from 'query-string';

import { Avo } from '@viaa/avo2-types';

import { APP_PATH } from '../../constants';
import { ErrorViewQueryParams } from '../../error/views/ErrorView';
import { ROUTE_PARTS } from '../../shared/constants';
import { getEnv } from '../../shared/helpers';
import { SERVER_LOGOUT_PAGE } from '../authentication.const';
import { STAMBOEK_LOCAL_STORAGE_KEY } from '../views/registration-flow/r3-stamboek';

/**
 *
 * Client redirect functions
 *
 **/
export function redirectToClientPage(path: string, history: History) {
	history.push(path);
}

export function redirectToErrorPage(props: ErrorViewQueryParams, location: Location) {
	const baseUrl = getBaseUrl(location);
	window.location.href = `${baseUrl}/error?${queryString.stringify(props)}`;
}

export function redirectToLoggedOutHome(location: Location) {
	window.location.href = getBaseUrl(location);
}

export function redirectToLoggedInHome(location: Location) {
	window.location.href = `${getBaseUrl(location)}/start`;
}

/**
 *
 * Server redirect functions
 *
 **/
export function redirectToServerLoginPage(location: Location) {
	// Redirect to login form
	// Url to return to after authentication is completed and server stored auth object in session
	const returnToUrl = getRedirectAfterLogin(location);
	// Not logged in, we need to redirect the user to the SAML identity server login page
	window.location.href = `${getEnv('PROXY_URL')}/auth/hetarchief/login?${queryString.stringify({
		returnToUrl,
		stamboekNumber: localStorage && localStorage.getItem(STAMBOEK_LOCAL_STORAGE_KEY),
	})}`;
}

export function redirectToServerSmartschoolLogin(location: Location) {
	// Redirect to smartschool login form
	// Url to return to after authentication is completed and server stored auth object in session
	const returnToUrl = getRedirectAfterLogin(location);
	window.location.href = `${getEnv('PROXY_URL')}/auth/smartschool/login?${queryString.stringify({
		returnToUrl,
	})}`;
}

export function redirectToServerKlascementLogin(location: Location) {
	// Redirect to klascement login form
	// Url to return to after authentication is completed and server stored auth object in session
	const returnToUrl = getRedirectAfterLogin(location);
	window.location.href = `${getEnv('PROXY_URL')}/auth/klascement/login?${queryString.stringify({
		returnToUrl,
	})}`;
}

export function redirectToServerArchiefRegistrationIdp(location: Location, stamboekNumber: string) {
	const returnToUrl = getBaseUrl(location) + APP_PATH.LOGIN.route;
	window.location.href = `${getEnv('PROXY_URL')}/auth/hetarchief/register?${queryString.stringify(
		{
			returnToUrl,
			stamboekNumber,
		}
	)}`;
}

export function redirectToServerLogoutPage(location: Location, routeAfterLogout: string) {
	// Url to return to after logout is completed
	const returnToUrl = `${getBaseUrl(location)}${routeAfterLogout}`;
	window.location.href = `${getEnv('PROXY_URL')}/${SERVER_LOGOUT_PAGE}?${queryString.stringify({
		returnToUrl,
	})}`;
}

export function logoutAndRedirectToLogin(location?: Location) {
	// Url to return to after logout is completed
	let returnToUrl = window.location.origin + APP_PATH.REGISTER_OR_LOGIN.route;

	if (location) {
		returnToUrl = `${returnToUrl}?${queryString.stringify({
			// Url to redirect to after logging back in
			returnToUrl: getRedirectAfterLogin(location),
		})}`;
	}

	window.location.href = `${getEnv('PROXY_URL')}/${SERVER_LOGOUT_PAGE}?${queryString.stringify({
		returnToUrl,
	})}`;
}

/**
 * Redirect to server link accounts route
 * @param location
 * @param idpType
 */
export function redirectToServerLinkAccount(location: Location, idpType: Avo.Auth.IdpType) {
	const returnToUrl = getBaseUrl(location) + location.pathname;
	window.location.href = `${getEnv('PROXY_URL')}/auth/link-account?${queryString.stringify({
		returnToUrl,
		idpType,
	})}`;
}

export function redirectToServerUnlinkAccount(location: Location, idpType: Avo.Auth.IdpType) {
	const returnToUrl = getBaseUrl(location) + location.pathname;
	window.location.href = `${getEnv('PROXY_URL')}/auth/unlink-account?${queryString.stringify({
		returnToUrl,
		idpType,
	})}`;
}

/**
 *
 * Other redirect functions
 *
 **/
export function redirectToExternalPage(link: string, target: '_blank' | string | null | undefined) {
	if (target === '_blank') {
		window.open(link, '_blank', 'noopener,noreferrer');
	} else {
		window.location.href = link;
	}
}

export function getBaseUrl(location: Location): string {
	if (location.pathname === '/') {
		return trimEnd(window.location.href, '/');
	}
	return trimEnd(decodeURIComponent(window.location.href).split(location.pathname)[0], '/');
}

export function getFromPath(
	location: Location,
	defaultPath: string = APP_PATH.LOGGED_IN_HOME.route
): string {
	let fromPath = get(location, 'state.from.pathname') || get(location, 'pathname') || defaultPath;
	if (fromPath === `/${ROUTE_PARTS.registerOrLogin}`) {
		fromPath = '/';
	}
	const fromSearch = get(location, 'state.from.search') || get(location, 'search') || '';
	return `/${trimStart(fromPath + fromSearch, '/')}`;
}

export function getRedirectAfterLogin(
	location: Location,
	defaultPath: string = APP_PATH.LOGGED_IN_HOME.route
) {
	// From query string
	const queryStrings = queryString.parse(location.search);
	if (queryStrings.returnToUrl && isString(queryStrings.returnToUrl)) {
		const returnToUrl = queryStrings.returnToUrl;
		if (!returnToUrl.startsWith('http') && !returnToUrl.startsWith('//')) {
			// make url absolute
			return getBaseUrl(location) + returnToUrl;
		}
		return returnToUrl;
	}

	// From location history
	if (location.pathname === `/${ROUTE_PARTS.registerOrLogin}`) {
		return getBaseUrl(location) + getFromPath(location);
	}

	const base = getBaseUrl(location);
	const from = getFromPath(location, defaultPath);
	if (from === '/') {
		return `${base}${defaultPath}`;
	}
	return `${base}${from}${location.hash || ''}${queryString.stringify(
		omit(queryStrings, ['returnToUrl'])
	)}`;
}
