import { get, keys } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { connect } from 'react-redux';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { Dispatch } from 'redux';

import { Avo } from '@viaa/avo2-types';

import { ContentPageInfo } from '../../admin/content/content.types';
import { getPublishedDate } from '../../admin/content/helpers/get-published-state';
import { ItemsService } from '../../admin/items/items.service';
import { SpecialPermissionGroups } from '../../authentication/authentication.types';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { redirectToErrorPage } from '../../authentication/helpers/redirects';
import { getLoginStateAction } from '../../authentication/store/actions';
import {
	selectLogin,
	selectLoginError,
	selectLoginLoading,
} from '../../authentication/store/selectors';
import { CollectionService } from '../../collection/collection.service';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import { ContentPage } from '../../content-page/views';
import { ErrorView } from '../../error/views';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../shared/components';
import Html from '../../shared/components/Html/Html';
import JsonLd from '../../shared/components/JsonLd/JsonLd';
import {
	buildLink,
	CustomError,
	generateSearchLinkString,
	getFullName,
	stripHtml,
} from '../../shared/helpers';
import { ContentPageService } from '../../shared/services/content-page-service';
import { AppState } from '../../store';
import { GET_ERROR_MESSAGES, GET_REDIRECTS } from '../dynamic-route-resolver.const';

type DynamicRouteType = 'contentPage' | 'bundle' | 'notFound' | 'depublishedContentPage';

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
					message: t(
						'dynamic-route-resolver/views/dynamic-route-resolver___het-controleren-van-je-login-status-is-mislukt'
					),
					actionButtons: ['home', 'helpdesk'],
				});
				return;
			}

			const pathname = location.pathname;

			// Check if path is avo1 path that needs to be redirected
			const redirects = GET_REDIRECTS();
			const pathWithHash = pathname + location.hash;
			const key: string | undefined = keys(redirects).find((key) =>
				new RegExp(`^${key}$`, 'gi').test(pathWithHash)
			);
			if (key && redirects[key]) {
				window.location.href = redirects[key];
				return;
			}

			if (pathname === '/' && loginState.message === 'LOGGED_IN') {
				// Redirect the logged out homepage to the logged in homepage is the user is logged in
				history.replace('/start');
				return;
			}

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
						history.replace(
							buildLink(APP_PATH.ITEM_DETAIL.route, { id: itemExternalId })
						);
						return;
					} // else keep analysing

					// Check if id matches a bundle id
					const bundleUuid = await CollectionService.fetchUuidByAvo1Id(avo1Id);
					if (bundleUuid) {
						// Redirect to the new bundle url, since we want to discourage use of the old avo1 urls
						history.replace(
							buildLink(APP_PATH.BUNDLE_DETAIL.route, { id: bundleUuid })
						);
						return;
					} // else keep analysing
				}
			}

			// Check if path is old item id
			if (/\/pid\/[^/]+/g.test(pathname)) {
				const itemPid = (pathname.split('/').pop() || '').trim();
				history.replace(buildLink(APP_PATH.ITEM_DETAIL.route, { id: itemPid }));
				return;
			}

			// Special route exception
			// /klaar/archief: redirect teachers to search page with klaar filter
			if (
				pathname === '/klaar/archief' &&
				(loginState as any).userInfo &&
				PermissionService.hasPerm((loginState as any).userInfo, PermissionName.SEARCH)
			) {
				history.replace(
					generateSearchLinkString('serie', 'KLAAR', 'broadcastDate', 'desc')
				);
				return;
			}

			// Check if path points to a content page
			try {
				const contentPage: ContentPageInfo | null = await ContentPageService.getContentPageByPath(
					pathname
				);
				// Path is indeed a content page url
				setRouteInfo({ type: 'contentPage', data: contentPage });
			} catch (err) {
				if (JSON.stringify(err).includes('CONTENT_PAGE_DEPUBLISHED')) {
					const type = get(
						err,
						'innerException.additionalInfo.responseContent.additionalInfo.contentPageType'
					);
					setRouteInfo({ type: 'depublishedContentPage', data: { type } });
				} else {
					setRouteInfo({ type: 'notFound', data: null });
				}
			}

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
	}, [loginState, location.pathname, location.hash, setRouteInfo, setLoadingInfo, history, t]);

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
			redirectToErrorPage(
				{
					message: t(
						'dynamic-route-resolver/views/dynamic-route-resolver___er-ging-iets-mis-bij-het-inloggen'
					),
					actionButtons: ['home', 'helpdesk'],
				},
				location
			);
		}
	}, [getLoginState, loginState, loginStateError, loginStateLoading, t, location]);

	useEffect(() => {
		if (loginState && location.pathname) {
			// Analyse the path and determine the routeType
			analyseRoute();
		}
	}, [loginState, location.pathname, analyseRoute]);

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

			const description =
				get(routeInfo.data, 'seo_description') ||
				get(routeInfo.data, 'description') ||
				(get(routeInfo.data, 'description_html')
					? stripHtml(get(routeInfo.data, 'description_html'))
					: null) ||
				'';
			return (
				<>
					<MetaTags>
						<title>{GENERATE_SITE_TITLE(get(routeInfo.data, 'title'))}</title>
						<meta name="description" content={description} />
					</MetaTags>
					<JsonLd
						url={window.location.href}
						title={get(routeInfo.data, 'title', '')}
						description={description}
						image={get(routeInfo.data, 'thumbnail_path')}
						isOrganisation={!!get(routeInfo.data, 'profile.organisation')}
						author={getFullName(get(routeInfo.data, 'profile'), true, false)}
						publishedAt={getPublishedDate(routeInfo.data)}
						updatedAt={get(routeInfo.data, 'updated_at')}
					/>
					<ContentPage contentPageInfo={routeInfo.data} />
				</>
			);
		}
		if (routeInfo && routeInfo.type === 'depublishedContentPage') {
			return (
				<ErrorView icon="clock" actionButtons={['home', 'helpdesk']} message="">
					<Html
						content={
							GET_ERROR_MESSAGES()[`DEPUBLISHED_${routeInfo.data.type}`] ||
							GET_ERROR_MESSAGES()[`DEPUBLISHED_PAGINA`]
						}
						sanitizePreset={'link'}
					/>
				</ErrorView>
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
