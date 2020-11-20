import { FunctionComponent } from 'react';
import { RouteComponentProps } from 'react-router';

import { SpecialUserGroup } from '../../admin/user-groups/user-group.const';
import withUser, { UserProps } from '../../shared/hocs/withUser';
import { getUserGroupId } from '../helpers/get-profile-info';
import { redirectToServerLogoutPage } from '../helpers/redirects';

export interface LogoutProps extends RouteComponentProps, UserProps {}

export const Logout: FunctionComponent<LogoutProps> = ({ location, user }) => {
	redirectToServerLogoutPage(
		location,
		getUserGroupId(user as any) === SpecialUserGroup.Pupil ? '/leerlingen' : '/'
	);
	return null;
};

export default withUser(Logout) as FunctionComponent<RouteComponentProps>;
