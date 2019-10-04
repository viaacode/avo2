import { useMutation } from '@apollo/react-hooks';
import { ApolloQueryResult } from 'apollo-boost';
import { DocumentNode } from 'graphql';
import { cloneDeep, get, remove } from 'lodash-es';
import queryString from 'query-string';
import React, { Fragment, FunctionComponent, MouseEvent, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import {
	Alert,
	Button,
	Container,
	DatePicker,
	Dropdown,
	DropdownButton,
	DropdownContent,
	Flex,
	FlexItem,
	Form,
	FormGroup,
	Icon,
	MenuContent,
	RadioButton,
	RadioButtonGroup,
	Spacer,
	Spinner,
	TagOption,
	TextInput,
	Thumbnail,
	Toggle,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
	WYSIWYG,
} from '@viaa/avo2-components';
import { ContentType } from '@viaa/avo2-components/dist/types';

import NotFound from '../../404/views/NotFound';
import { GET_COLLECTION_BY_ID } from '../../collection/graphql';
import { dutchContentLabelToEnglishLabel, DutchContentType } from '../../collection/types';
import { RouteParts } from '../../constants';
import { GET_ITEM_BY_ID } from '../../item/item.gql';
import { renderDropdownButton } from '../../shared/components/CheckboxDropdownModal/CheckboxDropdownModal';
import DeleteObjectModal from '../../shared/components/modals/DeleteObjectModal';
import InputModal from '../../shared/components/modals/InputModal';
import { copyToClipboard } from '../../shared/helpers/clipboard';
import { dataService } from '../../shared/services/data-service';
import toastService, { TOAST_TYPE } from '../../shared/services/toast-service';
import {
	DELETE_ASSIGNMENT,
	GET_ASSIGNMENT_BY_ID,
	INSERT_ASSIGNMENT,
	UPDATE_ASSIGNMENT,
} from '../graphql';
import { deleteAssignment, insertAssignment, updateAssignment } from '../services';
import {
	Assignment,
	AssignmentContent,
	AssignmentContentLabel,
	AssignmentLayout,
	AssignmentTag,
	AssignmentType,
} from '../types';
import './EditAssignment.scss';

const CONTENT_LABEL_TO_ROUTE_PARTS: { [contentType in AssignmentContentLabel]: string } = {
	ITEM: RouteParts.Item,
	COLLECTIE: RouteParts.Collection,
	ZOEKOPDRACHT: RouteParts.SearchQuery,
};

const CONTENT_LABEL_TO_QUERY: {
	[contentType in AssignmentContentLabel]: { query: DocumentNode; resultPath: string }
} = {
	COLLECTIE: {
		query: GET_COLLECTION_BY_ID,
		resultPath: 'app_collections[0]',
	},
	ITEM: {
		query: GET_ITEM_BY_ID,
		resultPath: 'app_item_meta[0]',
	},
	ZOEKOPDRACHT: {
		// TODO implement search query saving and usage
		// query: GET_SEARCH_QUERY_BY_ID,
		// resultPath: 'app_item_meta[0]',
	} as any,
};

interface EditAssignmentProps extends RouteComponentProps {}

// https://medium.com/@divyabiyani26/react-hooks-with-closures-usestate-v-s-usereducer-9e0c20e81051
let currentAssignment: Partial<Assignment>;
let setCurrentAssignment: (newAssignment: any) => void;
let initialAssignment: Partial<Assignment>;
let setInitialAssignment: (newAssignment: any) => void;

const EditAssignment: FunctionComponent<EditAssignmentProps> = ({ history, location, match }) => {
	[currentAssignment, setCurrentAssignment] = useState<Partial<Assignment>>({
		content_layout: AssignmentLayout.PlayerAndText,
	});
	[initialAssignment, setInitialAssignment] = useState<Partial<Assignment>>({
		content_layout: AssignmentLayout.PlayerAndText,
	});
	const [pageType, setPageType] = useState<'create' | 'edit' | undefined>();
	const [assignmentContent, setAssignmentContent] = useState<AssignmentContent | undefined>(
		undefined
	);
	const [loadingState, setLoadingState] = useState<'loaded' | 'loading' | 'not-found'>('loading');
	const [tagsDropdownOpen, setTagsDropdownOpen] = useState<boolean>(false);
	const [isExtraOptionsMenuOpen, setExtraOptionsMenuOpen] = useState<boolean>(false);
	const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
	const [isDuplicateModalOpen, setDuplicateModalOpen] = useState<boolean>(false);
	const [triggerAssignmentDelete] = useMutation(DELETE_ASSIGNMENT);
	const [triggerAssignmentInsert] = useMutation(INSERT_ASSIGNMENT);
	const [triggerAssignmentUpdate] = useMutation(UPDATE_ASSIGNMENT);

	const setBothAssignments = (assignment: Partial<Assignment>) => {
		setCurrentAssignment(assignment);
		setInitialAssignment(assignment);
	};

	/**
	 * Get query string variables and store them into the assignment state object
	 */
	useEffect(() => {
		// Determine if this is an edit or create page
		if (location.pathname.includes(RouteParts.Create)) {
			setPageType('create');

			// Get assignment_type, content_id and content_label from query params
			const queryParams = queryString.parse(location.search);
			let newAssignment: Partial<Assignment> | undefined;
			if (typeof queryParams.assignment_type === 'string') {
				newAssignment = {
					assignment_type: queryParams.assignment_type as AssignmentType,
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
					content_label: queryParams.content_label as AssignmentContentLabel,
				};
			}

			setBothAssignments({
				...(currentAssignment || {}),
				...newAssignment,
			});
		} else {
			setPageType('edit');

			// Get the assigment from graphql
			dataService
				.query({
					query: GET_ASSIGNMENT_BY_ID,
					variables: { id: (match.params as any).id },
				})
				.then((response: ApolloQueryResult<AssignmentContent>) => {
					const assignmentResponse: Assignment | undefined = get(
						response,
						'data.app_assignments[0]'
					);
					if (!assignmentResponse) {
						toastService(
							'Het ophalen van de opdracht inhoud is mislukt (leeg antwoord)',
							TOAST_TYPE.DANGER
						);
						setLoadingState('not-found');
						return;
					}
					setBothAssignments(assignmentResponse);
					setLoadingState('loaded');
				})
				.catch((err: any) => {
					console.error(err);
					toastService('Het ophalen van de opdracht inhoud is mislukt', TOAST_TYPE.DANGER);
					setLoadingState('not-found');
				});
		}
	}, [location, match.params]);

	/**
	 * Load the content if the query params change
	 */
	useEffect(() => {
		if (currentAssignment.assignment_type) {
			if (currentAssignment.content_id && currentAssignment.content_label) {
				dataService
					.query({
						query: CONTENT_LABEL_TO_QUERY[currentAssignment.content_label].query,
						variables: { id: currentAssignment.content_id },
					})
					.then((response: ApolloQueryResult<AssignmentContent>) => {
						const assignmentContent = get(
							response,
							`data.${
								CONTENT_LABEL_TO_QUERY[currentAssignment.content_label as AssignmentContentLabel]
									.resultPath
							}`
						);
						if (!assignmentContent) {
							toastService(
								'Het ophalen van de opdracht inhoud is mislukt (leeg antwoord)',
								TOAST_TYPE.DANGER
							);
							setLoadingState('not-found');
							return;
						}
						setAssignmentContent(assignmentContent);
						setBothAssignments({
							...currentAssignment,
							title:
								currentAssignment.title || (assignmentContent && assignmentContent.title) || '',
						});
						setLoadingState('loaded');
					})
					.catch((err: any) => {
						console.error(err);
						toastService('Het ophalen van de opdracht inhoud is mislukt', TOAST_TYPE.DANGER);
						setLoadingState('not-found');
					});
			} else {
				setLoadingState('loaded');
			}
		}
	}, [setLoadingState]);

	const deleteCurrentAssignment = async () => {
		try {
			if (typeof currentAssignment.id === 'undefined') {
				toastService('De huidige opdracht is nog nooit opgeslagen (geen id)', TOAST_TYPE.DANGER);
				return;
			}
			await deleteAssignment(triggerAssignmentDelete, currentAssignment.id);
			history.push(`/${RouteParts.MyWorkspace}/${RouteParts.Assignments}`);
			toastService('De opdracht is verwijdert', TOAST_TYPE.SUCCESS);
		} catch (err) {
			console.error(err);
			toastService('Het verwijderen van de opdracht is mislukt', TOAST_TYPE.DANGER);
		}
	};

	const getAssignmentUrl = () => {
		return `${window.location.origin}/${RouteParts.Assignment}/${currentAssignment.id}`;
	};

	const copyAssignmentUrl = () => {
		copyToClipboard(getAssignmentUrl());
		toastService('De url is naar het klembord gekopieert', TOAST_TYPE.SUCCESS);
	};

	const viewAsStudent = () => {
		window.open(getAssignmentUrl(), '_blank');
	};

	const archiveAssignment = async (shouldBeArchived: boolean) => {
		try {
			// Use initialAssignment to avoid saving changes the user made, but hasn't explicitly saved yet
			const archivedAssigment: Partial<Assignment> = {
				...initialAssignment,
				is_archived: shouldBeArchived,
			};
			setInitialAssignment(archivedAssigment);

			// Also set the currentAssignment to archived, so if the user saves, the assignment will stay archived
			setCurrentAssignment({
				...currentAssignment,
				is_archived: shouldBeArchived,
			});
			if (await updateAssignment(triggerAssignmentUpdate, archivedAssigment)) {
				toastService(
					`De opdracht is ge${shouldBeArchived ? '' : 'de'}archiveerd`,
					TOAST_TYPE.SUCCESS
				);
			}
			// else: assignment was not valid and could not be saved yet
		} catch (err) {
			console.error(err);
			toastService(
				`Het ${shouldBeArchived ? '' : 'de'}archiveren van de opdracht is mislukt`,
				TOAST_TYPE.DANGER
			);
		}
	};

	const duplicateAssignment = async (newTitle: string) => {
		try {
			const duplicateAssignment = cloneDeep(initialAssignment);
			delete duplicateAssignment.id;
			duplicateAssignment.title = newTitle;
			const assigment = await insertAssignment(triggerAssignmentInsert, duplicateAssignment);
			if (!assigment) {
				return; // assignment was not valid
			}
			history.push(
				`/${RouteParts.MyWorkspace}/${RouteParts.Assignments}/${assigment.id}/${RouteParts.Edit}`
			);
			toastService(
				'De opdracht is succesvol gedupliceerd. U kijk nu naar het duplicaat',
				TOAST_TYPE.SUCCESS
			);
		} catch (err) {
			console.error(err);
			toastService('Het dupliceren van de opdracht is mislukt', TOAST_TYPE.DANGER);
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

	const setAssignmentProp = (property: keyof Assignment, value: any) => {
		const newAssignment = {
			...currentAssignment,
			[property]: value,
		};
		setCurrentAssignment(newAssignment);
	};

	const saveAssignment = async (assignment: Partial<Assignment>) => {
		try {
			if (pageType === 'create') {
				// create => insert into graphql
				await insertAssignment(triggerAssignmentInsert, assignment);
				setBothAssignments(assignment);
				toastService('De opdracht is succesvol aangemaakt', TOAST_TYPE.SUCCESS);
			} else {
				// edit => update graphql
				await updateAssignment(triggerAssignmentUpdate, assignment);
				setBothAssignments(assignment);
				toastService('De opdracht is succesvol geupdate', TOAST_TYPE.SUCCESS);
			}
		} catch (err) {
			console.error(err);
			toastService('Het opslaan van de opdracht is mislukt', TOAST_TYPE.DANGER);
		}
	};

	const getTagOptions = (): TagOption[] => {
		return get(currentAssignment, 'assignment_assignment_tags.assignment_tag', []).map(
			(assignmentTag: AssignmentTag) => {
				return {
					label: assignmentTag.label,
					id: assignmentTag.id,
					// assignmentTag.enum_color.label contains hex code (graphql enum quirk)
					// The value of the enum has to be uppercase text, so the value contains the color name
					color: assignmentTag.color_override || assignmentTag.enum_color.label,
				};
			}
		);
	};

	const removeTag = (tagId: string | number, evt: MouseEvent) => {
		evt.stopPropagation();
		const tags: AssignmentTag[] = [
			...get(currentAssignment, 'assignment_assignment_tags.assignment_tag', []),
		];
		remove(tags, (tag: AssignmentTag) => tag.id === tagId);
		setCurrentAssignment({
			...currentAssignment,
			assignment_assignment_tags: {
				assignment_tag: tags,
			},
		});
	};

	const renderTagsDropdown = () => {
		const tags = getTagOptions();

		return (
			<Dropdown
				isOpen={tagsDropdownOpen}
				onOpen={() => setTagsDropdownOpen(true)}
				onClose={() => setTagsDropdownOpen(false)}
				autoSize={true}
			>
				<DropdownButton>
					{renderDropdownButton(tags.length ? '' : 'Geen', false, tags, removeTag)}
				</DropdownButton>
				<DropdownContent>
					<Spacer>
						<Form>
							<Button type="borderless" block label="Geen" />
							<Button type="borderless" block label="Beheer vakken en projecten" />
						</Form>
					</Spacer>
				</DropdownContent>
			</Dropdown>
		);
	};

	const renderEditAssignmentForm = () => (
		<Fragment>
			<Container mode="vertical" background={'alt'}>
				<nav className="c-navbar c-navbar--auto">
					<Container mode="horizontal">
						<Toolbar autoHeight className="c-toolbar--drop-columns-low-mq">
							<ToolbarLeft>
								<ToolbarItem className="c-toolbar__item--grow">
									{/* TODO use grow option from component */}
									<Link
										className="c-return"
										to={`/${RouteParts.MyWorkspace}/${RouteParts.Assignments}`}
									>
										<Icon name="chevron-left" size="small" type="arrows" />
										Mijn opdrachten
									</Link>
									<h2 className="c-h2 u-m-0">
										{pageType === 'create' ? 'Nieuwe opdracht' : currentAssignment.title}
									</h2>
									{currentAssignment.id && (
										<Spacer margin="top-small">
											<Form type="inline">
												<FormGroup label="URL">
													<TextInput value={getAssignmentUrl()} disabled />
												</FormGroup>
												<Spacer margin="left-small">
													<Button
														icon="copy"
														type="secondary"
														ariaLabel="Kopieer de opdracht url"
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
									<div className="c-button-toolbar">
										{pageType === 'create' && (
											<Button type="secondary" onClick={() => history.goBack()} label="Annuleren" />
										)}
										{pageType === 'edit' && (
											<Spacer margin="right-small">
												<Button
													type="secondary"
													onClick={viewAsStudent}
													label="Bekijk als leerling"
												/>
												<Dropdown
													isOpen={isExtraOptionsMenuOpen}
													onOpen={() => setExtraOptionsMenuOpen(true)}
													onClose={() => setExtraOptionsMenuOpen(false)}
													placement="bottom-end"
													autoSize
												>
													<DropdownButton>
														<Button
															type="secondary"
															icon="more-horizontal"
															ariaLabel="Meer opties"
															title="Meer opties"
														/>
													</DropdownButton>
													<DropdownContent>
														<MenuContent
															menuItems={[
																{ icon: 'copy', id: 'duplicate', label: 'Dupliceer' },
																{
																	icon: 'archive',
																	id: 'archive',
																	label: initialAssignment.is_archived
																		? 'Dearchiveer'
																		: 'Archiveer',
																},
																{ icon: 'delete', id: 'delete', label: 'Verwijder' },
															]}
															onClick={id => handleExtraOptionClicked(id.toString() as any)}
														/>
													</DropdownContent>
												</Dropdown>
											</Spacer>
										)}
										<Button
											type="primary"
											label="Opslaan"
											onClick={() => saveAssignment(currentAssignment)}
										/>
									</div>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</Container>
				</nav>
			</Container>
			<Container mode="horizontal" size="small">
				<Container mode="vertical" size="large">
					<Form>
						<FormGroup required label="Titel">
							<TextInput
								id="title"
								value={currentAssignment.title}
								onChange={title => setAssignmentProp('title', title)}
							/>
						</FormGroup>
						<FormGroup label="Opdracht" required>
							<WYSIWYG
								id="assignmentDescription"
								autogrow
								data={currentAssignment.description}
								onChange={description => setAssignmentProp('description', description)}
							/>
						</FormGroup>
						{assignmentContent && currentAssignment.content_label && (
							<FormGroup label="Inhoud">
								<Link
									to={`/${CONTENT_LABEL_TO_ROUTE_PARTS[currentAssignment.content_label]}/${
										currentAssignment.content_id
									}`}
								>
									<div className="c-box c-box--padding-small">
										<Flex orientation="vertical" center>
											<Spacer margin="right">
												<Thumbnail
													className="m-content-thumbnail"
													category={
														dutchContentLabelToEnglishLabel((currentAssignment.content_label ===
														'ITEM'
															? assignmentContent.type.label
															: currentAssignment.content_label) as DutchContentType) as ContentType
													}
													src={assignmentContent.thumbnail_path || undefined}
												/>
												{/*TODO use stills api to get thumbnail*/}
											</Spacer>
											<FlexItem>
												<div className="c-overline-plus-p">
													<p className="c-overline">
														{currentAssignment.content_label === 'ITEM'
															? assignmentContent.type.label
															: currentAssignment.content_label}
													</p>
													<p>{assignmentContent.title || assignmentContent.description}</p>
												</div>
											</FlexItem>
										</Flex>
									</div>
								</Link>
							</FormGroup>
						)}
						<FormGroup label="Weergave" labelFor="only_player">
							<RadioButtonGroup>
								<RadioButton
									label="Weergeven als mediaspeler met tekst"
									name="content_layout"
									value={String(AssignmentLayout.PlayerAndText)}
									checked={currentAssignment.content_layout === AssignmentLayout.PlayerAndText}
									onChange={isChecked =>
										isChecked && setAssignmentProp('content_layout', AssignmentLayout.PlayerAndText)
									}
								/>
								<RadioButton
									label="Weergeven als enkel mediaspeler"
									name="content_layout"
									value={String(AssignmentLayout.OnlyPlayer)}
									checked={currentAssignment.content_layout === AssignmentLayout.OnlyPlayer}
									onChange={isChecked =>
										isChecked && setAssignmentProp('content_layout', AssignmentLayout.OnlyPlayer)
									}
								/>
							</RadioButtonGroup>
						</FormGroup>
						<FormGroup label="Vak of project">{renderTagsDropdown()}</FormGroup>
						<FormGroup label="Antwoorden op" labelFor="answer_url">
							<TextInput
								id="answer_url"
								type="text"
								placeholder="http://..."
								value={currentAssignment.answer_url || ''}
								onChange={value => setAssignmentProp('answer_url', value)}
							/>
							<p className="c-form-help-text">
								Waar geeft de leerling de antwoorden in? Voeg een optionele URL naar een ander
								platform toe.
							</p>
						</FormGroup>
						<FormGroup label="Beschikbaar vanaf">
							<Flex>
								{/*TODO Replace with DateTimePicker from components*/}
								<DatePicker
									value={
										currentAssignment.available_at ? new Date(currentAssignment.available_at) : null
									}
									onChange={(value: Date | null) =>
										setAssignmentProp('available_at', value ? value.toISOString() : null)
									}
									id="available_at"
								/>
							</Flex>
						</FormGroup>
						<FormGroup label="Deadline" required>
							<Flex>
								<Spacer margin="right-small">
									{/*TODO Replace with DateTimePicker from components*/}
									<DatePicker
										value={
											currentAssignment.deadline_at ? new Date(currentAssignment.deadline_at) : null
										}
										onChange={value => setAssignmentProp('deadline_at', value)}
										id="deadline_at"
									/>
								</Spacer>
							</Flex>
							<p className="c-form-help-text">
								Na deze datum kan de leerling de opdracht niet meer invullen.
							</p>
						</FormGroup>
						{currentAssignment.assignment_type === 'BOUW' && (
							<FormGroup label="Groepswerk?" labelFor="only_player">
								<Toggle
									checked={currentAssignment.is_collaborative}
									onChange={checked => setAssignmentProp('is_collaborative', checked)}
								/>
							</FormGroup>
						)}
						<hr className="c-hr" />
						<Alert type="info">
							<div className="c-content c-content--no-m">
								<p>
									Hulp nodig bij het maken van opdrachten?
									<br />
									Bekijk onze{' '}
									<a href="http://google.com" target="_blank" rel="noopener noreferrer">
										screencast
									</a>
									.
								</p>
							</div>
						</Alert>
					</Form>
				</Container>
			</Container>

			<DeleteObjectModal
				title={`Ben je zeker dat de opdracht "${currentAssignment.title}" wil verwijderen?`}
				body="Deze actie kan niet ongedaan gemaakt worden"
				isOpen={isDeleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				deleteObjectCallback={deleteCurrentAssignment}
			/>

			<InputModal
				title="Dupliceer taak"
				inputLabel="Geef de nieuwe taak een naam:"
				inputValue={currentAssignment.title}
				inputPlaceholder="Titel van de nieuwe taak"
				isOpen={isDuplicateModalOpen}
				onClose={() => setDuplicateModalOpen(false)}
				inputCallback={(newTitle: string) => duplicateAssignment(newTitle)}
			/>
		</Fragment>
	);

	switch (loadingState) {
		case 'loading':
			return (
				<Flex center orientation="horizontal">
					<Spinner size="large" />
				</Flex>
			);

		case 'loaded':
			return renderEditAssignmentForm();

		case 'not-found':
			return <NotFound message="De inhoud voor deze opdracht is niet gevonden" icon="search" />;
	}
};

export default withRouter(EditAssignment);
