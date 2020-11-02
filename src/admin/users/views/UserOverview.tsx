import classnames from 'classnames';
import FileSaver from 'file-saver';
import { compact, get, isNil } from 'lodash-es';
import React, { FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';
import reactToString from 'react-to-string';

import {
	Alert,
	Button,
	ButtonToolbar,
	Column,
	Grid,
	Modal,
	ModalBody,
	ModalFooterRight,
	RadioButtonGroup,
	Spacer,
	TagInfo,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { GENERATE_SITE_TITLE } from '../../../constants';
import { ErrorView } from '../../../error/views';
import { SettingsService } from '../../../settings/settings.service';
import {
	CheckboxOption,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError, formatDate } from '../../../shared/helpers';
import { truncateTableValue } from '../../../shared/helpers/truncate';
import withUser, { UserProps } from '../../../shared/hocs/withUser';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import AddOrRemoveLinkedElementsModal, {
	AddOrRemove,
} from '../../shared/components/AddOrRemoveLinkedElementsModal/AddOrRemoveLinkedElementsModal';
import { ContentPicker } from '../../shared/components/ContentPicker/ContentPicker';
import FilterTable, { getFilters } from '../../shared/components/FilterTable/FilterTable';
import {
	getBooleanFilters,
	getDateRangeFilters,
	getMultiOptionFilters,
	getQueryFilter,
} from '../../shared/helpers/filters';
import { AdminLayout, AdminLayoutBody } from '../../shared/layouts';
import { PickerItem } from '../../shared/types';
import { useUserGroups } from '../../user-groups/hooks';
import {
	GET_DELETE_RADIO_OPTIONS,
	GET_USER_BULK_ACTIONS,
	GET_USER_OVERVIEW_TABLE_COLS,
	ITEMS_PER_PAGE,
} from '../user.const';
import { UserService } from '../user.service';
import {
	DeleteContentCounts,
	UserBulkAction,
	UserDeleteOption,
	UserOverviewTableCol,
	UserTableState,
} from '../user.types';

import './UserOverview.scss';

interface UserOverviewProps {}

const UserOverview: FunctionComponent<UserOverviewProps & UserProps> = ({ user }) => {
	const [t] = useTranslation();

	const [profiles, setProfiles] = useState<Avo.User.Profile[] | null>(null);
	const [profileCount, setProfileCount] = useState<number>(0);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [tableState, setTableState] = useState<Partial<UserTableState>>({});
	const [userGroups] = useUserGroups();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
	const [deleteOptionsModalOpen, setDeleteOptionsModalOpen] = useState<boolean>(false);
	const [selectedDeleteOption, setSelectedDeleteOption] = useState<UserDeleteOption>(
		'DELETE_ALL'
	);
	const [transferToUser, setTransferToUser] = useState<PickerItem | undefined>();
	const [transferToUserError, setTransferToUserError] = useState<string | undefined>();
	const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState<boolean>(false);
	const [deleteContentCounts, setDeleteContentCounts] = useState<DeleteContentCounts | null>(
		null
	);
	const [changeSubjectsModalOpen, setChangeSubjectsModalOpen] = useState<boolean>(false);
	const [allSubjects, setAllSubjects] = useState<string[]>([]);

	const generateWhereObject = (
		filters: Partial<UserTableState>,
		onlySelectedProfiles: boolean
	) => {
		const andFilters: any[] = [];
		andFilters.push(
			...getQueryFilter(
				filters.query,
				// @ts-ignore
				(queryWordWildcard: string, queryWord: string, query: string) => [
					{ profiles: { stamboek: { _ilike: query } } },
					{ profiles: { alternative_email: { _ilike: queryWordWildcard } } },
					{ profiles: { bio: { _ilike: queryWordWildcard } } },
					{ profiles: { alias: { _ilike: queryWordWildcard } } },
					{ profiles: { title: { _ilike: queryWordWildcard } } },
					{ profiles: { organisation: { name: { _ilike: queryWordWildcard } } } },
					{
						profiles: {
							profile_user_groups: {
								groups: { label: { _ilike: queryWordWildcard } },
							},
						},
					},
					{
						_or: [
							// TODO replace with full_name after https://meemoo.atlassian.net/browse/DEV-1301
							{ first_name: { _ilike: queryWordWildcard } },
							{ last_name: { _ilike: queryWordWildcard } },
							{ mail: { _ilike: queryWordWildcard } },
						],
					},
				]
			)
		);
		andFilters.push(...getBooleanFilters(filters, ['is_blocked']));
		andFilters.push(
			...getMultiOptionFilters(
				filters,
				['user_group', 'organisation'],
				['profiles.profile_user_groups.groups.id', 'profiles.company_id']
			)
		);
		andFilters.push(...getDateRangeFilters(filters, ['created_at', 'last_access_at']));
		if (onlySelectedProfiles) {
			andFilters.push({ profile: { id: { _in: selectedProfileIds } } });
		}

		return { _and: andFilters };
	};

	const fetchProfiles = useCallback(async () => {
		try {
			setIsLoading(true);
			const [profilesTemp, profileCountTemp] = await UserService.getProfiles(
				tableState.page || 0,
				(tableState.sort_column || 'last_access_at') as UserOverviewTableCol,
				tableState.sort_order || 'desc',
				generateWhereObject(getFilters(tableState), false)
			);
			setProfiles(profilesTemp);
			setProfileCount(profileCountTemp);
		} catch (err) {
			console.error(
				new CustomError('Failed to get users from the database', err, { tableState })
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/users/views/user-overview___het-ophalen-van-de-gebruikers-is-mislukt'
				),
			});
		}
		setIsLoading(false);
	}, [setLoadingInfo, setProfiles, setProfileCount, tableState, t]);

	useEffect(() => {
		fetchProfiles();
	}, [fetchProfiles]);

	useEffect(() => {
		if (profiles) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [fetchProfiles, profiles]);

	const bulkChangeSubjects = async (addOrRemove: AddOrRemove, subjects: string[]) => {
		try {
			if (!selectedProfileIds || !selectedProfileIds.length) {
				return;
			}
			if (addOrRemove === 'add') {
				await UserService.bulkAddSubjectsToProfiles(subjects, compact(selectedProfileIds));
				ToastService.success(
					t('De vakken zijn toegevoegd aan de geselecteerde gebruikers')
				);
			} else {
				// remove
				await UserService.bulkRemoveSubjectsFromProfiles(
					subjects,
					compact(selectedProfileIds)
				);
				ToastService.success(
					t('De vakken zijn verwijderd van de geselecteerde gebruikers')
				);
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to bulk update subjects of user profiles', err, {
					addOrRemove,
					subjects,
				})
			);
			ToastService.danger(t('Het aanpassen van de vakken is mislukt'));
		}
	};

	const setAllProfilesAsSelected = async () => {
		setIsLoading(true);
		try {
			const profileIds = await UserService.getProfileIds(
				generateWhereObject(getFilters(tableState), false)
			);
			ToastService.info(
				t('Je hebt {{numOfSelectedProfiles}} gebuikers geselecteerd', {
					numOfSelectedProfiles: profileIds.length,
				})
			);
			setSelectedProfileIds(profileIds);
		} catch (err) {
			console.error(
				new CustomError(
					'Failed to fetch all profile ids that adhere to the selected filters',
					err,
					{ tableState }
				)
			);
			ToastService.danger(t('Het ophalen van alle geselecteerde gebruiker ids is mislukt'));
		}

		setIsLoading(false);
	};

	/**
	 * Blocks or unblocks all users in the selectedProfileIds list
	 * @param blockOrUnblock set true for block and false for unblock
	 */
	const bulkUpdateBlockStatus = async (blockOrUnblock: boolean) => {
		try {
			await UserService.updateBlockStatusByProfileIds(selectedProfileIds, blockOrUnblock);
			await fetchProfiles();
			ToastService.success(
				blockOrUnblock
					? t('De geselecteerde gebruikers zijn geblokkeerd')
					: t('De geselecteerde gebruikers zijn gedeblokkeerd')
			);
		} catch (err) {
			ToastService.danger(t('Het blokkeren van de geselecteerde gebruikers is mislukt'));
		}
	};

	const bulkExport = async () => {
		try {
			setIsLoading(true);
			const [profilesTemp] = await UserService.getProfiles(
				0,
				(tableState.sort_column || 'last_access_at') as UserOverviewTableCol,
				tableState.sort_order || 'desc',
				generateWhereObject(getFilters(tableState), true),
				100000
			);
			const columns = GET_USER_OVERVIEW_TABLE_COLS(userGroupOptions);
			const columnIds =
				tableState.columns && tableState.columns.length
					? tableState.columns
					: columns
							.filter((column) => column.visibleByDefault)
							.map((column) => column.id);
			const columnLabels = columnIds.map((columnId) =>
				get(
					columns.find((column) => column.id === columnId),
					'label',
					columnId
				)
			);
			const csvRowValues: string[] = [columnLabels.join(';')];
			profilesTemp.forEach((profile) => {
				const csvCellValues: string[] = [];
				columnIds.forEach((columnId) => {
					const csvCellValue = reactToString(
						renderTableCell(profile, columnId as UserOverviewTableCol)
					);
					csvCellValues.push(csvCellValue);
				});
				csvRowValues.push(csvCellValues.join(';'));
			});
			const csvString = csvRowValues.join('\n');
			const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
			FileSaver.saveAs(blob, 'gebruikers.csv');
		} catch (err) {
			console.error(
				new CustomError('Failed to export users to csv file', err, { tableState })
			);
			ToastService.danger(t('Het exporteren van de geselecteerde gebruikers is mislukt'));
		}

		setIsLoading(false);
	};

	const handleBulkAction = async (action: UserBulkAction): Promise<void> => {
		if (!selectedProfileIds || !selectedProfileIds.length) {
			return;
		}
		switch (action) {
			case 'export':
				await bulkExport();
				return;

			case 'block':
				await bulkUpdateBlockStatus(true);
				return;

			case 'unblock':
				await bulkUpdateBlockStatus(false);
				return;

			case 'delete':
				setDeleteOptionsModalOpen(true);
				return;

			case 'change_subjects':
				setChangeSubjectsModalOpen(true);
				SettingsService.fetchSubjects()
					.then((subjects: string[]) => {
						setAllSubjects(subjects);
					})
					.catch((err) => {
						console.error(
							new CustomError('Failed to get subjects from the database', err)
						);
						ToastService.danger(
							t('settings/components/profile___het-ophalen-van-de-vakken-is-mislukt')
						);
					});
				return;
		}
	};

	const handleOptionsModalClose = () => {
		setDeleteOptionsModalOpen(false);
	};

	const handleConfirmModalClose = () => {
		setDeleteConfirmModalOpen(false);
		setDeleteContentCounts(null);
		setSelectedDeleteOption('DELETE_ALL');
		setTransferToUser(undefined);
	};

	const handleDeleteUsers = () => {
		ToastService.info('Nog niet geïmplementeerd');
	};

	const validateOptionModalAndOpenConfirm = async () => {
		try {
			if (
				(selectedDeleteOption === 'TRANSFER_PUBLIC' ||
					selectedDeleteOption === 'TRANSFER_ALL') &&
				!transferToUser
			) {
				// transfer user was not selected, or transfer user is the same user as one of the user that will be deleted
				setTransferToUserError(t('Kies een gebruiker om de content naar over te dragen.'));
				return;
			}
			if (
				(selectedDeleteOption === 'TRANSFER_PUBLIC' ||
					selectedDeleteOption === 'TRANSFER_ALL') &&
				transferToUser &&
				selectedProfileIds.includes(transferToUser.value)
			) {
				// transfer user was not selected, or transfer user is the same user as one of the user that will be deleted
				setTransferToUserError(
					t(
						'Je kan geen content overdragen naar een gebruiker die verwijdert zal worden.'
					)
				);
				return;
			}

			// Fetch counts to inform the user of what objects they are about to delete
			setDeleteContentCounts(
				await UserService.fetchPublicAndPrivateCounts(selectedProfileIds)
			);
			handleOptionsModalClose();
			setDeleteConfirmModalOpen(true);
		} catch (err) {
			console.error(
				new CustomError('Error during validateOptionModalAndOpenConfirm', err, {
					selectedUsers: selectedProfileIds,
					transferToUser,
					selectedDeleteOption,
				})
			);
			ToastService.danger(
				t('Het ophalen van de content items voor de geselecteerde gebruikers is mislukt')
			);
		}
	};

	const renderTableCell = (
		rowData: Partial<Avo.User.Profile>,
		columnId: UserOverviewTableCol
	) => {
		const { id, user, created_at, title, organisation } = rowData;

		switch (columnId) {
			case 'first_name':
				return (
					<Link to={buildLink(ADMIN_PATH.USER_DETAIL, { id })}>
						{truncateTableValue(get(user, columnId))}
					</Link>
				);

			case 'last_name':
			case 'mail':
				return truncateTableValue(get(user, columnId));

			case 'user_group':
				return get(rowData, 'profile_user_groups[0].groups[0].label') || '-';

			case 'oormerk': // TODO replace title with sector after:https://meemoo.atlassian.net/browse/DEV-1062
				return title || '-';

			case 'is_blocked':
				const isBlocked = get(rowData, 'user.is_blocked');
				return isBlocked ? 'Ja' : 'Nee';

			case 'organisation':
				return get(organisation, 'name') || '-';

			case 'created_at':
				return formatDate(created_at) || '-';

			case 'last_access_at':
				const lastAccessDate = get(rowData, 'user.last_access_at');
				return !isNil(lastAccessDate) ? formatDate(lastAccessDate) : '-';

			default:
				return truncateTableValue(get(rowData, columnId));
		}
	};

	const renderNoResults = () => {
		return (
			<ErrorView
				message={t('admin/users/views/user-overview___er-bestaan-nog-geen-gebruikers')}
			>
				<p>
					<Trans i18nKey="admin/users/views/user-overview___beschrijving-wanneer-er-nog-geen-gebruikers-zijn">
						Beschrijving wanneer er nog geen gebruikers zijn
					</Trans>
				</p>
			</ErrorView>
		);
	};

	const renderConfirmDeleteMessage = () => {
		const publicCollections: number = get(deleteContentCounts, 'publicCollections') || 0;
		const privateCollections: number = get(deleteContentCounts, 'privateCollections') || 0;
		const assignments: number = get(deleteContentCounts, 'assignments') || 0;
		const bookmarks: number = get(deleteContentCounts, 'bookmarks') || 0;
		const publicContentPages: number = get(deleteContentCounts, 'publicContentPages') || 0;
		const privateContentPages: number = get(deleteContentCounts, 'privateContentPages') || 0;

		const isDeleteAll = selectedDeleteOption === 'DELETE_ALL';
		const isTransferAll = selectedDeleteOption === 'TRANSFER_ALL';

		const countOutputs: ReactNode[] = [];
		if (isDeleteAll && publicCollections) {
			countOutputs.push(
				<Link
					to={buildLink(
						ADMIN_PATH.COLLECTIONS_OVERVIEW,
						{},
						{
							is_public: '1',
							owner_profile_id: selectedProfileIds.join('~'),
						}
					)}
				>
					{`${publicCollections} ${t('publieke collecties')}`}
				</Link>
			);
		}
		if (!isTransferAll && privateCollections) {
			countOutputs.push(
				<Link
					to={buildLink(
						ADMIN_PATH.COLLECTIONS_OVERVIEW,
						{},
						{
							is_public: '0',
							owner_profile_id: selectedProfileIds.join('~'),
						}
					)}
				>
					{`${privateCollections} ${t('privé collecties')}`}
				</Link>
			);
		}
		if (isDeleteAll && publicContentPages) {
			countOutputs.push(
				<Link
					to={buildLink(
						ADMIN_PATH.CONTENT_PAGE_OVERVIEW,
						{},
						{
							is_public: '1',
							user_profile_id: selectedProfileIds.join('~'),
						}
					)}
				>
					{`${publicContentPages} ${t("publieke content pagina's")}`}
				</Link>
			);
		}
		if (!isTransferAll && privateContentPages) {
			countOutputs.push(
				<Link
					to={buildLink(
						ADMIN_PATH.CONTENT_PAGE_OVERVIEW,
						{},
						{
							is_public: '0',
							user_profile_id: selectedProfileIds.join('~'),
						}
					)}
				>
					{`${privateContentPages} ${t("privé content pagina's")}`}
				</Link>
			);
		}
		if (!isTransferAll && assignments) {
			countOutputs.push(`${assignments} ${t('opdrachten')}`);
		}
		if (!isTransferAll && bookmarks) {
			countOutputs.push(`${bookmarks} ${t('bladwijzers')}`);
		}
		return (
			<>
				{t('Weet je zeker dat je deze gebruikers wil verwijderen?')}

				{!!countOutputs.length && (
					<Spacer margin="top" className="c-content">
						<strong>Deze inhoud zal verwijderd worden:</strong>
						<ul>
							{countOutputs.map((count, index) => (
								<li key={`content-count-${index}`}>{count}</li>
							))}
						</ul>
					</Spacer>
				)}

				<Spacer margin="top">
					<Alert
						message={t('Deze actie kan niet ongedaan gemaakt worden!')}
						type="danger"
					/>
				</Spacer>
			</>
		);
	};

	const userGroupOptions = userGroups.map(
		(option): CheckboxOption => ({
			id: String(option.id),
			label: option.label,
			checked: get(tableState, 'author.user_groups', [] as string[]).includes(
				String(option.id)
			),
		})
	);

	const renderUserOverview = () => {
		if (!profiles) {
			return null;
		}
		return (
			<>
				<FilterTable
					columns={GET_USER_OVERVIEW_TABLE_COLS(userGroupOptions)}
					data={profiles}
					dataCount={profileCount}
					renderCell={(rowData: Partial<Avo.User.Profile>, columnId: string) =>
						renderTableCell(rowData, columnId as UserOverviewTableCol)
					}
					searchTextPlaceholder={t(
						'admin/users/views/user-overview___zoek-op-naam-email-alias'
					)}
					noContentMatchingFiltersMessage={t(
						'admin/users/views/user-overview___er-zijn-geen-gebruikers-doe-voldoen-aan-de-opgegeven-filters'
					)}
					itemsPerPage={ITEMS_PER_PAGE}
					onTableStateChanged={setTableState}
					renderNoResults={renderNoResults}
					isLoading={isLoading}
					showCheckboxes
					selectedItems={selectedProfileIds}
					onSelectionChanged={setSelectedProfileIds}
					onSelectAll={setAllProfilesAsSelected}
					onSelectBulkAction={handleBulkAction as any}
					bulkActions={GET_USER_BULK_ACTIONS(user)}
				/>
				<Modal
					title={t('Verwijder opties:')}
					isOpen={deleteOptionsModalOpen}
					onClose={() => setDeleteOptionsModalOpen(false)}
					size="large"
				>
					<ModalBody>
						<Grid className="a-delete-user__grid">
							<Column size="3-6">
								<div
									className={classnames(
										'a-delete-user__image',
										selectedDeleteOption
									)}
								/>
							</Column>
							<Column size="3-6">
								<RadioButtonGroup
									options={GET_DELETE_RADIO_OPTIONS()}
									value={selectedDeleteOption}
									onChange={setSelectedDeleteOption as any}
								/>
								{(selectedDeleteOption === 'TRANSFER_PUBLIC' ||
									selectedDeleteOption === 'TRANSFER_ALL') && (
									<ContentPicker
										allowedTypes={['PROFILE']}
										onSelect={(option) =>
											setTransferToUser(option || undefined)
										}
										initialValue={transferToUser}
										placeholder={t('Overdragen naar gebruiker')}
										hideTargetSwitch
										hideTypeDropdown
										errors={transferToUserError ? [transferToUserError] : []}
									/>
								)}
							</Column>
						</Grid>
					</ModalBody>
					<ModalFooterRight>
						<Toolbar>
							<ToolbarRight>
								<ToolbarItem>
									<ButtonToolbar>
										<Button
											type="secondary"
											label={t(
												'admin/shared/components/change-labels-modal/change-labels-modal___annuleren'
											)}
											onClick={handleOptionsModalClose}
										/>
										<Button
											type="danger"
											label={t('Verwijder gebruikers')}
											onClick={validateOptionModalAndOpenConfirm}
										/>
									</ButtonToolbar>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</ModalFooterRight>
				</Modal>
				<Modal
					isOpen={deleteConfirmModalOpen}
					title={t('Bevestiging')}
					size="medium"
					onClose={handleConfirmModalClose}
					scrollable
				>
					<ModalBody>
						{renderConfirmDeleteMessage()}
						<Toolbar>
							<ToolbarRight>
								<ToolbarItem>
									<ButtonToolbar>
										<Button
											type="secondary"
											label={t('Annuleren')}
											onClick={handleConfirmModalClose}
										/>
										<Button
											type="danger"
											label={t('Verwijder gebruikers')}
											onClick={handleDeleteUsers}
										/>
									</ButtonToolbar>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</ModalBody>
				</Modal>
				<AddOrRemoveLinkedElementsModal
					title={t('Vakken aanpassen')}
					addOrRemoveLabel={t('Vakken toevoegen of verwijderen')}
					contentLabel={t('Vakken')}
					isOpen={changeSubjectsModalOpen}
					onClose={() => setChangeSubjectsModalOpen(false)}
					labels={allSubjects.map((subject) => ({
						label: subject,
						value: subject,
					}))}
					callback={(addOrRemove: AddOrRemove, tags: TagInfo[]) =>
						bulkChangeSubjects(
							addOrRemove,
							tags.map((tag) => tag.value.toString())
						)
					}
				/>
			</>
		);
	};

	return (
		<AdminLayout
			pageTitle={t('admin/users/views/user-overview___gebruikers')}
			size="full-width"
		>
			<AdminLayoutBody>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							t(
								'admin/users/views/user-overview___gebruikersbeheer-overzicht-pagina-titel'
							)
						)}
					</title>
					<meta
						name="description"
						content={t(
							'admin/users/views/user-overview___gebruikersbeheer-overzicht-pagina-beschrijving'
						)}
					/>
				</MetaTags>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={profiles}
					render={renderUserOverview}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default withUser(UserOverview) as FunctionComponent<UserOverviewProps>;
