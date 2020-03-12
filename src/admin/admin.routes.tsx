import React from 'react';
import { Switch } from 'react-router';

import { renderErrorRoutes } from '../error/error.routes';
import { renderCollectionOrBundleRoutes } from './collectionsOrBundles/collections-or-bundles.routes';
import { renderAdminContentRoutes } from './content/content.routes';
import { renderAdminDashboardRoutes } from './dashboard/dashboard.routes';
import { renderInteractiveTourRoutes } from './interactive-tour/interactive-tour.routes';
import { renderItemRoutes } from './items/items.routes';
import { renderAdminMenuRoutes } from './menu/menu.routes';
import { renderAdminUserGroupRoutes } from './user-groups/user-group.routes';
import { renderAdminUserRoutes } from './users/user.routes';

export const renderAdminRoutes = () => (
	<Switch>
		{renderAdminDashboardRoutes()}
		{renderAdminUserRoutes()}
		{renderAdminMenuRoutes()}
		{renderAdminContentRoutes()}
		{renderAdminUserGroupRoutes()}
		{renderItemRoutes()}
		{renderCollectionOrBundleRoutes()}
		{renderInteractiveTourRoutes()}
		{/* Default routes */}
		{renderErrorRoutes()}
	</Switch>
);
