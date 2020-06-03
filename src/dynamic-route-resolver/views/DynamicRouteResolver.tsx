import { get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { connect } from 'react-redux';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { Dispatch } from 'redux';

import { Avo } from '@viaa/avo2-types';

import { ItemsService } from '../../admin/items/items.service';
import { UserService } from '../../admin/users/user.service';
import { SpecialPermissionGroups } from '../../authentication/authentication.types';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { getLoginStateAction } from '../../authentication/store/actions';
import {
	selectLogin,
	selectLoginError,
	selectLoginLoading,
} from '../../authentication/store/selectors';
import { GET_COLLECTIONS_BY_AVO1_ID } from '../../bundle/bundle.gql';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import { ContentPage } from '../../content-page/views';
import { ErrorView } from '../../error/views';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../shared/components';
import { buildLink, CustomError, generateSearchLinkString } from '../../shared/helpers';
import { dataService } from '../../shared/services';
import { ContentPageService } from '../../shared/services/content-page-service';
import { AppState } from '../../store';

type DynamicRouteType = 'contentPage' | 'bundle' | 'notFound';

interface RouteInfo {
	type: DynamicRouteType;
	data: any;
}

interface DynamicRouteResolverProps extends RouteComponentProps {
	getLoginState: () => Dispatch;
	loginState: Avo.Auth.LoginResponse | null;
	loginStateError: boolean;
	loginStateLoading: boolean;
}

const DynamicRouteResolver: FunctionComponent<DynamicRouteResolverProps> = ({
	getLoginState,
	history,
	location,
	loginState,
	loginStateError,
	loginStateLoading,
}) => {
	const [t] = useTranslation();

	// State
	const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });

	const analyseRoute = useCallback(async () => {
		try {
			if (!loginState) {
				setLoadingInfo({
					state: 'error',
					message: t('Het controleren van je login status is mislukt'),
					actionButtons: ['home', 'helpdesk'],
				});
				return;
			}

			const pathname = location.pathname;

			// Check if path is an old media url
			if (/\/media\/[^/]+\/[^/]+/g.test(pathname)) {
				const avo1Id = (pathname.split('/').pop() || '').trim();
				if (avo1Id) {
					// Check if id matches an item mediamosa id
					const itemExternalId = await ItemsService.fetchItemExternalIdByMediamosaId(
						avo1Id
					);

					if (itemExternalId) {
						// Redirect to the new bundle url, since we want to discourage use of the old avo1 urls
						history.push(buildLink(APP_PATH.ITEM_DETAIL.route, { id: itemExternalId }));
						return;
					} // else keep analysing

					// Check if id matches a bundle id
					const bundleResponse = await dataService.query({
						query: GET_COLLECTIONS_BY_AVO1_ID,
						variables: {
							avo1Id,
						},
					});
					const bundleUuid: string | undefined = get(bundleResponse, 'data.items[0].id');
					if (bundleUuid) {
						// Redirect to the new bundle url, since we want to discourage use of the old avo1 urls
						history.push(buildLink(APP_PATH.BUNDLE_DETAIL.route, { id: bundleUuid }));
						return;
					} // else keep analysing
				}
			}

			// Check if path is old item id
			if (/\/pid\/[^/]+/g.test(pathname)) {
				const itemPid = (pathname.split('/').pop() || '').trim();
				history.push(buildLink(APP_PATH.ITEM_DETAIL.route, { id: itemPid }));
				return;
			}

			// Special route exception
			// /klaar/archief: redirect teachers to search page with klaar filter
			if (
				pathname === '/klaar/archief' &&
				PermissionService.hasPerm(loginState.userInfo, PermissionName.SEARCH)
			) {
				history.push(generateSearchLinkString('serie', 'Klaar'));
				return;
			}

			// Special route exception
			// /start when user is a pupil => should be redirected to /werkruimte/opdrachten
			if (
				pathname === APP_PATH.LOGGED_IN_HOME.route &&
				UserService.getUserRole(loginState.userInfo) === 'leerling'
			) {
				history.push(APP_PATH.WORKSPACE_ASSIGNMENTS.route);
				return;
			}

			// Check if path points to a content page
			const contentPage: Avo.Content.Content | null = await ContentPageService.getContentPageByPath(
				pathname
			);
			if (!contentPage) {
				setRouteInfo({ type: 'notFound', data: null });
				return;
			}
			// Path is indeed a content page url
			setRouteInfo({ type: 'contentPage', data: contentPage });
			return;
		} catch (err) {
			console.error(
				new CustomError('Error during analysis of the route', err, {
					path: location.pathname,
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t('error/views/error-view___de-pagina-werd-niet-gevonden'),
				icon: 'search',
			});
		}
	}, [loginState, location.pathname, setRouteInfo, setLoadingInfo, history, t]);

	// Check if current user is logged in
	useEffect(() => {
		if (!loginState && !loginStateLoading && !loginStateError) {
			getLoginState();
		} else if (loginStateError) {
			console.error(
				new CustomError('Login error was encountered', null, {
					loginStateError,
					loginState,
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t('Er ging iets mis bij het inloggen'),
				actionButtons: ['home', 'helpdesk'],
			});
		}
	}, [getLoginState, loginState, loginStateError, loginStateLoading]);

	useEffect(() => {
		if (loginState && location.pathname) {
			// Analyse the path and determine the routeType
			analyseRoute();
		}
	}, [loginState, location.pathname]);

	useEffect(() => {
		if (routeInfo) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [routeInfo]);

	const renderRouteComponent = () => {
		if (routeInfo && routeInfo.type === 'contentPage') {
			const routeUserGroupIds = get(routeInfo, 'data.user_group_ids', []);
			// Check if the page requires the user to be logged in and not both logged in or out
			if (
				routeUserGroupIds.includes[SpecialPermissionGroups.loggedInUsers] &&
				!routeUserGroupIds.includes[SpecialPermissionGroups.loggedOutUsers]
			) {
				return (
					<Redirect
						to={{
							pathname: APP_PATH.REGISTER_OR_LOGIN.route,
							state: { from: location },
						}}
					/>
				);
			}

			return (
				<>
					<MetaTags>
						<title>{GENERATE_SITE_TITLE(get(routeInfo.data, 'title'))}</title>
						<meta
							name="description"
							content={
								get(routeInfo.data, 'seo_description') ||
								get(routeInfo.data, 'description') ||
								''
							}
						/>
					</MetaTags>
					<ContentPage contentPage={routeInfo.data} />
				</>
			);
		}
		console.error(
			new CustomError("Route doesn't seem to be a bundle or content page", null, {
				routeInfo,
				path: location.pathname,
			})
		);
		return (
			<ErrorView
				message={t('error/views/error-view___de-pagina-werd-niet-gevonden')}
				icon="search"
				actionButtons={['home', 'helpdesk']}
			/>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={routeInfo}
			render={renderRouteComponent}
		/>
	);
};

const mapStateToProps = (state: AppState) => ({
	loginState: selectLogin(state),
	loginStateLoading: selectLoginLoading(state),
	loginStateError: selectLoginError(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	getLoginState: () => dispatch(getLoginStateAction() as any),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DynamicRouteResolver));
