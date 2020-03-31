import { get } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Flex } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { LoadingErrorLoadedComponent, LoadingInfo } from '../shared/components';
import withUser from '../shared/hocs/withUser';
import { ADMIN_PATH, GET_NAV_ITEMS } from './admin.const';
import { renderAdminRoutes } from './admin.routes';
import { Sidebar } from './shared/components';

const Admin: FunctionComponent<{ user: Avo.User.User }> = ({ user }) => {
	const [t] = useTranslation();

	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });

	useEffect(() => {
		if (!user) {
			return;
		}
		const permissions = get(user, 'profile.permissions', []);
		if (permissions.includes('VIEW_ADMIN_DASHBOARD')) {
			setLoadingInfo({ state: 'loaded' });
		} else {
			setLoadingInfo({
				state: 'error',
				icon: 'lock',
				message: t(
					'Je hebt geen rechten om het beheer dashboard te bekijken (VIEW_ADMIN_DASHBOARD)'
				),
				actionButtons: ['home', 'helpdesk'],
			});
		}
	}, [user, setLoadingInfo, t]);

	const renderAdminPage = () => {
		return (
			<Flex>
				<Sidebar headerLink={ADMIN_PATH.DASHBOARD} navItems={GET_NAV_ITEMS()} />
				<Flex className="o-app--admin__main u-flex-auto u-scroll" orientation="vertical">
					{renderAdminRoutes()}
				</Flex>
			</Flex>
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
