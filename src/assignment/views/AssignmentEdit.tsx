import { get, isEmpty } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Container,
	Dropdown,
	DropdownButton,
	DropdownContent,
	Form,
	FormGroup,
	Icon,
	MenuContent,
	Navbar,
	RichEditorState,
	Spacer,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileName } from '../../authentication/helpers/get-profile-info';
import { PermissionName } from '../../authentication/helpers/permission-service';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import {
	checkPermissions,
	DeleteObjectModal,
	InputModal,
	InteractiveTour,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../shared/components';
import { ROUTE_PARTS } from '../../shared/constants';
import { buildLink, copyToClipboard, sanitizeHtml } from '../../shared/helpers';
import { AssignmentLabelsService, ToastService } from '../../shared/services';
import { trackEvents } from '../../shared/services/event-logging-service';
import { ASSIGNMENTS_ID } from '../../workspace/workspace.const';
import { AssignmentHelper } from '../assignment.helper';
import { AssignmentService } from '../assignment.service';

const AssignmentEdit: FunctionComponent<DefaultSecureRouteProps<{ id: string }>> = ({
	history,
	location,
	match,
	user,
}) => {
	const [t] = useTranslation();

	const [assignmentContent, setAssignmentContent] = useState<Avo.Assignment.Content | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [assignmentLabels, setAssignmentLabels] = useState<Avo.Assignment.Label[]>([]);
	const [isExtraOptionsMenuOpen, setExtraOptionsMenuOpen] = useState<boolean>(false);
	const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
	const [isDuplicateModalOpen, setDuplicateModalOpen] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [currentAssignment, setCurrentAssignment] = useState<Partial<Avo.Assignment.Assignment>>(
		{}
	);
	const [initialAssignment, setInitialAssignment] = useState<Partial<Avo.Assignment.Assignment>>(
		{}
	);

	const setBothAssignments = useCallback(
		(assignment: Partial<Avo.Assignment.Assignment>) => {
			setCurrentAssignment(assignment);
			setInitialAssignment(assignment);
		},
		[setCurrentAssignment, setInitialAssignment]
	);

	/**
	 *  Get query string variables and store them into the assignment state object
	 */
	useEffect(() => {
		const initAssignmentData = async () => {
			try {
				// Determine if this is an edit or create page and initialize or fetch the assignment
				const tempAssignment: Partial<
					Avo.Assignment.Assignment
				> | null = await fetchAssignment(match.params.id);

				if (!tempAssignment) {
					// Something went wrong during init/fetch
					return;
				}

				// Fetch the content if the assignment has content
				const tempAssignmentContent = await AssignmentService.fetchAssignmentContent(
					tempAssignment
				);

				setAssignmentContent(tempAssignmentContent);
				setBothAssignments({
					...tempAssignment,
					title: tempAssignment.title || get(tempAssignmentContent, 'title', ''),
				});
				setAssignmentLabels(
					AssignmentLabelsService.getLabelsFromAssignment(tempAssignment)
				);
			} catch (err) {
				setLoadingInfo({
					state: 'error',
					message: t(
						'assignment/views/assignment-edit___het-ophalen-aanmaken-van-de-opdracht-is-mislukt'
					),
					icon: 'alert-triangle',
				});
			}
		};

		const fetchAssignment = async (
			id: string | number
		): Promise<Avo.Assignment.Assignment | null> => {
			try {
				return await AssignmentService.fetchAssignmentById(id);
			} catch (err) {
				console.error(err);
				setLoadingInfo({
					state: 'error',
					message: t(
						'assignment/views/assignment-edit___het-ophalen-van-de-opdracht-is-mislukt'
					),
					icon: 'alert-triangle',
				});
				return null;
			}
		};

		checkPermissions(
			PermissionName.EDIT_ASSIGNMENTS,
			user,
			initAssignmentData,
			setLoadingInfo,
			t(
				'assignment/views/assignment-edit___je-hebt-geen-rechten-om-deze-opdracht-te-bewerken'
			)
		);
	}, [location, match.params, setLoadingInfo, setAssignmentContent, t, user, setBothAssignments]);

	useEffect(() => {
		if (!isEmpty(initialAssignment) && !isEmpty(currentAssignment)) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [initialAssignment, currentAssignment, assignmentContent]);

	const getAssignmentUrl = (absolute: boolean = true) => {
		return `${absolute ? window.location.origin : ''}/${ROUTE_PARTS.assignments}/${
			currentAssignment.id
		}`;
	};

	const copyAssignmentUrl = () => {
		copyToClipboard(getAssignmentUrl());
		ToastService.success(
			t('assignment/views/assignment-edit___de-url-is-naar-het-klembord-gekopieerd')
		);

		if (currentAssignment.id) {
			trackEvents(
				{
					object: String(currentAssignment.id),
					object_type: 'avo_assignment' as any, // TODO add this object type to the database
					message: `Gebruiker ${getProfileName(user)} heeft de permalink voor opdracht ${
						currentAssignment.id
					} gekopieert`,
					action: 'view',
				},
				user
			);
		}
	};

	const viewAsStudent = () => history.push(getAssignmentUrl(false));

	const archiveAssignment = async (shouldBeArchived: boolean) => {
		try {
			// Use initialAssignment to avoid saving changes the user made, but hasn't explicitly saved yet
			const archivedAssignment: Partial<Avo.Assignment.Assignment> = {
				...initialAssignment,
				is_archived: shouldBeArchived,
			};
			setInitialAssignment(archivedAssignment);

			// Also set the currentAssignment to archived, so if the user saves, the assignment will stay archived
			setCurrentAssignment({
				...currentAssignment,
				is_archived: shouldBeArchived,
			});

			if (await AssignmentService.updateAssignment(archivedAssignment)) {
				ToastService.success(
					shouldBeArchived
						? t('assignment/views/assignment-edit___de-opdracht-is-gearchiveerd')
						: t('assignment/views/assignment-edit___de-opdracht-is-gedearchiveerd')
				);
			}
			// else: assignment was not valid and could not be saved yet
		} catch (err) {
			console.error(err);
			ToastService.danger(
				shouldBeArchived
					? t(
							'assignment/views/assignment-edit___het-archiveren-van-de-opdracht-is-mislukt'
					  )
					: t(
							'assignment/views/assignment-edit___het-dearchiveren-van-de-opdracht-is-mislukt'
					  )
			);
		}
	};

	const handleExtraOptionClicked = async (itemId: 'duplicate' | 'archive' | 'delete') => {
		switch (itemId) {
			case 'duplicate':
				setDuplicateModalOpen(true);
				setExtraOptionsMenuOpen(false);
				break;

			case 'archive':
				archiveAssignment(!initialAssignment.is_archived).then(() => {});
				setExtraOptionsMenuOpen(false);
				break;

			case 'delete':
				setDeleteModalOpen(true);
				setExtraOptionsMenuOpen(false);
				break;
			default:
				return null;
		}
	};

	const setAssignmentProp = (
		property: keyof Avo.Assignment.Assignment | 'descriptionRichEditorState',
		value: any
	) => {
		const newAssignment = {
			...currentAssignment,
			[property]: value,
		};
		setCurrentAssignment(newAssignment);
	};

	const saveAssignment = async (assignment: Partial<Avo.Assignment.Assignment>) => {
		try {
			setIsSaving(true);

			// copy description to assignment
			const descriptionRichEditorState: RichEditorState | undefined = (assignment as any)[
				'descriptionRichEditorState'
			];
			assignment.description = sanitizeHtml(
				descriptionRichEditorState
					? descriptionRichEditorState.toHTML()
					: assignment.description || '',
				'full'
			);
			delete (assignment as any)['descriptionRichEditorState'];

			// edit => update graphql
			await AssignmentService.updateAssignment(
				assignment,
				AssignmentLabelsService.getLabelsFromAssignment(initialAssignment),
				assignmentLabels
			);
			setBothAssignments(assignment);
			ToastService.success(
				t('assignment/views/assignment-edit___de-opdracht-is-succesvol-geupdatet')
			);
			setIsSaving(false);
		} catch (err) {
			console.error(err);
			ToastService.danger(
				t('assignment/views/assignment-edit___het-opslaan-van-de-opdracht-is-mislukt')
			);
			setIsSaving(false);
		}
	};

	const renderAssignmentEditForm = () => {
		return (
			<div className="c-assignment-edit">
				<Navbar autoHeight>
					<Container mode="vertical" background="alt">
						<Container mode="horizontal">
							<Toolbar autoHeight className="c-toolbar--drop-columns-low-mq">
								<ToolbarLeft>
									<ToolbarItem grow>
										<Link
											className="c-return"
											to={buildLink(APP_PATH.WORKSPACE_TAB.route, {
												tabId: ASSIGNMENTS_ID,
											})}
										>
											<Icon name="chevron-left" size="small" type="arrows" />
											<Trans i18nKey="assignment/views/assignment-edit___mijn-opdrachten">
												Mijn opdrachten
											</Trans>
										</Link>
										<BlockHeading className="u-m-0" type="h2">
											{currentAssignment.title}
										</BlockHeading>
										{currentAssignment.id && (
											<Spacer margin="top-small">
												<Form type="inline">
													<FormGroup
														label={t(
															'assignment/views/assignment-edit___url'
														)}
													>
														<TextInput
															value={getAssignmentUrl()}
															disabled
														/>
													</FormGroup>
													<Spacer margin="left-small">
														<Button
															icon="copy"
															type="secondary"
															ariaLabel={t(
																'assignment/views/assignment-edit___kopieer-de-opdracht-url'
															)}
															title={t(
																'assignment/views/assignment-edit___kopieer-de-opdracht-url'
															)}
															onClick={copyAssignmentUrl}
														/>
													</Spacer>
												</Form>
											</Spacer>
										)}
									</ToolbarItem>
								</ToolbarLeft>
								<ToolbarRight>
									<ToolbarItem>
										<ButtonToolbar>
											<Button
												type="secondary"
												onClick={viewAsStudent}
												label={t(
													'assignment/views/assignment-edit___bekijk-als-leerling'
												)}
												title={t(
													'assignment/views/assignment-edit___bekijk-de-opdracht-zoals-een-leerling-die-zal-zien'
												)}
											/>
											<Dropdown
												isOpen={isExtraOptionsMenuOpen}
												menuWidth="fit-content"
												onOpen={() => setExtraOptionsMenuOpen(true)}
												onClose={() => setExtraOptionsMenuOpen(false)}
												placement="bottom-end"
											>
												<DropdownButton>
													<Button
														type="secondary"
														icon="more-horizontal"
														ariaLabel={t(
															'assignment/views/assignment-edit___meer-opties'
														)}
														title={t(
															'assignment/views/assignment-edit___meer-opties'
														)}
													/>
												</DropdownButton>
												<DropdownContent>
													<MenuContent
														menuItems={[
															{
																icon: 'copy',
																id: 'duplicate',
																label: t(
																	'assignment/views/assignment-edit___dupliceer'
																),
															},
															{
																icon: 'archive',
																id: 'archive',
																label: initialAssignment.is_archived
																	? t(
																			'assignment/views/assignment-edit___dearchiveer'
																	  )
																	: t(
																			'assignment/views/assignment-edit___archiveer'
																	  ),
															},
															{
																icon: 'delete',
																id: 'delete',
																label: t(
																	'assignment/views/assignment-edit___verwijder'
																),
															},
														]}
														onClick={id =>
															handleExtraOptionClicked(
																id.toString() as any
															)
														}
													/>
												</DropdownContent>
											</Dropdown>
											<Button
												type="primary"
												label={t(
													'assignment/views/assignment-edit___opslaan'
												)}
												title={t(
													'assignment/views/assignment-edit___sla-de-opdracht-op'
												)}
												onClick={() => saveAssignment(currentAssignment)}
												disabled={isSaving}
											/>
											<InteractiveTour showButton />
										</ButtonToolbar>
									</ToolbarItem>
								</ToolbarRight>
							</Toolbar>
						</Container>
					</Container>
				</Navbar>
				{AssignmentHelper.renderAssignmentForm(
					currentAssignment,
					assignmentContent,
					assignmentLabels,
					user,
					setAssignmentProp,
					setAssignmentLabels
				)}
				<Container background="alt" mode="vertical">
					<Container mode="horizontal">
						<Toolbar autoHeight>
							<ToolbarRight>
								<ToolbarItem>
									<ButtonToolbar>
										<Button
											type="primary"
											label={t('assignment/views/assignment-edit___opslaan')}
											title={t(
												'assignment/views/assignment-edit___sla-de-opdracht-op'
											)}
											onClick={() => saveAssignment(currentAssignment)}
											disabled={isSaving}
										/>
									</ButtonToolbar>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</Container>
				</Container>

				<DeleteObjectModal
					title={t(
						'assignment/views/assignment-edit___ben-je-zeker-dat-je-deze-opdracht-wil-verwijderen'
					)}
					body={t(
						'assignment/views/assignment-edit___deze-actie-kan-niet-ongedaan-gemaakt-worden'
					)}
					isOpen={isDeleteModalOpen}
					onClose={() => setDeleteModalOpen(false)}
					deleteObjectCallback={() =>
						AssignmentHelper.deleteCurrentAssignment(currentAssignment, history)
					}
				/>

				<InputModal
					title={t('assignment/views/assignment-edit___dupliceer-taak')}
					inputLabel={t(
						'assignment/views/assignment-edit___geef-de-nieuwe-taak-een-naam'
					)}
					inputValue={currentAssignment.title}
					inputPlaceholder={t(
						'assignment/views/assignment-edit___titel-van-de-nieuwe-taak'
					)}
					isOpen={isDuplicateModalOpen}
					onClose={() => setDuplicateModalOpen(false)}
					inputCallback={(newTitle: string) =>
						AssignmentHelper.attemptDuplicateAssignment(
							newTitle,
							currentAssignment,
							setCurrentAssignment,
							setLoadingInfo,
							user,
							history
						)
					}
					emptyMessage={t(
						'assignment/views/assignment-edit___gelieve-een-opdracht-titel-in-te-geven'
					)}
				/>
			</div>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						get(
							currentAssignment,
							'title',
							t(
								'assignment/views/assignment-edit___collectie-bewerken-pagina-titel-fallback'
							)
						)
					)}
				</title>
				<meta name="description" content={get(currentAssignment, 'description') || ''} />
			</MetaTags>
			<LoadingErrorLoadedComponent
				dataObject={currentAssignment}
				render={renderAssignmentEditForm}
				loadingInfo={loadingInfo}
				notFoundError={t('assignment/views/assignment-edit___de-opdracht-is-niet-gevonden')}
			/>
		</>
	);
};

export default AssignmentEdit;
