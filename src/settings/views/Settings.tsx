import React, { FunctionComponent, ReactElement, ReactText, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { BlockHeading, Container, Navbar, Tabs, Toolbar, ToolbarLeft } from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../authentication/helpers/redirects';
import { buildLink } from '../../shared/helpers';
import toastService from '../../shared/services/toast-service';

import { Account, Email, Notifications, Profile } from '../components';
import {
	ACCOUNT_ID,
	EMAIL_ID,
	NOTIFICATIONS_ID,
	PROFILE_ID,
	SETTINGS_PATH,
	SettingsTab,
} from '../settings.const';

interface ForPupilsProps extends DefaultSecureRouteProps<{ tabId: string }> {}

const Settings: FunctionComponent<ForPupilsProps> = props => {
	const [t] = useTranslation();

	const [activeTab, setActiveTab] = useState<SettingsTab>(props.match.params.tabId || PROFILE_ID);

	const generateTabHeader = (id: string, label: string) => ({
		id,
		label,
		active: activeTab === id,
		onClick: () => setActiveTab(id),
	});

	const tabHeaders = [
		generateTabHeader(PROFILE_ID, 'Profiel'),
		generateTabHeader(ACCOUNT_ID, 'Account'),
		generateTabHeader(EMAIL_ID, 'E-mail voorkeuren'),
		generateTabHeader(NOTIFICATIONS_ID, 'Notifications'),
	];

	const tabContents = {
		[PROFILE_ID]: {
			component: <Profile {...props} />,
		},
		[ACCOUNT_ID]: {
			component: <Account {...props} />,
		},
		[EMAIL_ID]: {
			component: <Email {...props} />,
		},
		[NOTIFICATIONS_ID]: {
			component: <Notifications {...props} />,
		},
	};

	const goToTab = (tabId: string | ReactText) => {
		redirectToClientPage(buildLink(SETTINGS_PATH.SETTINGS_TAB, { tabId }), props.history);
		setActiveTab(tabId as SettingsTab);
	};

	const getActiveTabComponent = (): ReactElement | null => {
		let tab = tabContents[activeTab];
		if (!tab) {
			toastService.danger(
				t('settings/views/settings___het-instellingen-tab-active-tab-bestaat-niet', { activeTab })
			);
			tab = tabContents[PROFILE_ID];
		}
		return tab.component;
	};

	return (
		<>
			<Container background="alt" mode="vertical" size="small">
				<Container mode="horizontal">
					<BlockHeading type="h2" className="u-m-0">
						<Trans i18nKey="settings/views/settings___instellingen">Instellingen</Trans>
					</BlockHeading>
				</Container>
			</Container>

			<Navbar background="alt" placement="top" autoHeight>
				<Container mode="horizontal">
					<Toolbar autoHeight>
						<ToolbarLeft>
							<Tabs tabs={tabHeaders} onClick={goToTab} />
						</ToolbarLeft>
					</Toolbar>
				</Container>
			</Navbar>

			<Container mode="vertical" size="small">
				<Container mode="horizontal">{getActiveTabComponent()}</Container>
			</Container>
		</>
	);
};

export default Settings;
