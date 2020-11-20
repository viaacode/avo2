import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Panel,
	PanelBody,
	PanelHeader,
	Spacer,
	Table,
} from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { GENERATE_SITE_TITLE } from '../../../constants';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../shared/components';
import { buildLink, CustomError, navigate } from '../../../shared/helpers';
import { useTableSort } from '../../../shared/hooks';
import { ADMIN_PATH } from '../../admin.const';
import {
	renderDateDetailRows,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { GET_PERMISSIONS_TABLE_COLS, PERMISSION_GROUP_PATH } from '../permission-group.const';
import { PermissionGroupService } from '../permission-group.service';
import { PermissionGroup, PermissionsTableCols } from '../permission-group.types';

interface PermissionGroupEditProps extends DefaultSecureRouteProps<{ id: string }> {}

const PermissionGroupEdit: FunctionComponent<PermissionGroupEditProps> = ({ history, match }) => {
	const [t] = useTranslation();

	// Hooks
	const [permissionGroup, setPermissionGroup] = useState<PermissionGroup | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [sortColumn, sortOrder, handleSortClick] = useTableSort<PermissionsTableCols>(
		'description',
		'asc'
	);

	const initOrFetchPermissionGroup = useCallback(async () => {
		try {
			const permissionGroupObj = await PermissionGroupService.fetchPermissionGroup(
				match.params.id
			);

			if (!permissionGroupObj) {
				setLoadingInfo({
					state: 'error',
					icon: 'search',
					message: t(
						'admin/permission-groups/views/permission-group-detail___deze-permissie-groep-werd-niet-gevonden'
					),
				});
				return;
			}

			setPermissionGroup(permissionGroupObj);
		} catch (err) {
			console.error(
				new CustomError('Failed to get permission group by id', err, {
					id: match.params.id,
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/permission-groups/views/permission-group-detail___het-ophalen-van-de-permissie-groep-is-mislukt'
				),
			});
		}
	}, [setLoadingInfo, setPermissionGroup, t, match.params.id]);

	useEffect(() => {
		initOrFetchPermissionGroup();
	}, [initOrFetchPermissionGroup]);

	useEffect(() => {
		if (permissionGroup) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [permissionGroup, setLoadingInfo]);

	const handleEditClick = () => {
		redirectToClientPage(
			buildLink(PERMISSION_GROUP_PATH.PERMISSION_GROUP_EDIT, {
				id: match.params.id,
			}),
			history
		);
	};

	const renderDetailPage = () => {
		if (!permissionGroup) {
			return;
		}
		return (
			<>
				<Table horizontal variant="invisible" className="c-table_detail-page">
					<tbody>
						{renderSimpleDetailRows(permissionGroup, [
							[
								'label',
								t('admin/permission-groups/views/permission-group-detail___label'),
							],
							[
								'description',
								t(
									'admin/permission-groups/views/permission-group-detail___beschrijving'
								),
							],
						])}
						{renderDateDetailRows(permissionGroup, [
							[
								'created_at',
								t(
									'admin/permission-groups/views/permission-group-detail___aangemaakt-op'
								),
							],
							[
								'updated_at',
								t(
									'admin/permission-groups/views/permission-group-detail___aangepast-op'
								),
							],
						])}
					</tbody>
				</Table>
				<Spacer margin="top-extra-large">
					<Panel>
						<PanelHeader>
							<BlockHeading type="h3">Permissies in deze groep:</BlockHeading>
						</PanelHeader>
						<PanelBody>
							<Table
								columns={GET_PERMISSIONS_TABLE_COLS()}
								data={PermissionGroupService.sortPermissions(
									permissionGroup.permissions || [],
									sortColumn,
									sortOrder
								)}
								emptyStateMessage={t(
									'admin/permission-groups/views/permission-group-detail___deze-groep-bevat-nog-geen-permissies'
								)}
								onColumnClick={(columId) =>
									handleSortClick(columId as PermissionsTableCols)
								}
								renderCell={(rowData: any, columnId: string) => rowData[columnId]}
								rowKey="id"
								variant="bordered"
								sortColumn={sortColumn}
								sortOrder={sortOrder}
							/>
						</PanelBody>
					</Panel>
				</Spacer>
			</>
		);
	};

	// Render
	const renderPage = () => {
		if (!permissionGroup) {
			return null;
		}
		return (
			<AdminLayout
				onClickBackButton={() => navigate(history, ADMIN_PATH.PERMISSION_GROUP_OVERVIEW)}
				pageTitle={t(
					'admin/permission-groups/views/permission-group-detail___permissie-groep-details'
				)}
				size="large"
			>
				<AdminLayoutTopBarRight>
					<ButtonToolbar>
						<Button
							type="primary"
							label={t(
								'admin/permission-groups/views/permission-group-detail___bewerken'
							)}
							title={t(
								'admin/permission-groups/views/permission-group-detail___bewerk-deze-permissie-groep'
							)}
							ariaLabel={t(
								'admin/permission-groups/views/permission-group-detail___bewerk-deze-permissie-groep'
							)}
							onClick={handleEditClick}
						/>
					</ButtonToolbar>
				</AdminLayoutTopBarRight>
				<AdminLayoutBody>{renderDetailPage()}</AdminLayoutBody>
			</AdminLayout>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						t(
							'admin/permission-groups/views/permission-group-detail___permissiegroep-beheer-detail-pagina-titel'
						)
					)}
				</title>
				<meta
					name="description"
					content={t(
						'admin/permission-groups/views/permission-group-detail___permissiegroep-beheer-detail-pagina-beschrijving'
					)}
				/>
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={permissionGroup}
				render={renderPage}
			/>
		</>
	);
};

export default PermissionGroupEdit;
