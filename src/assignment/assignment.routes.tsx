import React, { ReactNode } from 'react';

import { SecuredRoute } from '../authentication/components';
import { RouteParts } from '../constants';

import { AssignmentDetail, AssignmentEdit } from './views';

export const renderAssignmentRoutes = (): ReactNode[] => [
	<SecuredRoute
		component={AssignmentEdit}
		exact
		path={`/${RouteParts.Workspace}/${RouteParts.Assignments}/:id/${RouteParts.Edit}`}
		key={`/${RouteParts.Workspace}/${RouteParts.Assignments}/:id/${RouteParts.Edit}`}
	/>,
	<SecuredRoute
		component={AssignmentEdit}
		exact={false}
		path={`/${RouteParts.Workspace}/${RouteParts.Assignments}/${RouteParts.Create}`}
		key={`/${RouteParts.Workspace}/${RouteParts.Assignments}/${RouteParts.Create}`}
	/>,
	<SecuredRoute
		component={AssignmentDetail}
		exact
		path={`/${RouteParts.Assignment}/:id`}
		key={`/${RouteParts.Assignment}/:id`}
	/>,
];
