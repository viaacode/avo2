import React, { ReactNode } from 'react';

import { SecuredRoute } from '../../authentication/components';

import { USER_PATH } from './user.const';
import { UserDetail, UserOverview } from './views';
import UserEdit from './views/UserEdit';

export const renderAdminUserRoutes = (): ReactNode[] => [
	<SecuredRoute
		key={USER_PATH.USER_OVERVIEW}
		component={UserOverview}
		exact
		path={USER_PATH.USER_OVERVIEW}
	/>,
	<SecuredRoute
		key={USER_PATH.USER_DETAIL}
		component={UserDetail}
		exact
		path={USER_PATH.USER_DETAIL}
	/>,
	<SecuredRoute
		key={USER_PATH.USER_EDIT}
		component={UserEdit}
		exact
		path={USER_PATH.USER_EDIT}
	/>,
];
