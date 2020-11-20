import { compact } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { ROUTE_PARTS } from './shared/constants';
import i18n from './shared/translations/i18n';

export interface RouteInfo {
	route: string;
	showInContentPicker: boolean;
	showForInteractiveTour: boolean;
}

export type RouteId =
	| 'LOGIN'
	| 'LOGOUT'
	| 'REGISTER_OR_LOGIN'
	| 'MANUAL_ACCESS_REQUEST'
	| 'STUDENT_TEACHER'
	| 'STAMBOEK'
	| 'COLLECTION_DETAIL'
	| 'COLLECTION_EDIT'
	| 'BUNDLE_DETAIL'
	| 'BUNDLE_EDIT'
	| 'LOGGED_OUT_HOME'
	| 'LOGGED_IN_HOME'
	| 'ITEM_DETAIL'
	| 'SEARCH'
	| 'USER_ITEM_REQUEST_FORM'
	| 'USER_ITEM_REQUEST_FORM_CONFIRM'
	| 'WORKSPACE'
	| 'WORKSPACE_TAB'
	| 'WORKSPACE_COLLECTIONS'
	| 'WORKSPACE_BUNDLES'
	| 'WORKSPACE_ASSIGNMENTS'
	| 'WORKSPACE_BOOKMARKS'
	| 'ASSIGNMENT_CREATE'
	| 'ASSIGNMENT_DETAIL'
	| 'ASSIGNMENT_EDIT'
	| 'ASSIGNMENT_RESPONSES'
	| 'SETTINGS'
	| 'SETTINGS_TAB'
	| 'SETTINGS_PROFILE'
	| 'SETTINGS_ACCOUNT'
	| 'SETTINGS_EMAIL'
	| 'SETTINGS_NOTIFICATIONS'
	| 'COMPLETE_PROFILE'
	| 'ACCEPT_CONDITIONS'
	| 'COOKIE_POLICY'
	| 'ERROR';

// Routes should be ordered from least specific, to most specific
// So we can use this order to search for interactive tours in the correct order
/* eslint-disable @typescript-eslint/no-unused-vars */
export const APP_PATH: { [routeId in RouteId]: RouteInfo } = {
	/* eslint-enable @typescript-eslint/no-unused-vars */
	LOGIN: {
		route: `/${ROUTE_PARTS.login}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	LOGOUT: {
		route: `/${ROUTE_PARTS.logout}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	REGISTER_OR_LOGIN: {
		route: `/${ROUTE_PARTS.registerOrLogin}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	MANUAL_ACCESS_REQUEST: {
		route: `/${ROUTE_PARTS.manualAccessRequest}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	STUDENT_TEACHER: {
		route: `/${ROUTE_PARTS.studentTeacher}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	STAMBOEK: {
		route: `/${ROUTE_PARTS.stamboek}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	COLLECTION_DETAIL: {
		route: `/${ROUTE_PARTS.collections}/:id`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	COLLECTION_EDIT: {
		route: `/${ROUTE_PARTS.collections}/:id/${ROUTE_PARTS.edit}`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	BUNDLE_DETAIL: {
		route: `/${ROUTE_PARTS.bundles}/:id`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	BUNDLE_EDIT: {
		route: `/${ROUTE_PARTS.bundles}/:id/${ROUTE_PARTS.edit}`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	LOGGED_OUT_HOME: {
		route: '/',
		showInContentPicker: false,
		showForInteractiveTour: false,
	},
	LOGGED_IN_HOME: {
		route: `/${ROUTE_PARTS.loggedInHome}`,
		showInContentPicker: false,
		showForInteractiveTour: false,
	},
	ITEM_DETAIL: {
		route: `/${ROUTE_PARTS.item}/:id`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	SEARCH: {
		route: `/${ROUTE_PARTS.search}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	USER_ITEM_REQUEST_FORM: {
		route: '/gebruiker-item-aanvraag',
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	USER_ITEM_REQUEST_FORM_CONFIRM: {
		route: '/gebruiker-item-aanvraag-bevestiging',
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	WORKSPACE: {
		route: `/${ROUTE_PARTS.workspace}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	WORKSPACE_TAB: {
		route: `/${ROUTE_PARTS.workspace}/:tabId`,
		showInContentPicker: false,
		showForInteractiveTour: false,
	},
	WORKSPACE_COLLECTIONS: {
		route: `/${ROUTE_PARTS.workspace}/${ROUTE_PARTS.collections}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	WORKSPACE_BUNDLES: {
		route: `/${ROUTE_PARTS.workspace}/${ROUTE_PARTS.bundles}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	WORKSPACE_ASSIGNMENTS: {
		route: `/${ROUTE_PARTS.workspace}/${ROUTE_PARTS.assignments}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	WORKSPACE_BOOKMARKS: {
		route: `/${ROUTE_PARTS.workspace}/${ROUTE_PARTS.bookmarks}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	ASSIGNMENT_CREATE: {
		route: `/${ROUTE_PARTS.workspace}/${ROUTE_PARTS.assignments}/${ROUTE_PARTS.create}`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	ASSIGNMENT_DETAIL: {
		route: `/${ROUTE_PARTS.assignments}/:id`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	ASSIGNMENT_EDIT: {
		route: `/${ROUTE_PARTS.workspace}/${ROUTE_PARTS.assignments}/:id/${ROUTE_PARTS.edit}`,
		showInContentPicker: false,
		showForInteractiveTour: true,
	},
	ASSIGNMENT_RESPONSES: {
		route: `/${ROUTE_PARTS.workspace}/${ROUTE_PARTS.assignments}/:id/${ROUTE_PARTS.responses}`,
		showInContentPicker: false,
		showForInteractiveTour: false,
	},
	SETTINGS: {
		route: `/${ROUTE_PARTS.settings}`,
		showInContentPicker: false,
		showForInteractiveTour: false,
	},
	SETTINGS_TAB: {
		route: `/${ROUTE_PARTS.settings}/:tabId`,
		showInContentPicker: false,
		showForInteractiveTour: false,
	},
	SETTINGS_PROFILE: {
		route: `/${ROUTE_PARTS.settings}/${ROUTE_PARTS.profile}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	SETTINGS_ACCOUNT: {
		route: `/${ROUTE_PARTS.settings}/${ROUTE_PARTS.account}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	SETTINGS_EMAIL: {
		route: `/${ROUTE_PARTS.settings}/${ROUTE_PARTS.email}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	SETTINGS_NOTIFICATIONS: {
		route: `/${ROUTE_PARTS.settings}/${ROUTE_PARTS.notifications}`,
		showInContentPicker: true,
		showForInteractiveTour: true,
	},
	COMPLETE_PROFILE: {
		route: `/${ROUTE_PARTS.completeProfile}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	ACCEPT_CONDITIONS: {
		route: `/${ROUTE_PARTS.acceptConditions}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	COOKIE_POLICY: {
		route: `/${ROUTE_PARTS.cookiePolicy}`,
		showInContentPicker: true,
		showForInteractiveTour: false,
	},
	ERROR: {
		route: `/${ROUTE_PARTS.error}`,
		showInContentPicker: false,
		showForInteractiveTour: false,
	},
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const CONTENT_TYPE_TO_ROUTE: { [contentType in Avo.Core.ContentType]: string } = {
	/* eslint-enable @typescript-eslint/no-unused-vars */
	video: APP_PATH.ITEM_DETAIL.route,
	audio: APP_PATH.ITEM_DETAIL.route,
	collectie: APP_PATH.COLLECTION_DETAIL.route,
	bundel: APP_PATH.BUNDLE_DETAIL.route,
	map: APP_PATH.BUNDLE_DETAIL.route, // TODO remove once this task is complete: https://meemoo.atlassian.net/browse/DEV-729
} as any; // TODO remove cast once this task is complete: https://meemoo.atlassian.net/browse/DEV-729

export const GENERATE_SITE_TITLE = (...pageTitleParts: (string | null | undefined)[]) =>
	compact([...pageTitleParts, i18n.t('constants___het-archief-voor-onderwijs')]).join(' | ');
