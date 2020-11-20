import { compact, get, isEmpty } from 'lodash-es';
import React, { FunctionComponent, ReactText, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import {
	BlockHeading,
	Container,
	DropdownButton,
	DropdownContent,
	Form,
	FormGroup,
	Icon,
	MenuContent,
	Navbar,
	Select,
	SelectOption,
	Spacer,
	Tabs,
	Toolbar,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { AssignmentOverview } from '../../assignment/views';
import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileId } from '../../authentication/helpers/get-profile-id';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import CollectionOrBundleOverview from '../../collection/components/CollectionOrBundleOverview';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import {
	ControlledDropdown,
	InteractiveTour,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../shared/components';
import { isMobileWidth, navigate } from '../../shared/helpers';
import { dataService } from '../../shared/services';
import {
	ASSIGNMENTS_ID,
	BOOKMARKS_ID,
	BUNDLES_ID,
	COLLECTIONS_ID,
	GET_TABS,
} from '../workspace.const';
import { GET_WORKSPACE_TAB_COUNTS } from '../workspace.gql';
import { NavTab, TabFilter, TabView, TabViewMap } from '../workspace.types';

import BookmarksOverview from './BookmarksOverview';
import './Workspace.scss';

export interface WorkspaceProps extends DefaultSecureRouteProps<{ tabId: string }> {
	collections: Avo.Collection.Collection | null;
}

const Workspace: FunctionComponent<WorkspaceProps> = ({ history, match, location, user }) => {
	const [t] = useTranslation();

	// State
	const [activeFilter, setActiveFilter] = useState<ReactText>();
	const [tabId, setTabId] = useState<string | null>(null);
	const [tabs, setTabs] = useState<TabViewMap>({});
	const [tabCounts, setTabCounts] = useState<{ [tabId: string]: number }>({});
	const [permissions, setPermissions] = useState<{ [tabId: string]: boolean }>({});
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });

	// Methods
	// react to route changes by navigating back wih the browser history back button
	useEffect(() => {
		setTabId(match.params.tabId);
	}, [match.params.tabId]);

	const updatePermissionsAndCounts = useCallback(() => {
		Promise.all([
			dataService.query({
				query: GET_WORKSPACE_TAB_COUNTS,
				variables: { owner_profile_id: getProfileId(user) },
			}),
			PermissionService.hasPermission(PermissionName.VIEW_OWN_COLLECTIONS, null, user),
			PermissionService.hasPermission(PermissionName.VIEW_OWN_BUNDLES, null, user),
			PermissionService.hasPermission(PermissionName.CREATE_ASSIGNMENTS, null, user),
			PermissionService.hasPermission(PermissionName.VIEW_ASSIGNMENTS, null, user),
			PermissionService.hasPermission(PermissionName.CREATE_BOOKMARKS, null, user),
		])
			.then((response) => {
				setTabCounts({
					[COLLECTIONS_ID]: get(response[0], 'data.collection_counts.aggregate.count', 0),
					[BUNDLES_ID]: get(response[0], 'data.bundle_counts.aggregate.count', 0),
					[ASSIGNMENTS_ID]: get(response[0], 'data.assignment_counts.aggregate.count', 0),
					[BOOKMARKS_ID]:
						get(response[0], 'data.item_bookmark_counts.aggregate.count', 0) +
						get(response[0], 'data.collection_bookmark_counts.aggregate.count', 0),
				});
				setPermissions({
					[COLLECTIONS_ID]: response[1],
					[BUNDLES_ID]: response[2],
					[ASSIGNMENTS_ID]: response[3] || response[4],
					[BOOKMARKS_ID]: response[5],
				});
			})
			.catch((err) => {
				console.error(
					'Failed to check permissions or get tab counts for workspace overview page',
					err,
					{ user }
				);
				setLoadingInfo({
					state: 'error',
					message: t(
						'workspace/views/workspace___het-laden-van-de-werkruimte-is-mislukt'
					),
				});
			});
	}, [user, t, setPermissions]);

	// Make map for available tab views
	useEffect(() => {
		const addTabIfUserHasPerm = (tabId: string, obj: any): any => {
			if (permissions[tabId]) {
				return { [tabId]: obj };
			}
			return {};
		};
		const tempTabs = {
			...addTabIfUserHasPerm(COLLECTIONS_ID, {
				component: () => (
					<CollectionOrBundleOverview
						numberOfItems={tabCounts[COLLECTIONS_ID]}
						type="collection"
						onUpdate={updatePermissionsAndCounts}
						history={history}
						location={location}
						match={match}
						user={user}
					/>
				),
				// TODO: DISABLED_FEATURE filter
				// filter: {
				// 	label: t('workspace/views/workspace___auteur'),
				// 	options: [
				// 		{ id: 'all', label: t('workspace/views/workspace___alles') },
				// 		{ id: 'owner', label: t('workspace/views/workspace___enkel-waar-ik-eigenaar-ben') },
				// 		{ id: 'sharedWith', label: t('workspace/views/workspace___enkel-gedeeld-met-mij') },
				// 		{ id: 'sharedBy', label: t('workspace/views/workspace___enkel-gedeeld-door-mij') },
				// 	],
				// },
			}),
			...addTabIfUserHasPerm(BUNDLES_ID, {
				component: () => (
					<CollectionOrBundleOverview
						numberOfItems={tabCounts[BUNDLES_ID]}
						type="bundle"
						onUpdate={updatePermissionsAndCounts}
						history={history}
						location={location}
						match={match}
						user={user}
					/>
				),
				// TODO enable filtering by label
				// filter: {
				// 	label: t('workspace/views/workspace___filter-op-label'),
				// 	options: [{ id: 'all', label: t('workspace/views/workspace___alle') }],
				// },
			}),
			...addTabIfUserHasPerm(ASSIGNMENTS_ID, {
				component: () => (
					<AssignmentOverview
						onUpdate={updatePermissionsAndCounts}
						history={history}
						location={location}
						match={match}
						user={user}
					/>
				),
			}),
			...addTabIfUserHasPerm(BOOKMARKS_ID, {
				component: () => (
					<BookmarksOverview
						onUpdate={updatePermissionsAndCounts}
						history={history}
						location={location}
						match={match}
						user={user}
						numberOfItems={tabCounts[BOOKMARKS_ID]}
					/>
				),
			}),
		};
		setTabs(tempTabs);
	}, [tabCounts, permissions, t, history, location, match, user, updatePermissionsAndCounts]);

	const goToTab = (id: ReactText) => {
		navigate(history, APP_PATH.WORKSPACE_TAB.route, { tabId: id });
		setTabId(String(id));
	};

	// Get active tab based on above map with tabId
	const getActiveTab = useCallback(() => {
		const firstTabId = Object.keys(tabs)[0];
		const safeTabId = tabId || firstTabId;
		return tabs[safeTabId] || tabs[firstTabId];
	}, [tabs, tabId]);

	useEffect(() => {
		updatePermissionsAndCounts();
	}, [updatePermissionsAndCounts]);

	useEffect(() => {
		if (!isEmpty(permissions) && !isEmpty(tabs)) {
			if (getActiveTab()) {
				// Use has access to at least one tab
				setLoadingInfo({
					state: 'loaded',
				});
			} else {
				setLoadingInfo({
					state: 'error',
					message: t(
						'workspace/views/workspace___je-hebt-geen-rechten-om-je-werkruimte-te-bekijken'
					),
					icon: 'lock',
				});
			}
		}
	}, [setLoadingInfo, getActiveTab, t, permissions, tabs]);

	const getNavTabs = useCallback(() => {
		return compact(
			GET_TABS().map((tab) => {
				if (permissions[tab.id]) {
					return {
						...tab,
						active: (tabId || Object.keys(tabs)[0]) === tab.id,
						label: tabCounts[tab.id]
							? `${tab.label} (${tabCounts[tab.id]})`
							: tab.label,
					};
				}
				return null;
			})
		);
	}, [tabs, tabId, tabCounts, permissions]);

	const handleMenuContentClick = (menuItemId: ReactText) => setActiveFilter(menuItemId);

	// Render
	const renderFilter = (filter: TabFilter) => {
		const currentFilter = filter.options.find(
			(f) => f.id === (activeFilter || filter.options[0].id)
		);

		return (
			<Form type="inline">
				<FormGroup label={filter.label}>
					<ControlledDropdown isOpen={false} placement="bottom-end">
						<DropdownButton>
							<div className="c-filter-dropdown c-filter-dropdown--no-bg">
								<div className="c-filter-dropdown__label">
									{currentFilter ? currentFilter.label : filter.options[0].label}
								</div>
								<div className="c-filter-dropdown__options">
									<Icon name="caret-down" />
								</div>
							</div>
						</DropdownButton>
						<DropdownContent>
							<MenuContent
								menuItems={filter.options}
								onClick={handleMenuContentClick}
							/>
						</DropdownContent>
					</ControlledDropdown>
				</FormGroup>
			</Form>
		);
	};

	const renderMobileTabs = (tabs: NavTab[]) => {
		return (
			<Spacer margin="bottom">
				<Select
					options={tabs.map(
						(tab: NavTab): SelectOption<string> => ({
							label: tab.label,
							value: tab.id.toString(),
						})
					)}
					value={tabId || Object.keys(tabs)[0]}
					onChange={goToTab}
					className="c-tab-select"
				/>
			</Spacer>
		);
	};

	const renderNavTabs = (tabs: NavTab[]) => {
		return isMobileWidth() ? renderMobileTabs(tabs) : <Tabs tabs={tabs} onClick={goToTab} />;
	};

	const renderToolbar = (tabs: NavTab[], activeTab: TabView) => {
		const filter = get(activeTab, 'filter', null);

		return filter ? (
			<Toolbar autoHeight>
				{tabs.length > 1 && <ToolbarLeft>{renderNavTabs(tabs)}</ToolbarLeft>}
				<ToolbarRight>
					<span>{renderFilter(filter)}</span>
				</ToolbarRight>
			</Toolbar>
		) : (
			tabs.length > 1 && renderNavTabs(tabs)
		);
	};

	const renderTabsAndContent = () => {
		const tabs = getNavTabs() as NavTab[];
		const activeTab: TabView = getActiveTab();

		return (
			<div className="m-workspace">
				<Container background="alt" mode="vertical" size="small">
					<Container mode="horizontal">
						<Toolbar>
							<ToolbarLeft>
								<BlockHeading type="h2" className="u-m-0">
									<Trans i18nKey="workspace/views/workspace___mijn-werkruimte">
										Mijn Werkruimte
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
					<Container mode="horizontal">{renderToolbar(tabs, activeTab)}</Container>
				</Navbar>

				<Container mode="vertical" size="small">
					<Container mode="horizontal">{activeTab.component()}</Container>
				</Container>
			</div>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						t('workspace/views/workspace___mijn-werkruimte-pagina-titel')
					)}
				</title>
				<meta
					name="description"
					content={t('workspace/views/workspace___mijn-werkruimte-pagina-beschrijving')}
				/>
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				render={renderTabsAndContent}
				dataObject={permissions}
				showSpinner
			/>
		</>
	);
};

export default Workspace;
