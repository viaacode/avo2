import { flatten, get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Container,
	Header,
	HeaderButtons,
	Panel,
	PanelBody,
	PanelHeader,
	Spacer,
	Table,
} from '@viaa/avo2-components';

import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError, formatDate } from '../../../shared/helpers';
import { useTableSort } from '../../../shared/hooks';
import { dataService, ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { Permission } from '../../permission-groups/permission-group.types';
import {
	renderDateDetailRows,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutHeader } from '../../shared/layouts';

import { GET_PERMISSION_GROUP_TABLE_COLS, USER_GROUP_PATH } from '../user-group.const';
import { GET_USER_GROUP_BY_ID } from '../user-group.gql';
import { UserGroupService } from '../user-group.service';
import {
	PermissionGroupTableCols,
	UserGroup,
	UserGroupOverviewTableCols,
} from '../user-group.types';

interface UserDetailProps extends RouteComponentProps<{ id: string }> {}

const UserGroupDetail: FunctionComponent<UserDetailProps> = ({ history, match }) => {
	// Hooks
	const [userGroup, setUserGroup] = useState<UserGroup | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
	const [sortColumn, sortOrder, handleSortClick] = useTableSort<PermissionGroupTableCols>(
		'label'
	);

	const [t] = useTranslation();

	const fetchUserGroupById = useCallback(async () => {
		try {
			const response = await dataService.query({
				query: GET_USER_GROUP_BY_ID,
				variables: {
					id: match.params.id,
				},
			});
			const userGroupObj = get(response, 'data.users_groups[0]');

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

			const permissionGroups: Permission[] = flatten(
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
				t('admin/user-groups/views/user-group-detail___de-gebruikersgroep-is-verwijdert'),
				false
			);
			redirectToClientPage(ADMIN_PATH.USER_GROUP_OVERVIEW, history);
		} catch (err) {
			console.error(new CustomError('Failed to delete user group', err, { userGroup }));
			ToastService.danger(
				t(
					'admin/user-groups/views/user-group-detail___het-verwijderen-van-de-gebruikersgroep-is-mislukt'
				),
				false
			);
		}
	};

	const renderTableCell = (rowData: Permission, columnId: UserGroupOverviewTableCols) => {
		switch (columnId) {
			case 'label':
			case 'description':
				return rowData[columnId];

			case 'created_at':
			case 'updated_at':
				return formatDate(rowData[columnId]);

			case 'actions':
				return (
					<ButtonToolbar>
						{/* TODO add link to permission group edit page */}
						<Button
							icon="edit"
							onClick={() =>
								ToastService.info(
									t('settings/components/profile___nog-niet-geimplementeerd'),
									false
								)
							}
							size="small"
							ariaLabel={t('admin/user-groups/views/user-group-detail___verwijder')}
							title={t('admin/user-groups/views/user-group-detail___verwijder')}
							type="tertiary"
						/>
					</ButtonToolbar>
				);

			default:
				return rowData[columnId];
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
				<Container mode="horizontal">
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
								onColumnClick={columId =>
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
		<AdminLayout showBackButton>
			<AdminLayoutHeader>
				<Header
					category="audio"
					title={t('admin/user-groups/views/user-group-detail___gebruikersgroep-details')}
					showMetaData={false}
				>
					<HeaderButtons>
						<ButtonToolbar>
							<Button
								type="primary"
								label={t('admin/user-groups/views/user-group-detail___bewerk')}
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
								onClick={() => setIsConfirmModalOpen(true)}
							/>
						</ButtonToolbar>
					</HeaderButtons>
				</Header>
			</AdminLayoutHeader>
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
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={userGroup}
			render={renderUserDetailPage}
		/>
	);
};

export default UserGroupDetail;
