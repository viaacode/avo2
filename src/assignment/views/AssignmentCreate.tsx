import { isEmpty, isNil } from 'lodash-es';
import queryString from 'query-string';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Container,
	Form,
	FormGroup,
	Icon,
	Navbar,
	Spacer,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { RichEditorState } from '@viaa/avo2-components/dist/esm/wysiwyg';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileId } from '../../authentication/helpers/get-profile-id';
import { getProfileName } from '../../authentication/helpers/get-profile-info';
import { PermissionName } from '../../authentication/helpers/permission-names';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import {
	checkPermissions,
	InteractiveTour,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../shared/components';
import { ROUTE_PARTS } from '../../shared/constants';
import {
	buildLink,
	copyToClipboard,
	CustomError,
	navigate,
	sanitizeHtml,
} from '../../shared/helpers';
import { ToastService } from '../../shared/services';
import { trackEvents } from '../../shared/services/event-logging-service';
import { ASSIGNMENTS_ID } from '../../workspace/workspace.const';
import { AssignmentHelper } from '../assignment.helper';
import { AssignmentService } from '../assignment.service';

import './AssignmentEdit.scss';

const AssignmentCreate: FunctionComponent<DefaultSecureRouteProps> = ({
	history,
	location,
	match,
	user,
}) => {
	const [t] = useTranslation();

	const [assignmentContent, setAssignmentContent] = useState<Avo.Assignment.Content | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [assignmentLabels, setAssignmentLabels] = useState<Avo.Assignment.Label[]>([]);
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
				const tempAssignment = initAssignmentsByQueryParams();
				setAssignmentContent(
					await AssignmentService.fetchAssignmentContent(tempAssignment)
				);
				setBothAssignments(tempAssignment);
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

		/**
		 * Get assignment_type, content_id and content_label from query params
		 */
		const initAssignmentsByQueryParams = (): Partial<Avo.Assignment.Assignment> => {
			const queryParams = queryString.parse(location.search);
			let newAssignment: Partial<Avo.Assignment.Assignment> = {};

			if (typeof queryParams.assignment_type === 'string') {
				newAssignment = {
					assignment_type: queryParams.assignment_type as Avo.Assignment.Type,
				};
			}

			if (typeof queryParams.content_id === 'string') {
				newAssignment = {
					...(newAssignment || {}),
					content_id: queryParams.content_id,
				};
			}

			if (typeof queryParams.content_label === 'string') {
				newAssignment = {
					...(newAssignment || {}),
					content_label: queryParams.content_label as Avo.Assignment.ContentLabel,
				};
			}

			if (!newAssignment.assignment_type) {
				throw new CustomError('Failed to create assignment without assignment type');
			}

			return newAssignment;
		};

		checkPermissions(
			PermissionName.CREATE_ASSIGNMENTS,
			user,
			initAssignmentData,
			setLoadingInfo,
			t('assignment/views/assignment-create___je-hebt-geen-rechten-om-een-opdracht-te-maken')
		);
	}, [location, match.params, setLoadingInfo, setAssignmentContent, t, user, setBothAssignments]);

	useEffect(() => {
		if (
			!isEmpty(initialAssignment) &&
			!isEmpty(currentAssignment) &&
			(isNil(currentAssignment.content_id) || !isEmpty(assignmentContent))
		) {
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

		if (currentAssignment.id && user) {
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

			// Convert description editor state to html and store it in the assignment
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

			// Copy content if it's a collection collection if not owned by logged in user
			// so your assignment can work after the other user deletes his collection
			if (
				assignment.content_label === 'COLLECTIE' &&
				(assignmentContent as Avo.Collection.Collection).owner_profile_id !==
					getProfileId(user)
			) {
				const sourceCollection = assignmentContent as Avo.Collection.Collection;
				assignment.content_id = await AssignmentService.duplicateCollectionForAssignment(
					sourceCollection,
					user
				);
			}

			// create => insert into graphql
			const newAssignment: Avo.Assignment.Assignment = {
				...assignment,
				owner_profile_id: getProfileId(user),
			} as Avo.Assignment.Assignment;
			const insertedAssignment = await AssignmentService.insertAssignment(
				newAssignment,
				assignmentLabels
			);

			if (insertedAssignment) {
				setBothAssignments(insertedAssignment);

				trackEvents(
					{
						object: String(assignment.id),
						object_type: 'assignment',
						message: `Gebruiker ${getProfileName(user)} heeft een opdracht aangemaakt`,
						action: 'create',
					},
					user
				);

				ToastService.success(
					t('assignment/views/assignment-edit___de-opdracht-is-succesvol-aangemaakt')
				);
				navigate(history, APP_PATH.ASSIGNMENT_EDIT.route, { id: insertedAssignment.id });
			}
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
			<>
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
											{t(
												'assignment/views/assignment-edit___nieuwe-opdracht'
											)}
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
												onClick={history.goBack}
												label={t(
													'assignment/views/assignment-edit___annuleren'
												)}
											/>
											<Button
												type="primary"
												label={t(
													'assignment/views/assignment-edit___opslaan'
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
					<Container size="small" mode="horizontal">
						<Toolbar autoHeight>
							<ToolbarLeft>
								<ToolbarItem>
									<ButtonToolbar>
										<Button
											type="primary"
											label={t('assignment/views/assignment-edit___opslaan')}
											title={t(
												'assignment/views/assignment-create___sla-de-opdracht-op'
											)}
											onClick={() => saveAssignment(currentAssignment)}
											disabled={isSaving}
										/>
									</ButtonToolbar>
								</ToolbarItem>
							</ToolbarLeft>
						</Toolbar>
					</Container>
				</Container>
			</>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						t('assignment/views/assignment-create___maak-opdracht-pagina-titel')
					)}
				</title>
				<meta
					name="description"
					content={t(
						'assignment/views/assignment-create___maak-opdracht-pagina-beschrijving'
					)}
				/>
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

export default AssignmentCreate;
