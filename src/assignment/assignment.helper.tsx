import { History } from 'history';
import { get, isNil } from 'lodash-es';
import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
	Alert,
	Container,
	DatePicker,
	DutchContentType,
	Flex,
	FlexItem,
	Form,
	FormGroup,
	RadioButtonGroup,
	Spacer,
	TextInput,
	Thumbnail,
	Toggle,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { getProfileId } from '../authentication/helpers/get-profile-id';
import { getProfileName } from '../authentication/helpers/get-profile-info';
import { toEnglishContentType } from '../collection/collection.types';
import { APP_PATH } from '../constants';
import { LoadingInfo } from '../shared/components';
import Html from '../shared/components/Html/Html';
import WYSIWYGWrapper from '../shared/components/WYSIWYGWrapper/WYSIWYGWrapper';
import { WYSIWYG_OPTIONS_FULL } from '../shared/constants';
import { navigate } from '../shared/helpers';
import { ToastService } from '../shared/services';
import { trackEvents } from '../shared/services/event-logging-service';
import i18n from '../shared/translations/i18n';

import { CONTENT_LABEL_TO_ROUTE_PARTS } from './assignment.const';
import { AssignmentService } from './assignment.service';
import { AssignmentLayout } from './assignment.types';
import AssignmentLabels from './components/AssignmentLabels';

export class AssignmentHelper {
	public static async attemptDuplicateAssignment(
		newTitle: string,
		assignment: Partial<Avo.Assignment.Assignment>,
		setCurrentAssignment: (assignment: Partial<Avo.Assignment.Assignment>) => void,
		setLoadingInfo: (loadingInfo: LoadingInfo) => void,
		user: Avo.User.User | undefined,
		history: History
	) {
		try {
			if (isNil(assignment.id)) {
				ToastService.danger(
					i18n.t(
						'assignment/assignment___je-kan-een-opdracht-pas-dupliceren-nadat-je-hem-hebt-opgeslagen'
					)
				);
				return;
			}
			if (!user) {
				ToastService.danger(
					i18n.t(
						'assignment/assignment___de-opdracht-kan-niet-gedupliceerd-worden-omdat-je-niet-meer-bent-ingelogd'
					)
				);
				return;
			}
			const duplicatedAssignment = await AssignmentService.duplicateAssignment(
				newTitle,
				assignment,
				user
			);

			trackEvents(
				{
					object: String(assignment.id),
					object_type: 'assignment',
					message: `Gebruiker ${getProfileName(user)} heeft een opdracht gedupliceerd`,
					action: 'copy',
				},
				user
			);

			setCurrentAssignment({});
			setLoadingInfo({ state: 'loading' });

			navigate(history, APP_PATH.ASSIGNMENT_EDIT.route, { id: duplicatedAssignment.id });
			ToastService.success(
				i18n.t(
					'assignment/views/assignment-edit___de-opdracht-is-succesvol-gedupliceerd-u-kijkt-nu-naar-het-duplicaat'
				)
			);
		} catch (err) {
			console.error('Failed to copy the assignment', err);
			ToastService.danger(
				i18n.t('assignment/views/assignment-edit___het-kopieren-van-de-opdracht-is-mislukt')
			);
		}
	}

	private static renderContentLink(
		assignment: Partial<Avo.Assignment.Assignment>,
		content: Avo.Assignment.Content | null,
		user: Avo.User.User
	) {
		const dutchLabel = get(
			content,
			'type.label',
			(assignment.content_label || '').toLowerCase()
		) as DutchContentType;
		const linkContent = (
			<div className="c-box c-box--padding-small">
				<Flex orientation="vertical" center>
					<Spacer margin="right">
						<Thumbnail
							className="m-content-thumbnail"
							category={toEnglishContentType(dutchLabel)}
							src={get(content, 'thumbnail_path') || undefined}
						/>
					</Spacer>
					<FlexItem>
						<div className="c-overline-plus-p">
							{!!content && <p className="c-overline">{dutchLabel}</p>}
							<p>
								{get(content, 'title') ||
									get(content, 'description') ||
									i18n.t(
										'assignment/assignment___de-opdracht-inhoud-is-verwijderd'
									)}
							</p>
						</div>
					</FlexItem>
				</Flex>
			</div>
		);

		if (
			assignment.content_label === 'COLLECTIE' &&
			content &&
			getProfileId(user) !== (content as Avo.Collection.Collection).owner_profile_id
		) {
			// During create we do not allow linking to the collection if you do not own the collection,
			// since we still need to make a copy when the user clicks on "save assignment" button
			return (
				<div
					title={i18n.t(
						'assignment/views/assignment-edit___u-kan-pas-doorklikken-naar-de-collectie-nadat-u-de-opdracht-hebt-aangemaakt'
					)}
				>
					{linkContent}
				</div>
			);
		}

		if (content) {
			return (
				<Link
					to={`/${
						CONTENT_LABEL_TO_ROUTE_PARTS[
							assignment.content_label as Avo.Assignment.ContentLabel
						]
					}/${assignment.content_id}`}
				>
					{linkContent}
				</Link>
			);
		}
		return linkContent;
	}

	private static isDeadlineInThePast(assignment: Partial<Avo.Assignment.Assignment>): boolean {
		return !!assignment.deadline_at && new Date(assignment.deadline_at) < new Date(Date.now());
	}

	private static getContentLayoutOptions() {
		const options = [
			{
				label: i18n.t('assignment/views/assignment-edit___mediaspeler-met-beschrijving'),
				value: AssignmentLayout.PlayerAndText,
			},
			{
				label: i18n.t('assignment/views/assignment-edit___enkel-mediaspeler'),
				value: AssignmentLayout.OnlyPlayer,
			},
		] as any[];
		return options;
	}

	public static renderAssignmentForm(
		assignment: Partial<Avo.Assignment.Assignment>,
		assignmentContent: Avo.Assignment.Content | null,
		assignmentLabels: Avo.Assignment.Label[],
		user: Avo.User.User,
		setAssignmentProp: (
			property: keyof Avo.Assignment.Assignment | 'descriptionRichEditorState',
			value: any
		) => void,
		setAssignmentLabels: (labels: Avo.Assignment.Label[]) => void
	) {
		const now = new Date(Date.now());

		return (
			<Container mode="horizontal" size="small" className="c-assignment-edit">
				<Container mode="vertical" size="large">
					<Form>
						<FormGroup
							required
							label={i18n.t('assignment/views/assignment-edit___titel')}
						>
							<TextInput
								id="title"
								value={assignment.title}
								onChange={(title) => setAssignmentProp('title', title)}
							/>
						</FormGroup>
						<FormGroup
							label={i18n.t('assignment/views/assignment-edit___opdracht')}
							required
						>
							<WYSIWYGWrapper
								id="assignmentDescription"
								initialHtml={assignment.description}
								state={(assignment as any)['descriptionRichEditorState']}
								controls={[...WYSIWYG_OPTIONS_FULL, 'media']}
								fileType="ASSIGNMENT_DESCRIPTION_IMAGE"
								onChange={(newState) =>
									setAssignmentProp('descriptionRichEditorState', newState)
								}
							/>
						</FormGroup>
						<FormGroup label={i18n.t('assignment/views/assignment-edit___inhoud')}>
							{this.renderContentLink(assignment, assignmentContent, user)}
						</FormGroup>
						<FormGroup
							label={i18n.t('assignment/views/assignment-edit___weergave')}
							labelFor="only_player"
						>
							<RadioButtonGroup
								options={AssignmentHelper.getContentLayoutOptions()}
								value={
									isNil(assignment.content_layout)
										? null
										: (assignment.content_layout as any)
								}
								onChange={(value: string) => {
									setAssignmentProp(
										'content_layout',
										value ? parseInt(value, 10) : null
									);
								}}
							/>
						</FormGroup>
						<FormGroup
							label={i18n.t('assignment/views/assignment-edit___klas-of-groep')}
							required
						>
							<TextInput
								id="class_room"
								value={assignment.class_room || ''}
								onChange={(classRoom) => setAssignmentProp('class_room', classRoom)}
							/>
						</FormGroup>
						<FormGroup
							label={i18n.t('assignment/views/assignment-edit___vak-of-project')}
						>
							<AssignmentLabels
								labels={assignmentLabels}
								user={user}
								onChange={setAssignmentLabels}
							/>
						</FormGroup>
						<FormGroup
							label={i18n.t('assignment/views/assignment-edit___antwoorden-op')}
							labelFor="answer_url"
						>
							<TextInput
								id="answer_url"
								type="text"
								placeholder={i18n.t('assignment/views/assignment-edit___http')}
								value={assignment.answer_url || ''}
								onChange={(value) => setAssignmentProp('answer_url', value)}
							/>
							<p className="c-form-help-text">
								<Trans i18nKey="assignment/views/assignment-edit___waar-geeft-de-leerling-de-antwoorden-in-voeg-een-optionele-url-naar-een-ander-platform-toe">
									Waar geeft de leerling de antwoorden in? Voeg een optionele URL
									naar een ander platform toe.
								</Trans>
							</p>
						</FormGroup>
						<FormGroup
							label={i18n.t('assignment/views/assignment-edit___beschikbaar-vanaf')}
						>
							<Flex>
								<DatePicker
									value={
										assignment.available_at
											? new Date(assignment.available_at)
											: now
									}
									onChange={(value: Date | null) =>
										setAssignmentProp(
											'available_at',
											value ? value.toISOString() : null
										)
									}
									showTimeInput
								/>
							</Flex>
						</FormGroup>
						<FormGroup
							label={i18n.t('assignment/views/assignment-edit___deadline')}
							required
						>
							<Flex>
								<Spacer margin="right-small">
									<DatePicker
										value={
											assignment.deadline_at
												? new Date(assignment.deadline_at)
												: null
										}
										onChange={(value) =>
											setAssignmentProp('deadline_at', value)
										}
										showTimeInput
									/>
								</Spacer>
							</Flex>
							{this.isDeadlineInThePast(assignment) ? (
								<div className="c-form-help-text c-form-help-text--error">
									<Trans i18nKey="assignment/views/assignment-edit___de-deadline-ligt-in-het-verleden">
										De deadline ligt in het verleden.
									</Trans>
									<br />
									<Trans i18nKey="assignment/views/assignment-edit___de-leerlingen-zullen-dus-geen-toegang-hebben-tot-deze-opdracht">
										De leerlingen zullen dus geen toegang hebben tot deze
										opdracht
									</Trans>
								</div>
							) : (
								<p className="c-form-help-text">
									<Trans i18nKey="assignment/views/assignment-edit___na-deze-datum-kan-de-leerling-de-opdracht-niet-meer-invullen">
										Na deze datum kan de leerling de opdracht niet meer
										invullen.
									</Trans>
								</p>
							)}
						</FormGroup>
						{assignment.assignment_type === 'BOUW' && (
							<FormGroup
								label={i18n.t('assignment/views/assignment-edit___groepswerk')}
								labelFor="only_player"
							>
								<Toggle
									checked={assignment.is_collaborative}
									onChange={(checked) =>
										setAssignmentProp('is_collaborative', checked)
									}
								/>
							</FormGroup>
						)}
						<hr className="c-hr" />
						<Alert type="info">
							<div className="c-content c-content--no-m">
								<Html
									content={i18n.t(
										'assignment/views/assignment-edit___hulp-nodig-bij-het-maken-van-opdrachten'
									)}
									sanitizePreset={'link'}
								/>
							</div>
						</Alert>
					</Form>
				</Container>
			</Container>
		);
	}
}
