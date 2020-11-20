import { keys } from 'lodash-es';
import React, {
	FunctionComponent,
	Reducer,
	useCallback,
	useEffect,
	useReducer,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps } from 'react-router';

import {
	BlockHeading,
	Button,
	Checkbox,
	CheckboxGroup,
	Container,
	Form,
	FormGroup,
	Spacer,
	Spinner,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { GENERATE_SITE_TITLE } from '../../constants';
import Html from '../../shared/components/Html/Html';
import { convertToNewsletterPreferenceUpdate, CustomError } from '../../shared/helpers';
import { ToastService } from '../../shared/services';
import { CampaignMonitorService } from '../../shared/services/campaign-monitor-service';
import { NewsletterList, ReactAction } from '../../shared/types';
import { GET_NEWSLETTER_LABELS } from '../settings.const';

export interface EmailProps extends RouteComponentProps {
	user: Avo.User.User;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
enum NewsletterPreferencesActionType {
	SET_NEWSLETTER_PREFERENCES = '@@newsletter-preferences/SET_NEWSLETTER_PREFERENCES',
	UPDATE_NEWSLETTER_PREFERENCES = '@@newsletter-preferences/UPDATE_NEWSLETTER_PREFERENCES',
}
/* eslint-enable @typescript-eslint/no-unused-vars */

type NewsletterPreferencesAction = ReactAction<NewsletterPreferencesActionType>;

const INITIAL_NEWSLETTER_PREFERENCES_STATE = (): Avo.Newsletter.Preferences => ({
	newsletter: false,
	workshop: false,
	ambassador: false,
	allActiveUsers: false,
});

const newsletterPreferencesReducer = (
	state: Avo.Newsletter.Preferences,
	action: NewsletterPreferencesAction
) => {
	switch (action.type) {
		case NewsletterPreferencesActionType.SET_NEWSLETTER_PREFERENCES:
			return action.payload;
		case NewsletterPreferencesActionType.UPDATE_NEWSLETTER_PREFERENCES:
			return {
				...state,
				...action.payload,
			};
		default:
			return state;
	}
};

const Email: FunctionComponent<EmailProps> = ({ user }) => {
	const [t] = useTranslation();

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [initialNewsletterPreferences, setInitialNewsletterPreferences] = useState<
		Avo.Newsletter.Preferences
	>(INITIAL_NEWSLETTER_PREFERENCES_STATE());
	const [newsletterPreferences, changeNewsletterPreferences] = useReducer<
		Reducer<Avo.Newsletter.Preferences, NewsletterPreferencesAction>
	>(newsletterPreferencesReducer, INITIAL_NEWSLETTER_PREFERENCES_STATE());

	const newsletterLabels = GET_NEWSLETTER_LABELS();

	const fetchEmailPreferences = useCallback(async () => {
		try {
			const preferences: Avo.Newsletter.Preferences = await CampaignMonitorService.fetchNewsletterPreferences(
				user.mail
			);
			setInitialNewsletterPreferences(preferences);
			changeNewsletterPreferences({
				type: NewsletterPreferencesActionType.SET_NEWSLETTER_PREFERENCES,
				payload: preferences,
			});
		} catch (err) {
			console.error(new CustomError('Failed to retrieve newsletter preferences', err));
			ToastService.danger(
				t(
					'settings/components/email___de-nieuwsbriefvoorkeuren-konden-niet-worden-opgevraagd'
				)
			);
		}
		setIsLoading(false);
	}, [user.mail, t]);

	useEffect(() => {
		fetchEmailPreferences();
	}, [fetchEmailPreferences]);

	const onChangePreference = (preference: Partial<Avo.Newsletter.Preferences>) => {
		changeNewsletterPreferences({
			type: NewsletterPreferencesActionType.UPDATE_NEWSLETTER_PREFERENCES,
			payload: preference,
		});
	};

	const onSavePreferences = async () => {
		try {
			const convertedNewsletterPreferenceUpdate = convertToNewsletterPreferenceUpdate(
				initialNewsletterPreferences,
				newsletterPreferences
			);

			// Only perform update request if there are changes
			if (convertedNewsletterPreferenceUpdate) {
				setIsLoading(true);

				await CampaignMonitorService.updateNewsletterPreferences(
					convertedNewsletterPreferenceUpdate
				);

				setInitialNewsletterPreferences({
					...initialNewsletterPreferences,
					...newsletterPreferences,
				});

				ToastService.success(
					t('settings/components/email___je-voorkeuren-zijn-opgeslagen')
				);
			}
		} catch (err) {
			console.error(new CustomError('Failed to update newsletter preferences', err));

			ToastService.danger(
				t(
					'settings/components/email___de-nieuwsbriefvoorkeuren-konden-niet-worden-geupdatet'
				)
			);
		}

		setIsLoading(false);
	};

	return (
		<Container mode="vertical">
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						t('settings/components/email___nieuwsbrief-voorkeuren-pagina-titel')
					)}
				</title>
				<meta
					name="description"
					content={t(
						'settings/components/email___nieuwsbrief-voorkeuren-pagina-beschrijving'
					)}
				/>
			</MetaTags>
			<Spacer margin="bottom-small">
				<BlockHeading type="h3">
					{t('settings/components/email___e-mail-nieuwsbrief-voorkeuren')}
				</BlockHeading>
			</Spacer>
			<Html
				content={t(
					'settings/components/email___e-mail-nieuwsbrief-voorkeuren-beschrijving'
				)}
			/>
			<Spacer margin="top">
				<Form>
					<FormGroup labelFor="newsletter" required>
						<CheckboxGroup>
							{(keys(newsletterLabels) as any).map(
								(newsletterKey: NewsletterList) => (
									<Checkbox
										key={`newsletter_${newsletterKey}`}
										label={(newsletterLabels as any)[newsletterKey]}
										checked={newsletterPreferences[newsletterKey]}
										onChange={() => {
											onChangePreference({
												[newsletterKey]: !newsletterPreferences[
													newsletterKey
												],
											});
										}}
									/>
								)
							)}
						</CheckboxGroup>
					</FormGroup>
				</Form>
			</Spacer>
			<Spacer margin="top">
				{isLoading ? (
					<Spinner />
				) : (
					<Button label="Opslaan" type="primary" onClick={onSavePreferences} />
				)}
			</Spacer>
		</Container>
	);
};

export default Email;
