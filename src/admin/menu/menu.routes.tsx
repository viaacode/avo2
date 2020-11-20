import React, { ReactNode } from 'react';

import { SecuredRoute } from '../../authentication/components';

import { MENU_PATH } from './menu.const';
import { MenuDetail, MenuEdit, MenuOverview } from './views';

export const renderAdminMenuRoutes = (): ReactNode[] => [
	<SecuredRoute
		key={MENU_PATH.MENU_OVERVIEW}
		component={MenuOverview}
		exact
		path={MENU_PATH.MENU_OVERVIEW}
	/>,
	<SecuredRoute
		key={MENU_PATH.MENU_CREATE}
		component={MenuEdit}
		exact
		path={MENU_PATH.MENU_CREATE}
	/>,
	<SecuredRoute
		key={MENU_PATH.MENU_DETAIL}
		component={MenuDetail}
		exact
		path={MENU_PATH.MENU_DETAIL}
	/>,
	<SecuredRoute
		key={MENU_PATH.MENU_ITEM_CREATE}
		component={MenuEdit}
		exact
		path={MENU_PATH.MENU_ITEM_CREATE}
	/>,
	<SecuredRoute
		key={MENU_PATH.MENU_ITEM_EDIT}
		component={MenuEdit}
		exact
		path={MENU_PATH.MENU_ITEM_EDIT}
	/>,
];
