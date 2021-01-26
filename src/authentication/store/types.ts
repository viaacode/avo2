import { Action } from 'redux';

import { Avo } from '@viaa/avo2-types';

export enum LoginActionTypes {
	SET_LOGIN_LOADING = '@@login/SET_LOGIN_LOADING',
	SET_LOGIN_SUCCESS = '@@login/SET_LOGIN_SUCCESS',
	SET_LOGIN_ERROR = '@@login/SET_LOGIN_ERROR',
	SET_ACCEPT_CONDITIONS = '@@login/SET_ACCEPT_CONDITIONS',
}

export interface SetLoginSuccessAction extends Action {
	data: Avo.Auth.LoginResponse | null;
}

export interface SetLoginLoadingAction extends Action {}

export interface SetAcceptConditionsAction extends Action {}

export interface SetLoginErrorAction extends Action {
	error: boolean;
}

export type LoginAction = SetLoginSuccessAction | SetLoginLoadingAction | SetLoginErrorAction;

export interface LoginState {
	readonly data: Avo.Auth.LoginResponse | null;
	readonly loading: boolean;
	readonly error: boolean;
}
