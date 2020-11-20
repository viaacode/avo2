import { every, get, some } from 'lodash-es';
import queryString from 'query-string';

import { Avo } from '@viaa/avo2-types';

import { PermissionName } from '../authentication/helpers/permission-names';
import { buildLink, CustomError } from '../shared/helpers';
import { ToastService } from '../shared/services';
import { ContentPageService } from '../shared/services/content-page-service';
import i18n from '../shared/translations/i18n';
import { NavigationItemInfo } from '../shared/types';

import { COLLECTIONS_OR_BUNDLES_PATH } from './collectionsOrBundles/collections-or-bundles.const';
import { CONTENT_PAGE_LABEL_PATH } from './content-page-labels/content-page-label.const';
import { CONTENT_PATH } from './content/content.const';
import { DASHBOARD_PATH } from './dashboard/dashboard.const';
import { INTERACTIVE_TOUR_PATH } from './interactive-tour/interactive-tour.const';
import { ITEMS_PATH } from './items/items.const';
import { MENU_PATH } from './menu/menu.const';
import { PERMISSION_GROUP_PATH } from './permission-groups/permission-group.const';
import { TRANSLATIONS_PATH } from './translations/translations.const';
import { USER_GROUP_PATH } from './user-groups/user-group.const';
import { USER_PATH } from './users/user.const';

export const ADMIN_PATH = Object.freeze({
	...DASHBOARD_PATH,
	...USER_PATH,
	...USER_GROUP_PATH,
	...MENU_PATH,
	...CONTENT_PATH,
	...CONTENT_PAGE_LABEL_PATH,
	...TRANSLATIONS_PATH,
	...PERMISSION_GROUP_PATH,
	...COLLECTIONS_OR_BUNDLES_PATH,
	...ITEMS_PATH,
	...INTERACTIVE_TOUR_PATH,
});

function getNavWithSubLinks(
	itemsAndPermissions: { navItem: NavigationItemInfo; permission: string }[],
	userPermissions: string[]
): NavigationItemInfo[] {
	const availableNavItems: NavigationItemInfo[] = [];
	itemsAndPermissions.forEach((navItemAndPermission) => {
		if (userPermissions.includes(navItemAndPermission.permission)) {
			availableNavItems.push(navItemAndPermission.navItem);
		}
	});
	if (availableNavItems[0]) {
		// The first item we'll show as the main nav item
		return [
			{
				...availableNavItems[0],
				// Any other items will show up as sublinks
				subLinks: availableNavItems.slice(1),
			},
		];
	}
	// None of the items the current user can see
	return [];
}

function getUserNavItems(userPermissions: string[]): NavigationItemInfo[] {
	return getNavWithSubLinks(
		[
			{
				navItem: {
					label: i18n.t('admin/admin___gebruikers'),
					location: ADMIN_PATH.USER_OVERVIEW,
					key: 'users',
					exact: false,
				},
				permission: 'VIEW_USERS',
			},
			{
				navItem: {
					label: i18n.t('admin/admin___gebruikersgroepen'),
					location: ADMIN_PATH.USER_GROUP_OVERVIEW,
					key: 'userGroups',
					exact: false,
				},
				permission: 'EDIT_USER_GROUPS',
			},
			{
				navItem: {
					label: i18n.t('admin/admin___permissie-groepen'),
					location: ADMIN_PATH.PERMISSION_GROUP_OVERVIEW,
					key: 'permissionGroups',
					exact: false,
				},
				permission: 'EDIT_PERMISSION_GROUPS',
			},
		],
		userPermissions
	);
}

function hasPermissions(
	permissions: string[],
	booleanOperator: 'AND' | 'OR',
	userPermissions: string[],
	navInfo: NavigationItemInfo
): NavigationItemInfo[] {
	if (booleanOperator === 'OR') {
		// OR
		// If at least one of the permissions is met, render the routes
		if (some(permissions, (permission) => userPermissions.includes(permission))) {
			return [navInfo];
		}
	} else {
		// AND
		// All permissions have to be met
		if (every(permissions, (permission) => userPermissions.includes(permission))) {
			return [navInfo];
		}
	}
	return [];
}

async function getContentPageDetailRouteByPath(path: string): Promise<string | undefined> {
	try {
		const page = await ContentPageService.getContentPageByPath(path);
		if (!page) {
			throw new CustomError('Failed to fetch content page by path, reponse was null', null, {
				page,
			});
		}
		return buildLink(CONTENT_PATH.CONTENT_PAGE_DETAIL, { id: page.id });
	} catch (err) {
		console.error(new CustomError('Failed to fetch content page by pad', err, { path }));
		ToastService.danger(
			`${i18n.t(
				'admin/admin___het-ophalen-van-de-route-adhv-het-pagina-pad-is-mislukt'
			)}: ${path}`
		);
		return undefined;
	}
}

export const GET_NAV_ITEMS = async (
	userPermissions: string[],
	user: Avo.User.User
): Promise<NavigationItemInfo[]> => {
	let ownContentPageQueryParamsWithQuestionMark = '';
	let ownContentPageQueryParamsWithAmpersand = '';
	const profileId = get(user, 'profile.id');
	if (profileId) {
		const profileQueryParams = queryString.stringify({ user_profile_id: profileId });
		ownContentPageQueryParamsWithQuestionMark = `?${profileQueryParams}`;
		ownContentPageQueryParamsWithAmpersand = `&${profileQueryParams}`;
	}
	return [
		...getUserNavItems(userPermissions),
		...hasPermissions(['EDIT_NAVIGATION_BARS'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___navigatie'),
			location: ADMIN_PATH.MENU_OVERVIEW,
			key: 'navigatie',
			exact: false,
		}),
		...hasPermissions(
			['EDIT_ANY_CONTENT_PAGES', 'EDIT_OWN_CONTENT_PAGES'],
			'OR',
			userPermissions,
			{
				label: i18n.t('admin/admin___content-paginas'),
				location:
					ADMIN_PATH.CONTENT_PAGE_OVERVIEW + ownContentPageQueryParamsWithQuestionMark,
				key: 'content',
				exact: false,
				subLinks: [
					{
						label: i18n.t('admin/admin___paginas'),
						location: ADMIN_PATH.PAGES + ownContentPageQueryParamsWithAmpersand,
						key: 'pages',
						exact: true,
					},
					{
						label: i18n.t('admin/admin___projecten'),
						location: ADMIN_PATH.PROJECTS + ownContentPageQueryParamsWithAmpersand,
						key: 'projects',
						exact: true,
					},
					{
						label: i18n.t('admin/admin___nieuws'),
						location: ADMIN_PATH.NEWS + ownContentPageQueryParamsWithAmpersand,
						key: 'news',
						exact: true,
					},
					{
						label: i18n.t('admin/admin___screencasts'),
						location: ADMIN_PATH.SCREENCASTS + ownContentPageQueryParamsWithAmpersand,
						key: 'screencasts',
						exact: true,
					},
					{
						label: i18n.t('admin/admin___fa-qs'),
						location: ADMIN_PATH.FAQS + ownContentPageQueryParamsWithAmpersand,
						key: 'faqs',
						exact: true,
					},
					{
						label: i18n.t('admin/admin___overzichtspaginas'),
						location: ADMIN_PATH.OVERVIEWS + ownContentPageQueryParamsWithAmpersand,
						key: 'faqs',
						exact: true,
					},
					// Only show the startpages to the users that can edit all pages
					...(userPermissions.includes(PermissionName.EDIT_ANY_CONTENT_PAGES)
						? [
								{
									label: i18n.t('admin/admin___start-uitgelogd'),
									location: await getContentPageDetailRouteByPath('/'),
									key: 'faqs',
									exact: true,
								},
								{
									label: i18n.t('admin/admin___start-uitgelogd-leerlingen'),
									location: await getContentPageDetailRouteByPath('/leerlingen'),
									key: 'faqs',
									exact: true,
								},
								{
									label: i18n.t('admin/admin___start-ingelogd-lesgever'),
									location: await getContentPageDetailRouteByPath('/start'),
									key: 'faqs',
									exact: true,
								},
						  ]
						: []),
				],
			}
		),
		...hasPermissions(['EDIT_CONTENT_PAGE_LABELS'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___content-pagina-labels'),
			location: ADMIN_PATH.CONTENT_PAGE_LABEL_OVERVIEW,
			key: 'content-page-labels',
			exact: false,
		}),
		...hasPermissions(['VIEW_ITEMS_OVERVIEW'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___media-items'),
			location: ADMIN_PATH.ITEMS_OVERVIEW,
			key: 'items',
			exact: false,
		}),
		...hasPermissions(['VIEW_COLLECTIONS_OVERVIEW'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___collectiebeheer'),
			location: ADMIN_PATH.COLLECTIONS_OVERVIEW,
			key: 'collections',
			exact: false,
			// subLinks: [
			// 	{
			// 		label: i18n.t('admin/admin___actualisatie'),
			// 		location: `${ADMIN_PATH.COLLECTIONS_OVERVIEW}?${queryString.stringify({
			// 			columns: [
			// 				'title',
			// 				'author',
			// 				'created_at',
			// 				'last_updated_by_profile',
			// 				'updated_at',
			// 				'is_public',
			// 				'collection_labels',
			// 			],
			// 		})}`,
			// 		key: 'collections',
			// 		exact: false,
			// 	},
			// 	{
			// 		label: i18n.t('admin/admin___kwaliteitscontrole'),
			// 		location: `${ADMIN_PATH.COLLECTIONS_OVERVIEW}?${queryString.stringify({
			// 			columns: [
			// 				'title',
			// 				'author',
			// 				'created_at',
			// 				'last_updated_by_profile',
			// 				'updated_at',
			// 				'is_public',
			// 				'collection_labels',
			// 			],
			// 		})}`,
			// 		key: 'collections',
			// 		exact: false,
			// 	},
			// 	{
			// 		label: i18n.t('admin/admin___marcom'),
			// 		location: `${ADMIN_PATH.COLLECTIONS_OVERVIEW}?${queryString.stringify({
			// 			columns: [
			// 				'title',
			// 				'author',
			// 				'created_at',
			// 				'updated_at',
			// 				'is_public',
			// 				'collection_labels',
			// 			],
			// 		})}`,
			// 		key: 'collections',
			// 		exact: false,
			// 	},
			// ],
		}),
		...hasPermissions(['VIEW_BUNDLES_OVERVIEW'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___bundelbeheer'),
			location: ADMIN_PATH.BUNDLES_OVERVIEW,
			key: 'bundels',
			exact: false,
			// subLinks: [
			// 	{
			// 		label: i18n.t('admin/admin___actualisatie'),
			// 		location: `${ADMIN_PATH.BUNDLES_OVERVIEW}?${queryString.stringify({
			// 			columns: [
			// 				'title',
			// 				'author',
			// 				'created_at',
			// 				'last_updated_by_profile',
			// 				'updated_at',
			// 				'is_public',
			// 				'collection_labels',
			// 			],
			// 		})}`,
			// 		key: 'bundels',
			// 		exact: false,
			// 	},
			// 	{
			// 		label: i18n.t('admin/admin___kwaliteitscontrole'),
			// 		location: `${ADMIN_PATH.BUNDLES_OVERVIEW}?${queryString.stringify({
			// 			columns: [
			// 				'title',
			// 				'author',
			// 				'created_at',
			// 				'last_updated_by_profile',
			// 				'updated_at',
			// 				'is_public',
			// 				'collection_labels',
			// 			],
			// 		})}`,
			// 		key: 'bundels',
			// 		exact: false,
			// 	},
			// 	{
			// 		label: i18n.t('admin/admin___marcom'),
			// 		location: `${ADMIN_PATH.BUNDLES_OVERVIEW}?${queryString.stringify({
			// 			columns: [
			// 				'title',
			// 				'author',
			// 				'created_at',
			// 				'updated_at',
			// 				'is_public',
			// 				'collection_labels',
			// 			],
			// 		})}`,
			// 		key: 'bundels',
			// 		exact: false,
			// 	},
			// ],
		}),
		...hasPermissions(['VIEW_PUBLISH_ITEMS_OVERVIEW'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___items-publiceren'),
			location: ADMIN_PATH.PUBLISH_ITEMS_OVERVIEW,
			key: 'publish-items',
			exact: false,
		}),
		...hasPermissions(['EDIT_INTERACTIVE_TOURS'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___interactive-tours'),
			location: ADMIN_PATH.INTERACTIVE_TOUR_OVERVIEW,
			key: 'interactiveTours',
			exact: false,
		}),
		...hasPermissions(['EDIT_TRANSLATIONS'], 'OR', userPermissions, {
			label: i18n.t('admin/admin___vertaling'),
			location: ADMIN_PATH.TRANSLATIONS,
			key: 'translations',
			exact: false,
		}),
	];
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const IDP_COLORS: { [idp in Avo.Auth.IdpType]: string } = {
	HETARCHIEF: '#25a4cf',
	KLASCEMENT: '#f7931b',
	SMARTSCHOOL: '#f05a1a',
};
/* eslint-enable @typescript-eslint/no-unused-vars */
