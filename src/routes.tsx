import React, { Fragment } from 'react';
import { renderAuthenticationRoutes } from './authentication/routes';
import { renderCollectionRoutes } from './collection/routes';
import { renderItemRoutes } from './item/routes';
import { renderMyWorkspaceRoutes } from './my-workspace/routes';
import { renderSearchRoutes } from './search/routes';

export enum RouteParts {
	Search = 'zoeken',
	Item = 'item',
	Collection = 'collectie',
	Collections = 'collecties',
	MyWorkspace = 'mijn-werkruimte',
	Bookmarks = 'bladwijzers',
	Login = 'aanmelden',
	Logout = 'afmelden',
	Register = 'registreren',
}

export const renderRoutes = () => (
	<Fragment>
		{renderSearchRoutes()}
		{renderItemRoutes()}
		{renderCollectionRoutes()}
		{renderMyWorkspaceRoutes()}
		{renderAuthenticationRoutes()}
	</Fragment>
);
