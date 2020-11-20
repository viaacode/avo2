import React, { ComponentType, FunctionComponent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Redirect, Route, RouteComponentProps, withRouter } from 'react-router';
import { Dispatch } from 'redux';

import { Flex, Spacer, Spinner } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import BundleDetail from '../../bundle/views/BundleDetail';
import { CollectionDetail } from '../../collection/views';
import { APP_PATH } from '../../constants';
import { buildLink } from '../../shared/helpers';
import { AppState } from '../../store';
import { LoginMessage } from '../authentication.types';
import { isProfileComplete } from '../helpers/get-profile-info';
import { redirectToClientPage } from '../helpers/redirects';
import { getLoginStateAction } from '../store/actions';
import { selectLogin, selectLoginError, selectLoginLoading, selectUser } from '../store/selectors';

export interface DefaultSecureRouteProps<T = {}> extends RouteComponentProps<T> {
	// technically this type is incorrect, it should be Avo.User.User | undefined
	// But practically it's always Avo.User.User where we need a user and this avoids a shit ton of IF checks
	user: Avo.User.User;
}

export interface SecuredRouteProps extends DefaultSecureRouteProps {
	component: ComponentType<any>;
	exact?: boolean;
	getLoginState: () => Dispatch;
	loginState: Avo.Auth.LoginResponse | null;
	loginStateError: boolean;
	loginStateLoading: boolean;
	path?: string;
	user: Avo.User.User;
}

const SecuredRoute: FunctionComponent<SecuredRouteProps> = ({
	component,
	exact,
	getLoginState,
	loginState,
	loginStateError,
	loginStateLoading,
	path,
	history,
	user,
}) => {
	const [t] = useTranslation();

	useEffect(() => {
		if (!loginState && !loginStateLoading && !loginStateError) {
			getLoginState();
		}
	}, [getLoginState, loginState, loginStateLoading, loginStateError]);

	if ((!loginState || loginStateLoading) && !loginStateError) {
		// Wait for login check
		return (
			<Spacer margin={['top-large', 'bottom-large']}>
				<Flex center>
					<Spinner size="large" />
				</Flex>
			</Spacer>
		);
	}

	if (loginStateError) {
		redirectToClientPage(
			buildLink(
				APP_PATH.ERROR.route,
				{},
				{
					message: t(
						'authentication/components/secured-route___het-inloggen-is-mislukt-controleer-je-internet-verbinding-of-probeer-later-opnieuw'
					),
					icon: 'alert-triangle',
					actionButtons: 'home, helpdesk',
				}
			),
			history
		);
		return null;
	}

	return (
		<Route
			{...(path ? { path } : {})}
			exact={exact}
			render={(props) => {
				// Already logged in
				if (loginState && loginState.message === LoginMessage.LOGGED_IN && user) {
					if (!loginState.acceptedConditions) {
						// Redirect to the accept user and privacy declaration
						return (
							<Redirect
								to={{
									pathname: APP_PATH.ACCEPT_CONDITIONS.route,
									state: { from: props.location },
								}}
							/>
						);
					}
					if (!isProfileComplete(user)) {
						// Redirect to the complete profile route
						// So we can redirect to the originally requested route once the user completes their profile info
						return (
							<Redirect
								to={{
									pathname: APP_PATH.COMPLETE_PROFILE.route,
									state: { from: props.location },
								}}
							/>
						);
					}
					const Component = component;
					return <Component {...props} user={user} />;
				}

				// Exception so search engines can index these pages
				// - CollectionDetail
				// - BundleDetail
				if (component === CollectionDetail || component === BundleDetail) {
					const Component = component;
					return <Component {...props} user={user} />;
				}

				// On errors or not logged in => redirect to login or register page
				return (
					<Redirect
						to={{
							pathname: APP_PATH.REGISTER_OR_LOGIN.route,
							state: { from: props.location },
						}}
					/>
				);
			}}
		/>
	);
};

const mapStateToProps = (state: AppState) => ({
	user: selectUser(state),
	loginState: selectLogin(state),
	loginStateLoading: selectLoginLoading(state),
	loginStateError: selectLoginError(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => {
	return {
		getLoginState: () => dispatch(getLoginStateAction() as any),
	};
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SecuredRoute));
