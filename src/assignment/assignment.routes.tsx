import React, { ReactNode } from 'react';

import SecuredRoute from '../authentication/components/SecuredRoute';

import { ASSIGNMENT_PATH } from './assignment.const';
import AssignmentCreate from './views/AssignmentCreate';
import AssignmentDetail from './views/AssignmentDetail';
import AssignmentEdit from './views/AssignmentEdit';

export const renderAssignmentRoutes = (): ReactNode[] => [
	<SecuredRoute
		component={AssignmentCreate}
		exact={false}
		path={ASSIGNMENT_PATH.ASSIGNMENT_CREATE}
		key={ASSIGNMENT_PATH.ASSIGNMENT_CREATE}
	/>,
	<SecuredRoute
		component={AssignmentEdit}
		exact
		path={ASSIGNMENT_PATH.ASSIGNMENT_EDIT}
		key={ASSIGNMENT_PATH.ASSIGNMENT_EDIT}
	/>,
	<SecuredRoute
		component={AssignmentDetail}
		exact
		path={ASSIGNMENT_PATH.ASSIGNMENT_DETAIL}
		key={ASSIGNMENT_PATH.ASSIGNMENT_DETAIL}
	/>,
];
