import React from 'react';
import { Switch } from 'react-router';

import { renderAssignmentRoutes } from './assignment/assignment.routes';
import { renderAuthenticationRoutes } from './authentication/authentication.routes';
import { renderCollectionRoutes } from './collection/collection.routes';
import { renderDiscoverRoutes } from './discover/discover.routes';
import { renderErrorRoutes } from './error/error.routes';
import { renderHomeRoutes } from './home/home.routes';
import { renderItemRoutes } from './item/item.routes';
import { renderSearchRoutes } from './search/search.routes';
import { renderWorkspaceRoutes } from './workspace/workspace.routes';

export const renderRoutes = () => (
	<Switch>
		{renderHomeRoutes()}
		{renderSearchRoutes()}
		{renderItemRoutes()}
		{renderDiscoverRoutes()}
		{renderCollectionRoutes()}
		{renderAssignmentRoutes()}
		{renderWorkspaceRoutes()}
		{renderAuthenticationRoutes()}
		{renderErrorRoutes()}
	</Switch>
);
