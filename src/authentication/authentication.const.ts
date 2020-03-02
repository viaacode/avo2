import { UserState } from './authentication.types';

export const INITIAL_USER_STATE: UserState = {
	firstName: '',
	lastName: '',
	email: '',
	password: '',
	type: 'Leerkracht',
	stamboekNumber: '',
};

export const SERVER_LOGOUT_PAGE = 'auth/global-logout';
