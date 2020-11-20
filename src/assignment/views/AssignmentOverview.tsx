import classnames from 'classnames';
import { capitalize, compact, get, isNil } from 'lodash-es';
import React, { FunctionComponent, ReactText, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
	Button,
	ButtonGroup,
	ButtonToolbar,
	Checkbox,
	Flex,
	Form,
	FormGroup,
	Icon,
	IconName,
	Pagination,
	Select,
	Spacer,
	Table,
	TagList,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileName } from '../../authentication/helpers/get-profile-info';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { APP_PATH } from '../../constants';
import { ErrorView } from '../../error/views';
import {
	CheckboxDropdownModal,
	CheckboxOption,
	DeleteObjectModal,
	InputModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../shared/components';
import MoreOptionsDropdown from '../../shared/components/MoreOptionsDropdown/MoreOptionsDropdown';
import {
	buildLink,
	CustomError,
	formatTimestamp,
	isMobileWidth,
	navigate,
	renderAvatar,
} from '../../shared/helpers';
import { truncateTableValue } from '../../shared/helpers/truncate';
import { useTableSort } from '../../shared/hooks';
import { AssignmentLabelsService, ToastService } from '../../shared/services';
import { trackEvents } from '../../shared/services/event-logging-service';
import { ITEMS_PER_PAGE } from '../../workspace/workspace.const';
import { AssignmentService } from '../assignment.service';
import { AssignmentColumn, AssignmentOverviewTableColumns } from '../assignment.types';

import './AssignmentOverview.scss';

type ExtraAssignmentOptions = 'edit' | 'duplicate' | 'archive' | 'delete';

interface AssignmentOverviewProps extends DefaultSecureRouteProps {
	onUpdate: () => void | Promise<void>;
}

const AssignmentOverview: FunctionComponent<AssignmentOverviewProps> = ({
	onUpdate = () => {},
	history,
	user,
}) => {
	const [t] = useTranslation();

	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [assignments, setAssignments] = useState<Avo.Assignment.Assignment[] | null>(null);
	const [assignmentCount, setAssigmentCount] = useState<number>(0);
	const [allAssignmentLabels, setAllAssignmentLabels] = useState<Avo.Assignment.Label[]>([]);
	const [selectedAssignmentLabelsIds, setSelectedAssignmentLabelsIds] = useState<string[]>([]);
	const [filterString, setFilterString] = useState<string>('');
	const [activeView, setActiveView] = useState<Avo.Assignment.View>('assignments');
	const [dropdownOpenForAssignmentId, setDropdownOpenForAssignmentId] = useState<
		string | number | null
	>(null);
	const [isDuplicateAssignmentModalOpen, setDuplicateAssignmentModalOpen] = useState<boolean>(
		false
	);
	const [isDeleteAssignmentModalOpen, setDeleteAssignmentModalOpen] = useState<boolean>(false);
	const [markedAssignment, setMarkedAssignment] = useState<Avo.Assignment.Assignment | null>(
		null
	);
	const [page, setPage] = useState<number>(0);
	const [canEditAssignments, setCanEditAssignments] = useState<boolean | null>(null);

	const [sortColumn, sortOrder, handleColumnClick] = useTableSort<AssignmentOverviewTableColumns>(
		'created_at'
	);

	const checkPermissions = useCallback(async () => {
		try {
			if (user) {
				setCanEditAssignments(
					await PermissionService.hasPermissions(PermissionName.EDIT_ASSIGNMENTS, user)
				);
			}
		} catch (err) {
			console.error('Failed to check permissions', err, {
				user,
				permissions: PermissionName.EDIT_ASSIGNMENTS,
			});
			ToastService.danger(
				t(
					'shared/components/loading-error-loaded-component/loading-error-loaded-component___er-ging-iets-mis-tijdens-het-controleren-van-de-rechten-van-je-account'
				)
			);
		}
	}, [setCanEditAssignments, user, t]);

	const fetchAssignments = useCallback(async () => {
		try {
			if (isNil(canEditAssignments)) {
				return;
			}
			const response = await AssignmentService.fetchAssignments(
				canEditAssignments,
				user,
				canEditAssignments ? activeView === 'archived_assignments' : false, // Teachers can see archived assignments
				canEditAssignments ? null : activeView === 'archived_assignments', // pupils can see assignments past deadline
				{
					[sortColumn]: sortOrder,
				},
				page,
				filterString,
				selectedAssignmentLabelsIds
			);
			setAssignments(response.assignments);
			setAssigmentCount(response.count);
		} catch (err) {
			setLoadingInfo({
				state: 'error',
				message: t(
					'assignment/views/assignment-overview___het-ophalen-van-je-opdrachten-is-mislukt'
				),
			});
		}
	}, [
		t,
		activeView,
		canEditAssignments,
		setLoadingInfo,
		filterString,
		selectedAssignmentLabelsIds,
		page,
		sortColumn,
		sortOrder,
		user,
	]);

	const fetchAssignmentLabels = useCallback(async () => {
		// Fetch all labels for th current user
		const labels = await AssignmentLabelsService.getLabelsForProfile(get(user, 'profile.id'));
		setAllAssignmentLabels(labels);
	}, [user, setAllAssignmentLabels]);

	useEffect(() => {
		checkPermissions();
	}, [checkPermissions]);

	useEffect(() => {
		if (!isNil(canEditAssignments)) {
			fetchAssignments();
			fetchAssignmentLabels();
		}
	}, [canEditAssignments, fetchAssignments, fetchAssignmentLabels]);

	useEffect(() => {
		if (!isNil(assignments) && !isNil(assignmentCount)) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [assignments, assignmentCount]);

	const attemptDuplicateAssignment = async (
		newTitle: string,
		assignment: Partial<Avo.Assignment.Assignment> | null
	) => {
		try {
			if (!assignment) {
				throw new CustomError(
					'Failed to duplicate the assignment because the marked assignment is null'
				);
			}
			await AssignmentService.duplicateAssignment(newTitle, assignment, user);

			onUpdate();
			fetchAssignments();

			ToastService.success(
				t('assignment/views/assignment-overview___het-dupliceren-van-de-opdracht-is-gelukt')
			);
		} catch (err) {
			console.error('Failed to copy the assignment', err, { newTitle, assignment });
			ToastService.danger(
				t('assignment/views/assignment-edit___het-kopieren-van-de-opdracht-is-mislukt')
			);
		}
	};

	const archiveAssignment = async (assignmentId: number | string) => {
		try {
			const assignment: Avo.Assignment.Assignment | null = await AssignmentService.fetchAssignmentById(
				assignmentId
			);

			if (assignment) {
				const archivedAssignment: Partial<Avo.Assignment.Assignment> = {
					...assignment,
					is_archived: !assignment.is_archived,
				};

				if (await AssignmentService.updateAssignment(archivedAssignment)) {
					onUpdate();
					if (assignments && assignments.length === 1) {
						// Switch to other tab, so user doesn't see empty list (https://meemoo.atlassian.net/browse/AVO-638)
						setActiveView(
							activeView === 'assignments' ? 'archived_assignments' : 'assignments'
						);
					} else {
						fetchAssignments();
					}
					ToastService.success(
						archivedAssignment.is_archived
							? t(
									'assignment/views/assignment-overview___de-opdracht-is-gearchiveerd'
							  )
							: t(
									'assignment/views/assignment-overview___de-opdracht-is-gedearchiveerd'
							  )
					);
				}
				// else: assignment was not valid and could not be saved yet
				// the update assignment function will have already notified the user of the validation errors
			}
		} catch (err) {
			console.error(err);
			ToastService.danger(
				activeView === 'archived_assignments'
					? t(
							'assignment/views/assignment-overview___het-dearchiveren-van-de-opdracht-is-mislukt'
					  )
					: t(
							'assignment/views/assignment-overview___het-archiveren-van-de-opdracht-is-mislukt'
					  )
			);
		}
	};

	const deleteCurrentAssignment = async (assignmentId: number | string | null) => {
		try {
			if (typeof assignmentId === 'undefined' || assignmentId === null) {
				ToastService.danger(
					t(
						'assignment/views/assignment-overview___de-huidige-opdracht-is-nog-nooit-opgeslagen-geen-id'
					)
				);
				return;
			}
			await AssignmentService.deleteAssignment(assignmentId);

			trackEvents(
				{
					object: String(assignmentId),
					object_type: 'assignment',
					message: `Gebruiker ${getProfileName(user)} heeft een opdracht verwijderd`,
					action: 'delete',
				},
				user
			);

			await fetchAssignments();
			onUpdate();
			ToastService.success(
				t('assignment/views/assignment-overview___de-opdracht-is-verwijdert')
			);
		} catch (err) {
			console.error(err);
			ToastService.danger(
				t(
					'assignment/views/assignment-overview___het-verwijderen-van-de-opdracht-is-mislukt'
				)
			);
		}
	};

	const handleExtraOptionsItemClicked = async (
		actionId: ExtraAssignmentOptions,
		dataRow: Avo.Assignment.Assignment
	) => {
		setDropdownOpenForAssignmentId(null);
		if (!dataRow.id) {
			ToastService.danger(
				t(
					'assignment/views/assignment-overview___het-opdracht-id-van-de-geselecteerde-rij-is-niet-ingesteld'
				)
			);
			return;
		}
		switch (actionId) {
			case 'edit':
				navigate(history, APP_PATH.ASSIGNMENT_EDIT.route, { id: dataRow.id });
				break;
			case 'duplicate':
				try {
					const assignment: Avo.Assignment.Assignment = await AssignmentService.fetchAssignmentById(
						dataRow.id
					);

					setMarkedAssignment(assignment);
					setDuplicateAssignmentModalOpen(true);
				} catch (err) {
					console.error('Failed to duplicate assignment', err, {
						assignmentId: dataRow.id,
					});
					ToastService.danger(
						t(
							'assignment/views/assignment-overview___het-ophalen-van-de-details-van-de-opdracht-is-mislukt'
						)
					);
				}
				break;
			case 'archive':
				await archiveAssignment(dataRow.id);
				break;
			case 'delete':
				setMarkedAssignment(dataRow);
				setDeleteAssignmentModalOpen(true);
				break;
			default:
				return null;
		}
	};

	const handleDeleteModalClose = () => {
		setDeleteAssignmentModalOpen(false);
		setMarkedAssignment(null);
	};

	const handleDuplicateModalClose = () => {
		setDuplicateAssignmentModalOpen(false);
		setMarkedAssignment(null);
	};

	const toggleAssignmentSubmitStatus = async (
		assignmentResponse: Avo.Assignment.Response | null
	) => {
		try {
			if (!assignmentResponse) {
				console.error(
					new CustomError(
						'Trying to submit an assignment response while passing null',
						null,
						{ assignmentResponse }
					)
				);
				ToastService.danger(
					t(
						'assignment/views/assignment-overview___deze-opdracht-kon-niet-geupdate-worden-probeer-de-pagina-te-herladen'
					)
				);
				return;
			}
			await AssignmentService.toggleAssignmentResponseSubmitStatus(
				assignmentResponse.id,
				assignmentResponse.submitted_at ? null : new Date().toISOString()
			);
			fetchAssignments();
			ToastService.success(
				assignmentResponse.submitted_at
					? t(
							'assignment/views/assignment-overview___de-opdracht-is-gemarkeerd-als-nog-niet-gemaakt'
					  )
					: t(
							'assignment/views/assignment-overview___de-opdracht-is-gemarkeerd-als-gemaakt'
					  )
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to toggle assignment response submit status', err, {
					assignmentResponse,
				})
			);
			ToastService.danger(
				t(
					'assignment/views/assignment-overview___deze-opdracht-kon-niet-geupdate-worden-probeer-de-pagina-te-herladen'
				)
			);
		}
	};

	const renderActions = (rowData: Avo.Assignment.Assignment) => {
		return (
			<ButtonToolbar>
				{canEditAssignments && (
					<MoreOptionsDropdown
						isOpen={dropdownOpenForAssignmentId === rowData.id}
						onOpen={() => setDropdownOpenForAssignmentId(rowData.id)}
						onClose={() => setDropdownOpenForAssignmentId(null)}
						menuItems={[
							{
								icon: 'edit2' as IconName,
								id: 'edit',
								label: t('assignment/views/assignment-overview___bewerk'),
							},
							{
								icon: 'archive' as IconName,
								id: 'archive',
								label:
									activeView === 'archived_assignments'
										? t('assignment/views/assignment-overview___dearchiveer')
										: t('assignment/views/assignment-overview___archiveer'),
							},
							{
								icon: 'copy' as IconName,
								id: 'duplicate',
								label: t('assignment/views/assignment-overview___dupliceer'),
							},
							{
								icon: 'delete' as IconName,
								id: 'delete',
								label: t('assignment/views/assignment-overview___verwijder'),
							},
						]}
						onOptionClicked={(actionId: ReactText) =>
							handleExtraOptionsItemClicked(
								actionId.toString() as ExtraAssignmentOptions,
								rowData
							)
						}
					/>
				)}

				{canEditAssignments && (
					<Button
						icon="chevron-right"
						label={
							isMobileWidth()
								? t('assignment/views/assignment-overview___bewerken')
								: undefined
						}
						title={t('assignment/views/assignment-overview___bewerk-de-opdracht')}
						onClick={() =>
							navigate(history, APP_PATH.ASSIGNMENT_EDIT.route, {
								id: rowData.id,
							})
						}
						type={isMobileWidth() ? 'tertiary' : 'borderless'}
					/>
				)}

				{!canEditAssignments && (
					<Button
						icon="chevron-right"
						label={
							isMobileWidth()
								? t('assignment/views/assignment-overview___bekijken')
								: undefined
						}
						title={t('assignment/views/assignment-overview___bekijk-deze-opdracht')}
						onClick={() =>
							navigate(history, APP_PATH.ASSIGNMENT_DETAIL.route, {
								id: rowData.id,
							})
						}
						type={isMobileWidth() ? 'tertiary' : 'borderless'}
					/>
				)}
			</ButtonToolbar>
		);
	};

	const renderCell = (
		assignment: Avo.Assignment.Assignment,
		colKey: AssignmentOverviewTableColumns
	) => {
		const cellData: any = (assignment as any)[colKey];
		const editLink = buildLink(APP_PATH.ASSIGNMENT_EDIT.route, { id: assignment.id });
		const detailLink = buildLink(APP_PATH.ASSIGNMENT_DETAIL.route, { id: assignment.id });

		switch (colKey) {
			case 'title':
				const renderTitle = () => (
					<Flex>
						<Spacer margin="right">
							<Icon name="clipboard" subtle />
						</Spacer>
						<div className="c-content-header c-content-header--small">
							<h3 className="c-content-header__header u-m-0">
								<Link to={canEditAssignments ? editLink : detailLink}>
									{truncateTableValue(assignment.title)}
								</Link>
							</h3>
						</div>
					</Flex>
				);

				return isMobileWidth() ? (
					<Spacer margin="bottom-small">{renderTitle()}</Spacer>
				) : (
					renderTitle()
				);

			case 'assignment_type':
				return `${capitalize(cellData)}`;

			case 'labels':
				const labels: Avo.Assignment.Label[] = (get(
					assignment,
					'assignment_assignment_tags',
					[]
				) as any[]).map((labelLink: any) => labelLink.assignment_tag);
				const tagOptions = labels.map((labelObj: Avo.Assignment.Label) => ({
					id: labelObj.id,
					label: labelObj.label || '',
					color: labelObj.color_override || get(labelObj, 'enum_color.label', ''),
				}));
				return <TagList tags={tagOptions} swatches closable={false} />;

			case 'author':
				const profile = get(assignment, 'profile', null);
				const avatarOptions = {
					dark: true,
					abbreviatedName: true,
					small: isMobileWidth(),
				};

				return isMobileWidth() ? (
					<Spacer margin="bottom-small">{renderAvatar(profile, avatarOptions)}</Spacer>
				) : (
					renderAvatar(profile, avatarOptions)
				);

			case 'deadline_at':
				return formatTimestamp(cellData, false);

			case 'assignment_responses':
				return (
					<Link
						to={buildLink(APP_PATH.ASSIGNMENT_RESPONSES.route, { id: assignment.id })}
					>
						{(cellData || []).length}
					</Link>
				);

			case 'submitted_at':
				const isSubmitted = !!get(assignment, 'assignment_responses[0].submitted_at');

				if (activeView === 'archived_assignments') {
					return isSubmitted
						? t('assignment/views/assignment-overview___gemaakt')
						: t('assignment/views/assignment-overview___niet-gemaakt');
				}

				const checkbox = (
					<Checkbox
						checked={isSubmitted}
						label={t('assignment/views/assignment-overview___gemaakt')}
						onChange={() =>
							toggleAssignmentSubmitStatus(get(assignment, 'assignment_responses[0]'))
						}
					/>
				);
				if (isMobileWidth()) {
					return <Spacer margin="top">{checkbox}</Spacer>;
				}
				return checkbox;

			case 'actions':
				if (isMobileWidth()) {
					return <Spacer margin="top">{renderActions(assignment)}</Spacer>;
				}
				return renderActions(assignment);

			case 'class_room': // fallthrough
			default:
				return cellData;
		}
	};

	const columns: AssignmentColumn[] = [
		{
			id: 'title',
			label: t('assignment/views/assignment-overview___titel'),
			sortable: true,
			visibleByDefault: true,
		},
		// { id: 'assignment_type', label: t('assignment/views/assignment-overview___type'), sortable: true, visibleByDefault: true }, // https://district01.atlassian.net/browse/AVO2-421
		...(isMobileWidth()
			? []
			: [
					{
						id: 'labels',
						label: t('assignment/views/assignment-overview___vak-of-project'),
						sortable: false,
					},
			  ]),
		...(canEditAssignments
			? []
			: [
					{
						id: 'author',
						label: t('assignment/views/assignment-overview___leerkracht'),
						sortable: true,
						visibleByDefault: true,
					},
			  ]), // Only show teacher for pupils
		...(isMobileWidth()
			? []
			: [
					{
						id: 'class_room',
						label: t('assignment/views/assignment-overview___klas'),
						sortable: true,
						visibleByDefault: true,
					},
			  ]),
		{
			id: 'deadline_at',
			label: t('assignment/views/assignment-overview___deadline'),
			sortable: true,
			visibleByDefault: true,
		},
		...(canEditAssignments
			? []
			: [
					{
						id: 'submitted_at',
						label: t('assignment/views/assignment-overview___status'),
						tooltip: t(
							'assignment/views/assignment-overview___heb-je-deze-opdracht-reeds-ingediend'
						),
						sortable: true,
						visibleByDefault: true,
					},
			  ]), // Only show teacher for pupils
		// { id: 'assignment_responses', label: t('assignment/views/assignment-overview___indieningen') }, // https://district01.atlassian.net/browse/AVO2-421
		{ id: 'actions', label: '' },
	] as AssignmentColumn[];

	const getLabelOptions = (): CheckboxOption[] => {
		return compact(
			allAssignmentLabels.map((labelObj: Avo.Assignment.Label): CheckboxOption | null => {
				if (!labelObj.label) {
					return null;
				}
				return {
					label: labelObj.label,
					id: String(labelObj.id),
					checked: selectedAssignmentLabelsIds.includes(String(labelObj.id)),
				};
			})
		);
	};

	const renderHeader = () => {
		return (
			<Toolbar
				className={classnames('m-assignment-overview__header-toolbar', {
					'm-assignment-overview__header-toolbar-mobile': isMobileWidth(),
				})}
			>
				<ToolbarLeft>
					<ToolbarItem>
						<ButtonToolbar>
							{isMobileWidth() ? (
								<Select
									options={[
										{
											label: t(
												'assignment/views/assignment-overview___opdrachten'
											),
											value: 'assignments',
										},
										{
											label: canEditAssignments
												? t(
														'assignment/views/assignment-overview___gearchiveerde-opdrachten'
												  )
												: t(
														'assignment/views/assignment-overview___verlopen-opdrachten'
												  ),
											value: 'archived_assignments',
										},
									]}
									value={activeView}
									onChange={(activeViewId) =>
										setActiveView(activeViewId as Avo.Assignment.View)
									}
									className="c-assignment-overview__archive-select"
								/>
							) : (
								<ButtonGroup>
									<Button
										type="secondary"
										label={t(
											'assignment/views/assignment-overview___opdrachten'
										)}
										title={t(
											'assignment/views/assignment-overview___filter-op-niet-gearchiveerde-opdrachten'
										)}
										active={activeView === 'assignments'}
										onClick={() => setActiveView('assignments')}
									/>
									<Button
										type="secondary"
										label={
											canEditAssignments
												? t(
														'assignment/views/assignment-overview___gearchiveerde-opdrachten'
												  )
												: t(
														'assignment/views/assignment-overview___verlopen-opdrachten'
												  )
										}
										title={
											canEditAssignments
												? t(
														'assignment/views/assignment-overview___filter-op-gearchiveerde-opdrachten'
												  )
												: t(
														'assignment/views/assignment-overview___verlopen-opdrachten'
												  )
										}
										active={activeView === 'archived_assignments'}
										onClick={() => setActiveView('archived_assignments')}
									/>
								</ButtonGroup>
							)}
							{canEditAssignments && (
								<CheckboxDropdownModal
									label={t(
										'assignment/views/assignment-overview___vakken-of-projecten'
									)}
									id="labels"
									options={getLabelOptions()}
									onChange={setSelectedAssignmentLabelsIds}
								/>
							)}
						</ButtonToolbar>
					</ToolbarItem>
				</ToolbarLeft>
				{canEditAssignments && (
					<ToolbarRight>
						<ToolbarItem>
							<Form type="inline">
								<FormGroup>
									<TextInput
										icon="filter"
										value={filterString}
										onChange={setFilterString}
										disabled={!assignments || !assignments.length}
									/>
								</FormGroup>
							</Form>
						</ToolbarItem>
					</ToolbarRight>
				)}
			</Toolbar>
		);
	};

	const onClickCreate = () => history.push(buildLink(APP_PATH.SEARCH.route));

	const getEmptyFallbackTitle = () => {
		if (canEditAssignments) {
			// Teacher
			if (activeView === 'assignments') {
				return t(
					'assignment/views/assignment-overview___je-hebt-nog-geen-opdrachten-aangemaakt'
				);
			}
			return t(
				'assignment/views/assignment-overview___je-hebt-nog-geen-opdrachten-gearchiveerd'
			);
		}
		// Pupil
		if (activeView === 'assignments') {
			return t(
				'assignment/views/assignment-overview___je-hebt-nog-geen-opdrachten-ontvangen-van-je-leerkracht'
			);
		}
		return t('assignment/views/assignment-overview___er-zijn-nog-geen-opdrachten-verlopen');
	};

	const getEmptyFallbackDescription = () => {
		if (canEditAssignments) {
			// Teacher
			if (activeView === 'assignments') {
				return t(
					'assignment/views/assignment-overview___beschrijving-hoe-een-opdracht-aan-te-maken'
				);
			}
			return t(
				'assignment/views/assignment-overview___beschrijving-gearchiveerde-opdrachten-in-werkruimte'
			);
		}
		// Pupil
		if (activeView === 'assignments') {
			return t(
				'assignment/views/assignment-overview___beschrijving-opdrachten-in-werkruimte-voor-leerling'
			);
		}
		return t(
			'assignment/views/assignment-overview___beschrijving-verlopen-opdrachten-in-werkruimte-voor-leerling'
		);
	};

	const getEmptyFallbackIcon = (): IconName => {
		if (canEditAssignments) {
			// Teacher
			if (activeView === 'assignments') {
				return 'clipboard';
			}
			return 'archive';
		}
		// Pupil
		if (activeView === 'assignments') {
			return 'clipboard';
		}
		return 'clock';
	};

	const renderEmptyFallback = () => (
		<>
			{renderHeader()}
			<ErrorView icon={getEmptyFallbackIcon()} message={getEmptyFallbackTitle()}>
				<p>{getEmptyFallbackDescription()}</p>
				{canEditAssignments && (
					<Spacer margin="top">
						<Button
							type="primary"
							icon="search"
							label={t(
								'assignment/views/assignment-overview___zoek-een-fragment-of-collectie-en-maak-je-eerste-opdracht'
							)}
							onClick={onClickCreate}
						/>
					</Spacer>
				)}
			</ErrorView>
		</>
	);

	const renderAssignmentsView = () => {
		if (!assignments) {
			return null;
		}
		if (!assignments.length) {
			return renderEmptyFallback();
		}
		return (
			<>
				{renderHeader()}
				<Table
					columns={columns}
					data={assignments}
					emptyStateMessage={
						filterString
							? t(
									'assignment/views/assignment-overview___er-zijn-geen-opdrachten-die-voldoen-aan-de-zoekopdracht'
							  )
							: activeView === 'archived_assignments'
							? t(
									'assignment/views/assignment-overview___er-zijn-nog-geen-opdrachten-gearchiveerd'
							  )
							: t(
									'assignment/views/assignment-overview___er-zijn-nog-geen-opdrachten-aangemaakt'
							  )
					}
					renderCell={(rowData: Avo.Assignment.Assignment, colKey: string) =>
						renderCell(rowData, colKey as AssignmentOverviewTableColumns)
					}
					rowKey="id"
					variant="styled"
					onColumnClick={(columnId) =>
						handleColumnClick(columnId as AssignmentOverviewTableColumns)
					}
					sortColumn={sortColumn}
					sortOrder={sortOrder}
					useCards={isMobileWidth()}
				/>
				<Spacer margin="top-large">
					<Pagination
						pageCount={Math.ceil(assignmentCount / ITEMS_PER_PAGE)}
						currentPage={page}
						onPageChange={setPage}
					/>
				</Spacer>

				<DeleteObjectModal
					title={t(
						'assignment/views/assignment-overview___ben-je-zeker-dat-je-deze-opdracht-wil-verwijderen'
					)}
					body={t(
						'assignment/views/assignment-overview___deze-actie-kan-niet-ongedaan-gemaakt-worden'
					)}
					isOpen={isDeleteAssignmentModalOpen}
					onClose={handleDeleteModalClose}
					deleteObjectCallback={() =>
						deleteCurrentAssignment(get(markedAssignment, 'id', null))
					}
				/>

				<InputModal
					title={t('assignment/views/assignment-overview___dupliceer-taak')}
					inputLabel={t(
						'assignment/views/assignment-overview___geef-de-nieuwe-taak-een-naam'
					)}
					inputValue={get(markedAssignment, 'title', '')}
					inputPlaceholder={t(
						'assignment/views/assignment-overview___titel-van-de-nieuwe-taak'
					)}
					isOpen={isDuplicateAssignmentModalOpen}
					onClose={handleDuplicateModalClose}
					inputCallback={(newTitle: string) =>
						attemptDuplicateAssignment(newTitle, markedAssignment)
					}
					emptyMessage={t(
						'assignment/views/assignment-overview___gelieve-een-opdracht-titel-in-te-vullen'
					)}
				/>
			</>
		);
	};

	return canEditAssignments !== null ? (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={assignments}
			render={renderAssignmentsView}
		/>
	) : null;
};

export default AssignmentOverview;
