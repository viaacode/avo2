import { get } from 'lodash-es';
import React, { FunctionComponent, ReactElement, ReactText, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
	BlockHeading,
	Container,
	Navbar,
	Tabs,
	Toolbar,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { SpecialUserGroup } from '../../admin/user-groups/user-group.const';
import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { redirectToClientPage } from '../../authentication/helpers/redirects';
import { APP_PATH } from '../../constants';
import { InteractiveTour } from '../../shared/components';
import { buildLink } from '../../shared/helpers';
import withUser, { UserProps } from '../../shared/hocs/withUser';
import { ToastService } from '../../shared/services';
import { Account, Email, Notifications, Profile } from '../components';
import { ACCOUNT_ID, EMAIL_ID, NOTIFICATIONS_ID, PROFILE_ID, SettingsTab } from '../settings.const';

interface ForPupilsProps extends DefaultSecureRouteProps<{ tabId: string }> {}

const Settings: FunctionComponent<ForPupilsProps & UserProps> = (props) => {
	const [t] = useTranslation();

	const [activeTab, setActiveTab] = useState<SettingsTab>(props.match.params.tabId || PROFILE_ID);

	const isPupil = get(props.user, 'profile.userGroupIds[0]') === SpecialUserGroup.Pupil;

	const generateTabHeader = (id: string, label: string) => ({
		id,
		label,
		active: activeTab === id,
		onClick: () => setActiveTab(id),
	});

	const getTabHeaders = () => {
		const tabHeaders = [generateTabHeader(PROFILE_ID, t('settings/views/settings___profiel'))];

		// Only pupils with an archief account can view the account tab
		if (
			!isPupil ||
			get(props, 'user.idpmaps', []).find(
				(idpMap: Avo.Auth.IdpType) => idpMap === 'HETARCHIEF'
			)
		) {
			tabHeaders.push(generateTabHeader(ACCOUNT_ID, t('settings/views/settings___account')));
		}

		if (PermissionService.hasPerm(props.user, PermissionName.VIEW_NEWSLETTERS_PAGE)) {
			tabHeaders.push(
				generateTabHeader(EMAIL_ID, t('settings/views/settings___e-mail-voorkeuren'))
			);
		}
		if (PermissionService.hasPerm(props.user, PermissionName.VIEW_NOTIFICATIONS_PAGE)) {
			generateTabHeader(NOTIFICATIONS_ID, t('settings/views/settings___notifications'));
		}

		return tabHeaders;
	};

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
		redirectToClientPage(buildLink(APP_PATH.SETTINGS_TAB.route, { tabId }), props.history);
		setActiveTab(tabId as SettingsTab);
	};

	const getActiveTabComponent = (): ReactElement | null => {
		let tab = tabContents[activeTab];
		if (!tab) {
			ToastService.danger(
				t('settings/views/settings___het-instellingen-tab-active-tab-bestaat-niet', {
					activeTab,
				})
			);
			tab = tabContents[PROFILE_ID];
		}
		return tab.component;
	};

	return (
		<>
			<Container background="alt" mode="vertical" size="small">
				<Container mode="horizontal">
					<Toolbar>
						<ToolbarLeft>
							<BlockHeading type="h2" className="u-m-0">
								<Trans i18nKey="settings/views/settings___instellingen">
									Instellingen
								</Trans>
							</BlockHeading>
						</ToolbarLeft>
						<ToolbarRight>
							<InteractiveTour showButton />
						</ToolbarRight>
					</Toolbar>
				</Container>
			</Container>

			<Navbar background="alt" placement="top" autoHeight>
				<Container mode="horizontal">
					<Toolbar autoHeight>
						<ToolbarLeft>
							<Tabs tabs={getTabHeaders()} onClick={goToTab} />
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

export default withUser(Settings) as FunctionComponent<ForPupilsProps>;
