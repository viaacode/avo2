import { flatten, get, without } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../shared/components';
import { ROUTE_PARTS } from '../../../shared/constants';
import { CustomError, navigate } from '../../../shared/helpers';
import { useTableSort } from '../../../shared/hooks';
import { dataService, ToastService } from '../../../shared/services';
import { AdminLayout, AdminLayoutActions, AdminLayoutBody } from '../../shared/layouts';

import { PERMISSION_GROUP_PATH, PERMISSIONS_TABLE_COLS } from '../permission-group.const';
import { GET_ALL_PERMISSIONS, GET_PERMISSION_GROUP_BY_ID } from '../permission-group.gql';
import { PermissionGroupService } from '../permission-group.service';
import {
	Permission,
	PermissionGroup,
	PermissionGroupEditFormErrorState,
	PermissionsTableCols,
} from '../permission-group.types';

interface PermissionGroupEditProps extends DefaultSecureRouteProps<{ id: string }> {}

const PermissionGroupEdit: FunctionComponent<PermissionGroupEditProps> = ({
	history,
	match,
	location,
}) => {
	const [t] = useTranslation();

	// Hooks
	const [initialPermissionGroup, setInitialPermissionGroup] = useState<PermissionGroup | null>(
		null
	);
	const [permissionGroup, setPermissionGroup] = useState<PermissionGroup | null>(null);

	const [formErrors, setFormErrors] = useState<PermissionGroupEditFormErrorState>({});
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
	const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [sortColumn, sortOrder, handleSortClick] = useTableSort<PermissionsTableCols>('label');

	const isCreatePage: boolean = location.pathname.includes(`/${ROUTE_PARTS.create}`);

	const initOrFetchPermissionGroup = useCallback(async () => {
		if (isCreatePage) {
			const permGroup = ({
				label: '',
				description: '',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				permissions: [],
			} as unknown) as PermissionGroup;
			setInitialPermissionGroup(permGroup);
			setPermissionGroup(permGroup);
		} else {
			try {
				const response = await dataService.query({
					query: GET_PERMISSION_GROUP_BY_ID,
					variables: { id: match.params.id },
				});

				const permissionGroupObj = get(response, 'data.users_permission_groups[0]');

				if (!permissionGroupObj) {
					setLoadingInfo({
						state: 'error',
						icon: 'search',
						message: t('Deze permissie groep werd niet gevonden'),
					});
					return;
				}

				const permissions: Permission[] = flatten(
					get(permissionGroupObj, 'permission_group_user_permissions', []).map(
						(permissionGroupItem: any) => {
							return get(permissionGroupItem, 'permissions', []);
						}
					)
				);

				const permGroup = {
					permissions,
					id: permissionGroupObj.id,
					label: permissionGroupObj.label,
					description: permissionGroupObj.description,
					created_at: permissionGroupObj.created_at,
					updated_at: permissionGroupObj.updated_at,
				};
				setInitialPermissionGroup(permGroup);
				setPermissionGroup(permGroup);
			} catch (err) {
				console.error(
					new CustomError('Failed to get permission group by id', err, {
						query: 'GET_PERMISSION_GROUP_BY_ID',
						variables: { id: match.params.id },
					})
				);
				setLoadingInfo({
					state: 'error',
					message: t('Het ophalen van de permissie groep is mislukt'),
				});
			}
		}
	}, [setLoadingInfo, setPermissionGroup, t]);

	const fetchAllPermissions = useCallback(async () => {
		try {
			const response = await dataService.query({
				query: GET_ALL_PERMISSIONS,
			});

			const permissions: Permission[] | undefined = get(response, 'data.users_permissions');

			if (!permissions) {
				throw new CustomError('Response does not contain permissions', null, { response });
			}

			setAllPermissions(permissions);
		} catch (err) {
			console.error(
				new CustomError('Failed to get all permissions from database', err, {
					query: 'GET_ALL_PERMISSIONS',
				})
			);
			ToastService.danger(t('Het ophalen van alle permissies is mislukt'), false);
		}
	}, [setAllPermissions, t]);

	useEffect(() => {
		initOrFetchPermissionGroup();
		fetchAllPermissions();
	}, [initOrFetchPermissionGroup, fetchAllPermissions]);

	useEffect(() => {
		if (permissionGroup) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [permissionGroup, setLoadingInfo]);

	const navigateBack = () => {
		if (isCreatePage) {
			history.push(PERMISSION_GROUP_PATH.PERMISSION_GROUP_OVERVIEW);
		} else {
			navigate(history, PERMISSION_GROUP_PATH.PERMISSION_GROUP_DETAIL, {
				id: match.params.id,
			});
		}
	};

	const getFormErrors = (): PermissionGroupEditFormErrorState | null => {
		if (!permissionGroup || !permissionGroup.label) {
			return {
				label: t('Een label is verplicht'),
			};
		}
		return null;
	};

	const deletePermission = (permissionIdToDelete: number) => {
		if (!permissionGroup) {
			return;
		}
		setPermissionGroup({
			...permissionGroup,
			permissions: (permissionGroup.permissions || []).filter(
				permission => permission.id !== permissionIdToDelete
			),
		});
	};

	const handleAddPermission = () => {
		if (!permissionGroup) {
			return;
		}
		if (
			(permissionGroup.permissions || []).find(pg => String(pg.id) === selectedPermissionId)
		) {
			ToastService.danger(t('Deze permissie zit reeds in de groep'), false);
			return;
		}
		const selectedPermission = allPermissions.find(p => String(p.id) === selectedPermissionId);
		if (!selectedPermission) {
			ToastService.danger(t('De geselecteerde permissie kon niet worden gevonden'), false);
			return;
		}
		setPermissionGroup({
			...permissionGroup,
			permissions: [...permissionGroup.permissions, selectedPermission],
		});
		setSelectedPermissionId(null);
	};

	const handleSave = async () => {
		try {
			const errors = getFormErrors();
			setFormErrors(errors || {});
			if (errors) {
				ToastService.danger(t('De invoer is ongeldig'), false);
				return;
			}

			if (!initialPermissionGroup || !permissionGroup) {
				ToastService.danger(
					t(
						'Het opslaan van de permissie groep is mislukt omdat de permissie groep nog niet is geladen'
					),
					false
				);
				return;
			}

			setIsSaving(true);

			let permissionGroupId: number | string;
			if (isCreatePage) {
				// insert the permission group
				permissionGroupId = await PermissionGroupService.insertPermissionGroup(
					permissionGroup
				);
			} else {
				// Update existing permission group
				await PermissionGroupService.updatePermissionGroup(permissionGroup);
				permissionGroupId = match.params.id;
			}

			const addedPermissions = without(
				permissionGroup.permissions,
				...initialPermissionGroup.permissions
			);
			const removedPermissions = without(
				initialPermissionGroup.permissions,
				...permissionGroup.permissions
			);

			await PermissionGroupService.addPermissionsToGroup(
				addedPermissions.map(p => p.id),
				permissionGroupId
			);
			await PermissionGroupService.removePermissionsToGroup(
				removedPermissions.map(p => p.id),
				permissionGroupId
			);

			ToastService.success(t('De permissie groep is opgeslagen'), false);
			setIsSaving(false);
		} catch (err) {
			console.error(
				new CustomError('Failed to save permission group', err, {
					permissionGroup,
					initialPermissionGroup,
				})
			);
			ToastService.danger(t('Het opslaan van de permissiegroep is mislukt'), false);
		}
	};

	const getAllPermissions = () => {
		const permissionIdsInGroup: number[] = (get(
			permissionGroup,
			'permissions',
			[]
		) as Permission[]).map(p => p.id);
		return allPermissions
			.filter(p => {
				// Don't show permissions that are already part of the permission group permissions
				return !permissionIdsInGroup.includes(p.id);
			})
			.map(p => ({
				label: p.description || p.label,
				value: String(p.id),
			}));
	};

	const renderTableCell = (rowData: Permission, columnId: PermissionsTableCols) => {
		switch (columnId) {
			case 'label':
			case 'description':
				return rowData[columnId];

			case 'actions':
				return (
					<ButtonToolbar>
						<Button
							icon="delete"
							onClick={() => deletePermission(rowData.id)}
							size="small"
							ariaLabel={t('Verwijder')}
							title={t('Verwijder')}
							type="tertiary"
						/>
					</ButtonToolbar>
				);

			default:
				return rowData[columnId];
		}
	};

	const renderEditPage = () => {
		if (!permissionGroup) {
			return;
		}
		return (
			<>
				<Container size="medium">
					<Spacer margin="bottom-extra-large">
						<Box backgroundColor="gray">
							<Form>
								<FormGroup label={t('Label')} error={formErrors.label}>
									<TextInput
										value={permissionGroup.label || ''}
										onChange={newLabel =>
											setPermissionGroup({
												...permissionGroup,
												label: newLabel,
											})
										}
									/>
								</FormGroup>
								<FormGroup label={t('Beschrijving')} error={formErrors.description}>
									<TextInput
										value={permissionGroup.description || ''}
										onChange={newDescription =>
											setPermissionGroup({
												...permissionGroup,
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
						<BlockHeading type="h3">Permissies in deze groep:</BlockHeading>
					</PanelHeader>
					<PanelBody>
						<Spacer margin="bottom-large">
							<Form type="inline">
								<FormGroup label={t('Voeg een permissie toe aan deze groep: ')}>
									<Select
										options={getAllPermissions()}
										placeholder={t('Kies een permissie')}
										value={selectedPermissionId}
										onChange={setSelectedPermissionId}
										loading={!allPermissions}
									/>
								</FormGroup>
								<FormGroup>
									<Button
										label={t('Toevoegen')}
										onClick={handleAddPermission}
										type="primary"
									/>
								</FormGroup>
							</Form>
						</Spacer>
						<Table
							columns={PERMISSIONS_TABLE_COLS}
							data={permissionGroup.permissions}
							emptyStateMessage={t('Deze groep bevat nog geen permissies')}
							onColumnClick={columId =>
								handleSortClick(columId as PermissionsTableCols)
							}
							renderCell={(rowData: PermissionGroup, columnId: string) =>
								renderTableCell(rowData, columnId as PermissionsTableCols)
							}
							rowKey="id"
							variant="bordered"
							sortColumn={sortColumn}
							sortOrder={sortOrder}
						/>
					</PanelBody>
				</Panel>
			</>
		);
	};

	// Render
	const renderPage = () => (
		<AdminLayout showBackButton pageTitle={t('Permissie groep aanpassen')}>
			<AdminLayoutBody>
				<Container mode="vertical" size="small">
					<Container mode="horizontal">{renderEditPage()}</Container>
				</Container>
			</AdminLayoutBody>
			<AdminLayoutActions>
				<Button label={t('Annuleer')} onClick={navigateBack} type="tertiary" />
				<Button disabled={isSaving} label={t('Opslaan')} onClick={handleSave} />
			</AdminLayoutActions>
		</AdminLayout>
	);

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={permissionGroup}
			render={renderPage}
		/>
	);
};

export default PermissionGroupEdit;
