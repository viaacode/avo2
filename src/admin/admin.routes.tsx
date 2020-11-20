import { every, some } from 'lodash-es';
import React, { ReactNode } from 'react';
import { Switch } from 'react-router';

import { PermissionName } from '../authentication/helpers/permission-names';
import { renderErrorRoutes } from '../error/error.routes';

import { renderCollectionOrBundleRoutes } from './collectionsOrBundles/collections-or-bundles.routes';
import { renderAdminContentPageLabelRoutes } from './content-page-labels/content-page-label.routes';
import { renderAdminContentRoutes } from './content/content.routes';
import { renderAdminDashboardRoutes } from './dashboard/dashboard.routes';
import { renderInteractiveTourRoutes } from './interactive-tour/interactive-tour.routes';
import { renderItemRoutes, renderPublishItemRoutes } from './items/items.routes';
import { renderAdminMenuRoutes } from './menu/menu.routes';
import { renderAdminPermissionGroupRoutes } from './permission-groups/permission-group.routes';
import { renderAdminTranslationsRoutes } from './translations/translations.routes';
import { renderAdminUserGroupRoutes } from './user-groups/user-group.routes';
import { renderAdminUserRoutes } from './users/user.routes';

export const renderAdminRoutes = (userPermissions: string[]) => {
	const renderWithPermissions = (
		renderFunc: (userPermissions: string[]) => ReactNode[],
		permissions: string[],
		booleanOperator: 'AND' | 'OR' = 'OR'
	): ReactNode[] => {
		if (booleanOperator === 'OR') {
			// OR
			// If at least one of the permissions is met, render the routes
			if (some(permissions, (permission) => userPermissions.includes(permission))) {
				return renderFunc(userPermissions);
			}
		} else {
			// AND
			// All permissions have to be met
			if (every(permissions, (permission) => userPermissions.includes(permission))) {
				return renderFunc(userPermissions);
			}
		}
		return [];
	};

	return (
		<Switch>
			{renderAdminDashboardRoutes()}
			{renderWithPermissions(renderAdminUserRoutes, [PermissionName.VIEW_USERS])}
			{renderWithPermissions(renderAdminUserGroupRoutes, [PermissionName.EDIT_USER_GROUPS])}
			{renderWithPermissions(renderAdminPermissionGroupRoutes, [
				PermissionName.EDIT_PERMISSION_GROUPS,
			])}
			{renderWithPermissions(renderAdminMenuRoutes, [PermissionName.EDIT_NAVIGATION_BARS])}
			{renderWithPermissions(
				renderAdminContentRoutes,
				[PermissionName.EDIT_OWN_CONTENT_PAGES, PermissionName.EDIT_ANY_CONTENT_PAGES],
				'OR'
			)}
			{renderWithPermissions(renderAdminContentPageLabelRoutes, [
				PermissionName.EDIT_CONTENT_PAGE_LABELS,
			])}
			{renderWithPermissions(renderItemRoutes, [PermissionName.VIEW_ITEMS_OVERVIEW])}
			{renderWithPermissions(renderPublishItemRoutes, [PermissionName.PUBLISH_ITEMS])}
			{renderWithPermissions(
				renderCollectionOrBundleRoutes,
				[PermissionName.VIEW_COLLECTIONS_OVERVIEW, PermissionName.VIEW_BUNDLES_OVERVIEW],
				'OR'
			)}
			{renderWithPermissions(renderInteractiveTourRoutes, [
				PermissionName.EDIT_INTERACTIVE_TOURS,
			])}
			{renderWithPermissions(renderAdminTranslationsRoutes, [
				PermissionName.EDIT_TRANSLATIONS,
			])}
			{/* Default routes */}
			{renderErrorRoutes()}
		</Switch>
	);
};
