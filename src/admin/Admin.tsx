import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Flex } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { PermissionName } from '../authentication/helpers/permission-names';
import { PermissionService } from '../authentication/helpers/permission-service';
import { LoadingErrorLoadedComponent, LoadingInfo, ResizablePanels } from '../shared/components';
import { CustomError } from '../shared/helpers';
import withUser from '../shared/hocs/withUser';
import { ToastService } from '../shared/services';
import { NavigationItemInfo } from '../shared/types';

import { ADMIN_PATH, GET_NAV_ITEMS } from './admin.const';
import { renderAdminRoutes } from './admin.routes';
import './Admin.scss';
import { Sidebar } from './shared/components';

const Admin: FunctionComponent<{ user: Avo.User.User }> = ({ user }) => {
	const [t] = useTranslation();

	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [userPermissions, setUserPermissions] = useState<PermissionName[] | null>(null);
	const [navigationItems, setNavigationItems] = useState<NavigationItemInfo[] | null>(null);

	useEffect(() => {
		if (!user) {
			return;
		}
		if (PermissionService.hasPerm(user, PermissionName.VIEW_ADMIN_DASHBOARD)) {
			const tempUserPermissions = PermissionService.getUserPermissions(user);
			setUserPermissions(tempUserPermissions);
			GET_NAV_ITEMS(tempUserPermissions, user)
				.then(setNavigationItems)
				.catch((err) => {
					console.error(new CustomError('Failed to get nav items', err));
					ToastService.danger('Het ophalen van de navigatie items is mislukt');
				});
		} else {
			setLoadingInfo({
				state: 'error',
				icon: 'lock',
				message: t(
					'admin/admin___je-hebt-geen-rechten-om-het-beheer-dashboard-te-bekijken-view-admin-dashboard'
				),
				actionButtons: ['home', 'helpdesk'],
			});
		}

		// Remove zendesk when loading beheer after visiting the client side of the app
		const zendeskWidget = document.querySelector('iframe#launcher');
		if (zendeskWidget) {
			zendeskWidget.remove();
		}
	}, [user, setLoadingInfo, t]);

	useEffect(() => {
		if (userPermissions && navigationItems) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [userPermissions, navigationItems, setLoadingInfo]);

	useEffect(() => {
		const widget = document.querySelector('iframe#launcher');
		if (widget) {
			widget.remove();
		}
	}, []);

	const renderAdminPage = () => {
		if (!navigationItems || !userPermissions) {
			return null;
		}
		return (
			<div className="m-resizable-panels">
				<ResizablePanels
					displayDirection="row"
					panelsSize={[300]}
					sizeUnitMeasure="px"
					resizerSize="15px"
				>
					<Sidebar
						headerLink={ADMIN_PATH.DASHBOARD}
						navItems={navigationItems}
						className="o-app--admin__sidebar"
					/>
					<Flex
						className="o-app--admin__main u-flex-auto u-scroll"
						orientation="vertical"
					>
						{renderAdminRoutes(userPermissions)}
					</Flex>
				</ResizablePanels>
			</div>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={{}}
			render={renderAdminPage}
		/>
	);
};

export default withUser(Admin) as FunctionComponent;
