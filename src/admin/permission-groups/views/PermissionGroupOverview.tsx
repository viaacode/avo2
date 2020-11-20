import { isNil } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import { Button, ButtonToolbar } from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { GENERATE_SITE_TITLE } from '../../../constants';
import { ErrorView } from '../../../error/views';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, formatDate, navigate } from '../../../shared/helpers';
import { truncateTableValue } from '../../../shared/helpers/truncate';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { ItemsTableState } from '../../items/items.types';
import FilterTable, { getFilters } from '../../shared/components/FilterTable/FilterTable';
import { UpdatePermissionsButton } from '../../shared/components/UpdatePermissionsButton/UpdatePermissionsButton';
import { getDateRangeFilters, getQueryFilter } from '../../shared/helpers/filters';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import {
	GET_PERMISSION_GROUP_OVERVIEW_TABLE_COLS,
	ITEMS_PER_PAGE,
	PERMISSION_GROUP_PATH,
} from '../permission-group.const';
import { PermissionGroupService } from '../permission-group.service';
import {
	PermissionGroup,
	PermissionGroupOverviewTableCols,
	PermissionGroupTableState,
} from '../permission-group.types';

import './PermissionGroupOverview.scss';

interface PermissionGroupOverviewProps extends DefaultSecureRouteProps {}

const PermissionGroupOverview: FunctionComponent<PermissionGroupOverviewProps> = ({ history }) => {
	// Hooks
	const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[] | null>(null);
	const [permissionGroupCount, setPermissionGroupCount] = useState<number>(0);
	const [permissionGroupIdToDelete, setPermissionGroupIdToDelete] = useState<number | null>(null);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [tableState, setTableState] = useState<Partial<PermissionGroupTableState>>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [t] = useTranslation();

	const fetchPermissionGroups = useCallback(async () => {
		setIsLoading(true);
		const generateWhereObject = (filters: Partial<ItemsTableState>) => {
			const andFilters: any[] = [];
			andFilters.push(
				...getQueryFilter(filters.query, (queryWildcard: string) => [
					{ label: { _ilike: queryWildcard } },
					{ description: { _ilike: queryWildcard } },
				])
			);
			andFilters.push(...getDateRangeFilters(filters, ['created_at', 'updated_at']));
			return { _and: andFilters };
		};

		try {
			const [
				permissionGroupTemp,
				permissionGroupCountTemp,
			] = await PermissionGroupService.fetchPermissionGroups(
				tableState.page || 0,
				(tableState.sort_column || 'updated_at') as PermissionGroupOverviewTableCols,
				tableState.sort_order || 'desc',
				generateWhereObject(getFilters(tableState))
			);

			setPermissionGroups(permissionGroupTemp);
			setPermissionGroupCount(permissionGroupCountTemp);
		} catch (err) {
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/permission-groups/views/permission-group-overview___het-ophalen-van-de-permissie-groepen-is-mislukt'
				),
			});
		}
		setIsLoading(false);
	}, [setPermissionGroups, setLoadingInfo, t, tableState]);

	useEffect(() => {
		fetchPermissionGroups();
	}, [fetchPermissionGroups]);

	useEffect(() => {
		if (permissionGroups && !isNil(permissionGroupCount)) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [permissionGroups, permissionGroupCount]);

	// Methods
	const handleDelete = async () => {
		await PermissionGroupService.deletePermissionGroup(permissionGroupIdToDelete);
		await fetchPermissionGroups();
		ToastService.success(
			t(
				'admin/permission-groups/views/permission-group-overview___de-permissie-groep-is-verwijdert'
			)
		);
	};

	const openModal = (permissionGroup: PermissionGroup): void => {
		setIsConfirmModalOpen(true);
		setPermissionGroupIdToDelete(permissionGroup.id);
	};

	// Render
	const renderTableCell = (
		rowData: PermissionGroup,
		columnId: PermissionGroupOverviewTableCols
	) => {
		switch (columnId) {
			case 'label':
				return (
					<Link to={buildLink(ADMIN_PATH.PERMISSION_GROUP_DETAIL, { id: rowData.id })}>
						{truncateTableValue(rowData[columnId])}
					</Link>
				);

			case 'created_at':
			case 'updated_at':
				return !!rowData[columnId] ? formatDate(rowData[columnId] as string) : '-';

			case 'actions':
				return (
					<ButtonToolbar>
						<Button
							icon="info"
							onClick={() =>
								navigate(history, PERMISSION_GROUP_PATH.PERMISSION_GROUP_DETAIL, {
									id: rowData.id,
								})
							}
							size="small"
							ariaLabel={t(
								'admin/permission-groups/views/permission-group-overview___bekijk-de-details-van-deze-permissie-groep'
							)}
							title={t(
								'admin/permission-groups/views/permission-group-overview___bekijk-de-details-van-deze-permissie-groep'
							)}
							type="secondary"
						/>
						<Button
							icon="edit"
							onClick={() =>
								navigate(history, PERMISSION_GROUP_PATH.PERMISSION_GROUP_EDIT, {
									id: rowData.id,
								})
							}
							size="small"
							ariaLabel={t(
								'admin/permission-groups/views/permission-group-overview___bewerk-deze-permissie-groep'
							)}
							title={t(
								'admin/permission-groups/views/permission-group-overview___bewerk-deze-permissie-groep'
							)}
							type="secondary"
						/>
						<Button
							icon="delete"
							onClick={() => openModal(rowData)}
							size="small"
							ariaLabel={t(
								'admin/permission-groups/views/permission-group-overview___verwijder-deze-permissie-groep'
							)}
							title={t(
								'admin/permission-groups/views/permission-group-overview___verwijder-deze-permissie-groep'
							)}
							type="danger-hover"
						/>
					</ButtonToolbar>
				);

			default:
				return truncateTableValue(rowData[columnId]);
		}
	};

	const renderNoResults = () => {
		return (
			<ErrorView
				message={t(
					'admin/permission-groups/views/permission-group-overview___er-zijn-nog-geen-permissie-groepen-aangemaakt'
				)}
			>
				<p>
					<Trans i18nKey="admin/permission-groups/views/permission-group-overview___beschrijving-wanneer-er-nog-geen-permissie-groepen-zijn-aangemaakt">
						Beschrijving wanneer er nog geen permissie groepen zijn aangemaakt
					</Trans>
				</p>
			</ErrorView>
		);
	};

	const renderPermissionGroupTable = () => {
		return (
			<>
				<FilterTable
					columns={GET_PERMISSION_GROUP_OVERVIEW_TABLE_COLS()}
					data={permissionGroups || []}
					dataCount={permissionGroupCount}
					renderCell={(rowData: PermissionGroup, columnId: string) =>
						renderTableCell(rowData, columnId as PermissionGroupOverviewTableCols)
					}
					searchTextPlaceholder={t(
						'admin/permission-groups/views/permission-group-overview___zoek-op-naam-beschrijving'
					)}
					renderNoResults={renderNoResults}
					noContentMatchingFiltersMessage={t(
						'admin/permission-groups/views/permission-group-overview___er-zijn-geen-permissie-groepen-gevonden-die-voldoen-aan-je-zoekterm'
					)}
					itemsPerPage={ITEMS_PER_PAGE}
					onTableStateChanged={setTableState}
					isLoading={isLoading}
				/>
				<DeleteObjectModal
					deleteObjectCallback={handleDelete}
					isOpen={isConfirmModalOpen}
					onClose={() => setIsConfirmModalOpen(false)}
				/>
			</>
		);
	};

	return (
		<AdminLayout
			pageTitle={t(
				'admin/permission-groups/views/permission-group-overview___permissie-groepen-overzicht'
			)}
			size="full-width"
		>
			<AdminLayoutTopBarRight>
				<ButtonToolbar>
					<UpdatePermissionsButton />
					<Button
						label={t(
							'admin/permission-groups/views/permission-group-overview___permissie-groep-toevoegen'
						)}
						onClick={() => history.push(PERMISSION_GROUP_PATH.PERMISSION_GROUP_CREATE)}
					/>
				</ButtonToolbar>
			</AdminLayoutTopBarRight>
			<AdminLayoutBody>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							t(
								'admin/permission-groups/views/permission-group-overview___permissiegroep-beheer-overzicht-pagina-titel'
							)
						)}
					</title>
					<meta
						name="description"
						content={t(
							'admin/permission-groups/views/permission-group-overview___permissiegroep-beheer-overzicht-pagina-beschrijving'
						)}
					/>
				</MetaTags>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={permissionGroups}
					render={renderPermissionGroupTable}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default PermissionGroupOverview;
