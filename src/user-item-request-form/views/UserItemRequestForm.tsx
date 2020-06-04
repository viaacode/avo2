import { get } from 'lodash-es';
import { Tickets } from 'node-zendesk';
import queryString from 'query-string';
import React, { FunctionComponent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { withRouter } from 'react-router';

import {
	BlockHeading,
	Button,
	Checkbox,
	Container,
	FormGroup,
	Spacer,
	Spinner,
	TextArea,
} from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../authentication/helpers/redirects';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import { FileUpload } from '../../shared/components';
import { isPhoto } from '../../shared/components/FileUpload/FileUpload';
import { isMobileWidth } from '../../shared/helpers';
import { sanitizeHtml, sanitizePresets } from '../../shared/helpers/sanitize';
import { ToastService, ZendeskService } from '../../shared/services';

export interface UserItemRequestFormProps extends DefaultSecureRouteProps {}

const UserItemRequestForm: FunctionComponent<UserItemRequestFormProps> = ({ history, user }) => {
	const [t] = useTranslation();

	const [description, setDescription] = useState<string>('');
	const [wantsToUploadAttachment, setWantsToUploadAttachment] = useState<boolean>(false);
	const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const getValidationErrors = (): string[] => {
		const requiredError = t(
			'user-item-request-form/views/user-item-request-form___is-verplicht'
		);
		const errors = [];
		if (!description) {
			errors.push(
				`${t(
					'user-item-request-form/views/user-item-request-form___omschrijving'
				)} ${requiredError}`
			);
		}
		return errors;
	};

	const renderAttachment = () => {
		const filename = get(
			queryString.parse((attachmentUrl || '').split('?').pop() || ''),
			'name',
			t('user-item-request-form/views/user-item-request-form___bestand')
		);
		if (wantsToUploadAttachment && attachmentUrl) {
			if (isPhoto(attachmentUrl)) {
				return `<img src="${attachmentUrl}" alt="Bijlage"/>`;
			}
			return `<a href="${attachmentUrl}">${filename}</a>`;
		}
		return t(
			'user-item-request-form/views/user-item-request-form___er-werd-geen-bijlage-toegevoegd'
		);
	};

	const onSend = async () => {
		let ticket: Tickets.CreateModel | undefined;
		try {
			const errors = getValidationErrors();
			if (errors.length) {
				ToastService.danger(errors);
				return;
			}

			setIsLoading(true);
			// create zendesk ticket
			const body = {
				description,
				firstName: user.first_name,
				lastName: user.last_name,
				email: user.mail,
				organization: get(user, 'profile.organizations', [])
					.map((org: { label: string }) => org.label)
					.join(', '),
				subjects: get(user, 'profile.subjects', []).join(', '),
				educationLevels: get(user, 'profile.educationLevels', []).join(', '),
			};
			ticket = {
				comment: {
					url: window.location.href,
					body: JSON.stringify(body),
					html_body: `<dl>
  <dt><Trans i18nKey="user-item-request-form/views/user-item-request-form___bericht">Bericht</Trans></dt><dd>${
		body.description
  }</dd>
  <dt><Trans i18nKey="user-item-request-form/views/user-item-request-form___bijlage">Bijlage</Trans></dt><dd>${renderAttachment()}</dd>
  <dt><Trans i18nKey="authentication/views/registration-flow/r-4-manual-registration___voornaam">Voornaam</Trans></dt><dd>${
		body.firstName
  }</dd>
  <dt><Trans i18nKey="authentication/views/registration-flow/r-4-manual-registration___achternaam">Achternaam</Trans></dt><dd>${
		body.lastName
  }</dd>
  <dt><Trans i18nKey="authentication/views/registration-flow/r-4-manual-registration___email">Email</Trans></dt><dd>${
		body.email
  }</dd>
  <dt><Trans i18nKey="authentication/views/registration-flow/r-4-manual-registration___school-of-organisatie">School of organisatie</Trans></dt><dd>${
		body.organization
  }</dd>
  <dt><Trans i18nKey="user-item-request-form/views/user-item-request-form___vakken">Vakken</Trans></dt><dd>${
		body.subjects
  }</dd>
  <dt><Trans i18nKey="user-item-request-form/views/user-item-request-form___onderwijsniveaus">Onderwijsniveaus</Trans></dt><dd>${
		body.educationLevels
  }</dd>
</dl>`,
					public: false,
				},
				subject: t(
					'user-item-request-form/views/user-item-request-form___gebruikersaanvraag-item'
				),
			};
			await ZendeskService.createTicket(ticket);
			ToastService.success(
				t(
					'authentication/views/registration-flow/r-4-manual-registration___je-aanvraag-is-verstuurt'
				)
			);
			redirectToClientPage(APP_PATH.USER_ITEM_REQUEST_FORM_CONFIRM.route, history);
		} catch (err) {
			console.error('Failed to create zendesk ticket', err, ticket);
			ToastService.danger(
				t(
					'user-item-request-form/views/user-item-request-form___het-versturen-van-je-aanvraag-is-mislukt'
				)
			);
		}
		setIsLoading(false);
	};

	const renderForm = () => {
		return (
			<>
				<Spacer margin="bottom-large">
					<Button
						type="secondary"
						onClick={history.goBack}
						label={t(
							'authentication/views/registration-flow/r-4-manual-registration___terug'
						)}
						title={t(
							'user-item-request-form/views/user-item-request-form___keer-terug-naar-het-stamboek-scherm'
						)}
						ariaLabel={t(
							'user-item-request-form/views/user-item-request-form___keer-terug-naar-het-stamboek-scherm'
						)}
					/>
				</Spacer>
				<BlockHeading type="h2">
					<Trans i18nKey="user-item-request-form/views/user-item-request-form___niet-gevonden-wat-je-zocht-vraag-het-aan">
						Niet gevonden wat je zocht? Vraag het aan!
					</Trans>
				</BlockHeading>
				<p
					dangerouslySetInnerHTML={{
						__html: sanitizeHtml(
							t(
								'user-item-request-form/views/user-item-request-form___vul-onderstaand-formulier-in'
							),
							sanitizePresets.link
						),
					}}
				/>
				<Container mode="vertical">
					<p
						dangerouslySetInnerHTML={{
							__html: sanitizeHtml(
								t(
									'user-item-request-form/views/user-item-request-form___omschrijf-je-aanvraag'
								),
								sanitizePresets.link
							),
						}}
					/>
					<FormGroup>
						<TextArea
							id="description"
							value={description}
							onChange={setDescription}
							rows={isMobileWidth() ? 6 : 15}
							placeholder={t(
								'user-item-request-form/views/user-item-request-form___gebruikersaanvraag-beschrijving'
							)}
						/>
					</FormGroup>
					<FormGroup label="" labelFor="attachment">
						<Checkbox
							label={t(
								'user-item-request-form/views/user-item-request-form___ik-wil-een-bijlage-opladen'
							)}
							checked={wantsToUploadAttachment}
							onChange={setWantsToUploadAttachment}
						/>
						{wantsToUploadAttachment && (
							<FileUpload
								assetType="ZENDESK_ATTACHMENT"
								urls={attachmentUrl ? [attachmentUrl] : []}
								onChange={attachments => setAttachmentUrl(attachments[0])}
								ownerId=""
								allowedTypes={[]} // allow all types
								allowMulti={false}
								label={t(
									'user-item-request-form/views/user-item-request-form___selecteer-een-betand-word-excel-max-xxx-mb'
								)}
							/>
						)}
					</FormGroup>
					<Spacer margin={['top', 'bottom-large']}>
						<FormGroup>
							{isLoading ? (
								<Spinner size="large" />
							) : (
								<Button
									type="primary"
									onClick={onSend}
									label={t(
										'user-item-request-form/views/user-item-request-form___aanvraag-indienen'
									)}
								/>
							)}
						</FormGroup>
					</Spacer>
				</Container>
			</>
		);
	};

	return (
		<Container className="c-register-stamboek-view" mode="vertical">
			<Container mode="horizontal" size="large">
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							t(
								'user-item-request-form/views/user-item-request-form___gebruikersaanvraag-pagina-titel'
							)
						)}
					</title>
					<meta
						name="description"
						content={t(
							'user-item-request-form/views/user-item-request-form___gebruikersaanvraag-pagina-beschrijving'
						)}
					/>
				</MetaTags>
				<div className="c-content">{renderForm()}</div>
			</Container>
		</Container>
	);
};

export default withRouter(UserItemRequestForm);
