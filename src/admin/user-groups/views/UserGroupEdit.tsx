import { compact, flatten, get, without } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import {
	BlockHeading,
	Box,
	Button,
	ButtonToolbar,
	Container,
	Form,
	FormGroup,
	Panel,
	PanelBody,
	PanelHeader,
	Select,
	Spacer,
	Table,
	TextInput,
} from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { GENERATE_SITE_TITLE } from '../../../constants';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { ROUTE_PARTS } from '../../../shared/constants';
import { buildLink, CustomError, formatDate, navigate } from '../../../shared/helpers';
import { truncateTableValue } from '../../../shared/helpers/truncate';
import { useTableSort } from '../../../shared/hooks';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { PermissionGroupService } from '../../permission-groups/permission-group.service';
import { Permission, PermissionGroup } from '../../permission-groups/permission-group.types';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { GET_PERMISSION_GROUP_TABLE_COLS, USER_GROUP_PATH } from '../user-group.const';
import { UserGroupService } from '../user-group.service';
import {
	PermissionGroupTableCols,
	UserGroup,
	UserGroupEditFormErrorState,
	UserGroupOverviewTableCols,
} from '../user-group.types';

interface UserGroupEditProps extends DefaultSecureRouteProps<{ id: string }> {}

const UserGroupEdit: FunctionComponent<UserGroupEditProps> = ({ history, match, location }) => {
	const [t] = useTranslation();

	// Hooks
	const [initialUserGroup, setInitialUserGroup] = useState<UserGroup | null>(null);
	const [userGroup, setUserGroup] = useState<UserGroup | null>(null);

	const [formErrors, setFormErrors] = useState<UserGroupEditFormErrorState>({});
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [allPermissionGroups, setAllPermissionGroups] = useState<PermissionGroup[]>([]);
	const [selectedPermissionGroupId, setSelectedPermissionGroupId] = useState<string | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [sortColumn, sortOrder, handleSortClick] = useTableSort<PermissionGroupTableCols>(
		'label'
	);
	const [permissionGroupIdToDelete, setPermissionGroupIdToDelete] = useState<number | null>(null);
	const [isConfirmDeleteModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

	const isCreatePage: boolean = location.pathname.includes(`/${ROUTE_PARTS.create}`);

	const initOrFetchUserGroup = useCallback(async () => {
		if (isCreatePage) {
			const permGroup = ({
				label: '',
				description: '',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				permissionGroups: [],
			} as unknown) as UserGroup;
			setInitialUserGroup(permGroup);
			setUserGroup(permGroup);
		} else {
			try {
				const userGroupObj:
					| UserGroup
					| undefined = await UserGroupService.fetchUserGroupById(match.params.id);

				if (!userGroupObj) {
					setLoadingInfo({
						state: 'error',
						icon: 'search',
						message: t(
							'admin/user-groups/views/user-group-edit___deze-gebruiker-groep-werd-niet-gevonden'
						),
					});
					return;
				}

				const permissionGroups: Permission[] = flatten(
					get(userGroupObj, 'group_user_permission_groups', []).map(
						(userGroupItem: any) => {
							return get(userGroupItem, 'permission_group', []);
						}
					)
				);

				const userGroupSimplified = {
					permissionGroups,
					id: userGroupObj.id,
					label: userGroupObj.label,
					description: userGroupObj.description,
					created_at: userGroupObj.created_at,
					updated_at: userGroupObj.updated_at,
				};
				setInitialUserGroup(userGroupSimplified);
				setUserGroup(userGroupSimplified);
			} catch (err) {
				console.error(
					new CustomError('Failed to get permission group by id', err, {
						query: 'GET_USER_GROUP_BY_ID',
						variables: { id: match.params.id },
					})
				);
				setLoadingInfo({
					state: 'error',
					message: t(
						'admin/user-groups/views/user-group-edit___het-ophalen-van-de-permissie-groep-is-mislukt'
					),
				});
			}
		}
	}, [setLoadingInfo, setUserGroup, t, isCreatePage, match.params.id]);

	const fetchAllPermissionGroups = useCallback(async () => {
		try {
			setAllPermissionGroups(await PermissionGroupService.fetchAllPermissionGroups());
		} catch (err) {
			console.error(new CustomError('Failed to get all permissionGroups from database', err));
			ToastService.danger(
				t(
					'admin/user-groups/views/user-group-edit___het-ophalen-van-alle-permissies-is-mislukt'
				)
			);
		}
	}, [setAllPermissionGroups, t]);

	useEffect(() => {
		initOrFetchUserGroup();
		fetchAllPermissionGroups();
	}, [initOrFetchUserGroup, fetchAllPermissionGroups]);

	useEffect(() => {
		if (userGroup) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [userGroup, setLoadingInfo]);

	const navigateBack = () => {
		if (isCreatePage) {
			history.push(USER_GROUP_PATH.USER_GROUP_OVERVIEW);
		} else {
			navigate(history, USER_GROUP_PATH.USER_GROUP_DETAIL, {
				id: match.params.id,
			});
		}
	};

	const getFormErrors = (): UserGroupEditFormErrorState | null => {
		if (!userGroup || !userGroup.label) {
			return {
				label: t('admin/user-groups/views/user-group-edit___een-label-is-verplicht'),
			};
		}
		return null;
	};

	const openConfirmDeleteModal = (permissionGroup: PermissionGroup): void => {
		setIsConfirmModalOpen(true);
		setPermissionGroupIdToDelete(permissionGroup.id);
	};

	const handlePermissionGroupDelete = () => {
		if (!userGroup) {
			return;
		}
		setUserGroup({
			...userGroup,
			permissionGroups: (userGroup.permissionGroups || []).filter(
				(permissionGroup) => permissionGroup.id !== permissionGroupIdToDelete
			),
		});
	};

	const handleAddPermissionGroup = () => {
		if (!userGroup) {
			return;
		}
		if (
			(userGroup.permissionGroups || []).find(
				(pg) => String(pg.id) === selectedPermissionGroupId
			)
		) {
			ToastService.danger(
				t(
					'admin/user-groups/views/user-group-edit___deze-gebruikersgroep-zit-reeds-in-de-groep'
				)
			);
			return;
		}
		const selectedPermission = allPermissionGroups.find(
			(pg) => String(pg.id) === selectedPermissionGroupId
		);
		if (!selectedPermission) {
			ToastService.danger(
				t(
					'admin/user-groups/views/user-group-edit___de-geselecteerde-gebruikersgroep-kon-niet-worden-gevonden'
				)
			);
			return;
		}
		setUserGroup({
			...userGroup,
			permissionGroups: [...userGroup.permissionGroups, selectedPermission],
		});
		setSelectedPermissionGroupId(null);
		ToastService.success(
			t('admin/user-groups/views/user-group-edit___permissie-groep-tegevoegd')
		);
	};

	const handleSave = async () => {
		try {
			const errors = getFormErrors();
			setFormErrors(errors || {});
			if (errors) {
				ToastService.danger(
					t('admin/user-groups/views/user-group-edit___de-invoer-is-ongeldig')
				);
				return;
			}

			if (!initialUserGroup || !userGroup) {
				ToastService.danger(
					t(
						'admin/user-groups/views/user-group-edit___het-opslaan-van-de-permissie-groep-is-mislukt-omdat-de-permissie-groep-nog-niet-is-geladen'
					)
				);
				return;
			}

			setIsSaving(true);

			let userGroupId: number | string;
			if (isCreatePage) {
				// insert the permission group
				userGroupId = await UserGroupService.insertUserGroup(userGroup);
			} else {
				// Update existing permission group
				await UserGroupService.updateUserGroup(userGroup);
				userGroupId = match.params.id;
			}

			const addedPermissions = without(
				userGroup.permissionGroups,
				...initialUserGroup.permissionGroups
			);
			const removedPermissions = without(
				initialUserGroup.permissionGroups,
				...userGroup.permissionGroups
			);

			await UserGroupService.addPermissionGroupsToUserGroup(
				addedPermissions.map((p) => p.id) as number[],
				userGroupId
			);
			await UserGroupService.removePermissionGroupsFromUserGroup(
				removedPermissions.map((p) => p.id) as number[],
				userGroupId
			);

			redirectToClientPage(
				buildLink(USER_GROUP_PATH.USER_GROUP_DETAIL, { id: userGroupId }),
				history
			);
			ToastService.success(
				t('admin/user-groups/views/user-group-edit___de-gebruikersgroep-is-opgeslagen')
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to save user group', err, {
					userGroup,
					initialUserGroup,
				})
			);
			ToastService.danger(
				t(
					'admin/user-groups/views/user-group-edit___het-opslaan-van-de-gebruikersgroep-is-mislukt'
				)
			);
		}
		setIsSaving(false);
	};

	const getAllPermissionGroups = () => {
		const permissionGroupIdsInUserGroup: number[] = compact(
			(get(userGroup, 'permissionGroups', []) as Partial<PermissionGroup>[]).map(
				(pg) => pg.id
			)
		);
		return allPermissionGroups
			.filter((p) => {
				// Don't show permissionGroups that are already linked to this user group
				return !permissionGroupIdsInUserGroup.includes(p.id as number);
			})
			.map((pg) => ({
				label: pg.label || pg.description || '',
				value: String(pg.id),
			}));
	};

	const renderTableCell = (rowData: Permission, columnId: UserGroupOverviewTableCols) => {
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
						<Button
							icon="delete"
							onClick={() => openConfirmDeleteModal(rowData)}
							size="small"
							ariaLabel={t(
								'admin/user-groups/views/user-group-edit___verwijder-deze-gebruikersgroep'
							)}
							title={t(
								'admin/user-groups/views/user-group-edit___verwijder-deze-gebruikersgroep'
							)}
							type="tertiary"
						/>
					</ButtonToolbar>
				);

			case 'description': // fallthrough
			default:
				return rowData[columnId];
		}
	};

	const renderEditPage = () => {
		if (!userGroup) {
			return;
		}
		return (
			<>
				<Container size="medium">
					<Spacer margin="bottom-extra-large">
						<Box backgroundColor="gray">
							<Form>
								<FormGroup
									label={t('admin/user-groups/views/user-group-edit___label')}
									error={formErrors.label}
									required
								>
									<TextInput
										value={userGroup.label || ''}
										onChange={(newLabel) =>
											setUserGroup({
												...userGroup,
												label: newLabel,
											})
										}
									/>
								</FormGroup>
								<FormGroup
									label={t(
										'admin/user-groups/views/user-group-edit___beschrijving'
									)}
									error={formErrors.description}
								>
									<TextInput
										value={userGroup.description || ''}
										onChange={(newDescription) =>
											setUserGroup({
												...userGroup,
												description: newDescription,
											})
										}
									/>
								</FormGroup>
							</Form>
						</Box>
					</Spacer>
				</Container>

				<Panel>
					<PanelHeader>
						<BlockHeading type="h3">
							Permissie groepen gelinked aan deze gebruikersgroep:
						</BlockHeading>
					</PanelHeader>
					<PanelBody>
						<Spacer margin="bottom-large">
							<Form type="inline">
								<FormGroup
									label={t(
										'admin/user-groups/views/user-group-edit___voeg-een-permissie-groep-toe-aan-deze-gebruikersgroep'
									)}
								>
									<Select
										options={getAllPermissionGroups()}
										placeholder={t(
											'admin/user-groups/views/user-group-edit___kies-een-permissie-groep'
										)}
										value={selectedPermissionGroupId || undefined}
										onChange={setSelectedPermissionGroupId}
										loading={!allPermissionGroups}
									/>
								</FormGroup>
								<FormGroup>
									<Button
										label={t(
											'admin/user-groups/views/user-group-edit___toevoegen'
										)}
										title={t(
											'admin/user-groups/views/user-group-edit___voeg-de-geselecteerde-permissie-groep-toe-aan-deze-gebruikersgroep'
										)}
										ariaLabel={t(
											'admin/user-groups/views/user-group-edit___voeg-de-geselecteerde-permissie-groep-toe-aan-deze-gebruikersgroep'
										)}
										onClick={handleAddPermissionGroup}
										type="primary"
									/>
								</FormGroup>
							</Form>
						</Spacer>
						<Table
							columns={GET_PERMISSION_GROUP_TABLE_COLS()}
							data={UserGroupService.sortPermissionGroups(
								userGroup.permissionGroups || [],
								sortColumn,
								sortOrder
							)}
							emptyStateMessage={t(
								'admin/user-groups/views/user-group-edit___deze-gebruikersgroep-is-nog-niet-gelinked-aan-een-permissiegroep'
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
						<DeleteObjectModal
							deleteObjectCallback={handlePermissionGroupDelete}
							isOpen={isConfirmDeleteModalOpen}
							onClose={() => setIsConfirmModalOpen(false)}
						/>
					</PanelBody>
				</Panel>
			</>
		);
	};

	// Render
	const renderPage = () => {
		if (!userGroup) {
			return null;
		}
		return (
			<AdminLayout
				onClickBackButton={() => navigate(history, ADMIN_PATH.USER_GROUP_OVERVIEW)}
				pageTitle={t('admin/user-groups/views/user-group-edit___gebruikersgroep-aanpassen')}
				size="large"
			>
				{' '}
				<AdminLayoutTopBarRight>
					<ButtonToolbar>
						<Button
							label={t('admin/user-groups/views/user-group-edit___annuleer')}
							onClick={navigateBack}
							type="tertiary"
						/>
						<Button
							disabled={isSaving}
							label={t('admin/user-groups/views/user-group-edit___opslaan')}
							onClick={handleSave}
						/>
					</ButtonToolbar>
				</AdminLayoutTopBarRight>
				<AdminLayoutBody>{renderEditPage()}</AdminLayoutBody>
			</AdminLayout>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						get(userGroup, 'label'),
						isCreatePage
							? t(
									'admin/user-groups/views/user-group-edit___gebruikersgroep-beheer-aanmaak-pagina-titel'
							  )
							: t(
									'admin/user-groups/views/user-group-edit___gebruikersgroep-beheer-bewerk-pagina-titel'
							  )
					)}
				</title>
				<meta name="description" content={get(userGroup, 'description') || ''} />
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={userGroup}
				render={renderPage}
			/>
		</>
	);
};

export default UserGroupEdit;
