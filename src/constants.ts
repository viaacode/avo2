import { ASSIGNMENT_PATH } from './assignment/assignment.const';
import { AUTH_PATH } from './authentication/authentication.const';
import { COLLECTION_PATH } from './collection/collection.const';
import { DISCOVER_PATH } from './discover/discover.const';
import { HOME_PATH } from './home/home.const';
import { ITEM_PATH } from './item/item.const';
import { SEARCH_PATH } from './search/search.const';
import { ROUTE_PARTS } from './shared/constants';
import { WORKSPACE_PATH } from './workspace/workspace.const';

export const APP_PATH = Object.freeze({
	...ASSIGNMENT_PATH,
	...AUTH_PATH,
	...COLLECTION_PATH,
	...DISCOVER_PATH,
	...HOME_PATH,
	...ITEM_PATH,
	...SEARCH_PATH,
	...WORKSPACE_PATH,
	// TODO: Replace once available
	NEWS: `/${ROUTE_PARTS.news}`,
	PROJECTS: `/${ROUTE_PARTS.projects}`,
});
