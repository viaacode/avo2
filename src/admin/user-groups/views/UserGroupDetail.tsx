import { flatten, get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps } from 'react-router';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Container,
	LinkTarget,
	Panel,
	PanelBody,
	PanelHeader,
	Spacer,
	Table,
} from '@viaa/avo2-components';

import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { GENERATE_SITE_TITLE } from '../../../constants';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import SmartLink from '../../../shared/components/SmartLink/SmartLink';
import { buildLink, CustomError, formatDate, navigate } from '../../../shared/helpers';
import { truncateTableValue } from '../../../shared/helpers/truncate';
import { useTableSort } from '../../../shared/hooks';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { Permission, PermissionGroup } from '../../permission-groups/permission-group.types';
import {
	renderDateDetailRows,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { GET_PERMISSION_GROUP_TABLE_COLS, USER_GROUP_PATH } from '../user-group.const';
import { UserGroupService } from '../user-group.service';
import {
	PermissionGroupTableCols,
	UserGroup,
	UserGroupOverviewTableCols,
} from '../user-group.types';

import './UserGroupDetail.scss';

interface UserDetailProps extends RouteComponentProps<{ id: string }> {}

const UserGroupDetail: FunctionComponent<UserDetailProps> = ({ history, match }) => {
	// Hooks
	const [userGroup, setUserGroup] = useState<UserGroup | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
	const [sortColumn, sortOrder, handleSortClick] = useTableSort<PermissionGroupTableCols>(
		'label',
		'asc'
	);

	const [t] = useTranslation();

	const fetchUserGroupById = useCallback(async () => {
		try {
			const userGroupObj: UserGroup | undefined = await UserGroupService.fetchUserGroupById(
				match.params.id
			);
			if (!userGroupObj) {
				setLoadingInfo({
					state: 'error',
					icon: 'search',
					message: t(
						'admin/user-groups/views/user-group-detail___deze-gebruiker-groep-werd-niet-gevonden'
					),
				});
				return;
			}

			const permissionGroups: PermissionGroup[] = flatten(
				get(userGroupObj, 'group_user_permission_groups', []).map((userGroupItem: any) => {
					return get(userGroupItem, 'permission_group', []);
				})
			);

			const userGroupSimplified = {
				permissionGroups,
				id: userGroupObj.id,
				label: userGroupObj.label,
				description: userGroupObj.description,
				created_at: userGroupObj.created_at,
				updated_at: userGroupObj.updated_at,
			};
			setUserGroup(userGroupSimplified);
		} catch (err) {
			console.error(
				new CustomError('Failed to get user group by id', err, {
					query: 'GET_USER_GROUP_BY_ID',
					variables: {
						id: match.params.id,
					},
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/user-groups/views/user-group-detail___het-ophalen-van-de-gebruikersgroep-is-mislukt'
				),
			});
		}
	}, [setUserGroup, setLoadingInfo, t, match.params.id]);

	useEffect(() => {
		fetchUserGroupById();
	}, [fetchUserGroupById]);

	useEffect(() => {
		if (userGroup) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [userGroup, setLoadingInfo]);

	const handleDelete = async () => {
		try {
			if (!userGroup) {
				ToastService.danger(
					t(
						'admin/user-groups/views/user-group-detail___het-verwijderen-van-de-gebruikersgroep-is-mislukt-opdat-de-groep-nog-niet-geladen-is'
					)
				);
				return;
			}
			await UserGroupService.deleteUserGroup(userGroup.id);
			ToastService.success(
				t('admin/user-groups/views/user-group-detail___de-gebruikersgroep-is-verwijdert')
			);
			redirectToClientPage(ADMIN_PATH.USER_GROUP_OVERVIEW, history);
		} catch (err) {
			console.error(new CustomError('Failed to delete user group', err, { userGroup }));
			ToastService.danger(
				t(
					'admin/user-groups/views/user-group-detail___het-verwijderen-van-de-gebruikersgroep-is-mislukt'
				)
			);
		}
	};

	const renderTableCell = (rowData: PermissionGroup, columnId: UserGroupOverviewTableCols) => {
		switch (columnId) {
			case 'label':
				return (
					<div className="c-user-group__permission-list">
						<div>{rowData.label}</div>
						{UserGroupService.getPermissions(rowData).map((permission: Permission) => {
							return (
								<div key={`permission-group-list-${rowData.id}-${permission.id}`}>
									{truncateTableValue(permission.description)}
								</div>
							);
						})}
					</div>
				);

			case 'created_at':
			case 'updated_at':
				return formatDate(rowData[columnId]);

			case 'actions':
				return (
					<ButtonToolbar>
						<SmartLink
							action={{
								type: 'INTERNAL_LINK',
								target: LinkTarget.Self,
								value: buildLink(ADMIN_PATH.PERMISSION_GROUP_EDIT, {
									id: rowData.id,
								}),
							}}
						>
							<Button
								icon="edit"
								size="small"
								ariaLabel={t(
									'admin/permission-groups/views/permission-group-detail___bewerk-deze-permissie-groep'
								)}
								title={t(
									'admin/permission-groups/views/permission-group-detail___bewerk-deze-permissie-groep'
								)}
								type="tertiary"
							/>
						</SmartLink>
					</ButtonToolbar>
				);

			default:
				return truncateTableValue(rowData[columnId]);
		}
	};

	const renderUserDetail = () => {
		if (!userGroup) {
			console.error(
				new CustomError(
					'Failed to load user because render function is called before user was fetched'
				)
			);
			return;
		}
		return (
			<Container mode="vertical" size="small">
				<Container mode="horizontal" size="full-width">
					<Spacer margin="bottom-extra-large">
						<Table horizontal variant="invisible" className="c-table_detail-page">
							<tbody>
								{renderSimpleDetailRows(userGroup, [
									[
										'label',
										t('admin/user-groups/views/user-group-detail___label'),
									],
									[
										'description',
										t(
											'admin/user-groups/views/user-group-detail___beschrijving'
										),
									],
								])}
								{renderDateDetailRows(userGroup, [
									[
										'created_at',
										t(
											'admin/user-groups/views/user-group-detail___aangemaakt-op'
										),
									],
									[
										'updated_at',
										t(
											'admin/user-groups/views/user-group-detail___aangepast-op'
										),
									],
								])}
							</tbody>
						</Table>
					</Spacer>
					<Panel>
						<PanelHeader>
							<BlockHeading type="h3">
								Permissie groepen gelinked aan deze gebruikersgroep:
							</BlockHeading>
						</PanelHeader>
						<PanelBody>
							<Table
								columns={GET_PERMISSION_GROUP_TABLE_COLS()}
								data={UserGroupService.sortPermissionGroups(
									userGroup.permissionGroups || [],
									sortColumn,
									sortOrder
								)}
								emptyStateMessage={t(
									'admin/user-groups/views/user-group-detail___deze-gebruikersgroep-is-nog-niet-gelinked-aan-een-permissiegroep'
								)}
								onColumnClick={(columId) =>
									handleSortClick(columId as PermissionGroupTableCols)
								}
								renderCell={(rowData: UserGroup, columnId: string) =>
									renderTableCell(rowData, columnId as PermissionGroupTableCols)
								}
								rowKey="id"
								variant="bordered"
								sortColumn={sortColumn}
								sortOrder={sortOrder}
							/>
						</PanelBody>
					</Panel>
				</Container>
			</Container>
		);
	};

	const renderUserDetailPage = () => (
		<AdminLayout
			onClickBackButton={() => navigate(history, ADMIN_PATH.USER_GROUP_OVERVIEW)}
			pageTitle={t('admin/user-groups/views/user-group-detail___gebruikersgroep-details')}
			size="full-width"
		>
			<AdminLayoutTopBarRight>
				<ButtonToolbar>
					<Button
						type="primary"
						label={t('admin/user-groups/views/user-group-detail___bewerk')}
						title={t(
							'admin/user-groups/views/user-group-detail___bewerk-deze-gebruikersgroep'
						)}
						ariaLabel={t(
							'admin/user-groups/views/user-group-detail___bewerk-deze-gebruikersgroep'
						)}
						onClick={() => {
							redirectToClientPage(
								buildLink(USER_GROUP_PATH.USER_GROUP_EDIT, {
									id: match.params.id,
								}),
								history
							);
						}}
					/>
					<Button
						type="danger"
						label={t('admin/user-groups/views/user-group-detail___verwijderen')}
						title={t(
							'admin/user-groups/views/user-group-detail___verwijder-deze-gebruikersgroep'
						)}
						ariaLabel={t(
							'admin/user-groups/views/user-group-detail___verwijder-deze-gebruikersgroep'
						)}
						onClick={() => setIsConfirmModalOpen(true)}
					/>
				</ButtonToolbar>
			</AdminLayoutTopBarRight>
			<AdminLayoutBody>
				{renderUserDetail()}
				<DeleteObjectModal
					deleteObjectCallback={handleDelete}
					isOpen={isConfirmModalOpen}
					onClose={() => setIsConfirmModalOpen(false)}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						get(userGroup, 'label'),
						t(
							'admin/user-groups/views/user-group-detail___gebruikersgroep-beheer-detail-pagina-titel'
						)
					)}
				</title>
				<meta name="description" content={get(userGroup, 'description') || ''} />
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={userGroup}
				render={renderUserDetailPage}
			/>
		</>
	);
};

export default UserGroupDetail;
