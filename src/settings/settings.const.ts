import { ROUTE_PARTS } from '../shared/constants';
import i18n from '../shared/translations/i18n';

export const PROFILE_ID = ROUTE_PARTS.profile;
export const ACCOUNT_ID = ROUTE_PARTS.account;
export const EMAIL_ID = ROUTE_PARTS.email;
export const NOTIFICATIONS_ID = ROUTE_PARTS.notifications;

export type SettingsTab =
	| typeof PROFILE_ID
	| typeof ACCOUNT_ID
	| typeof EMAIL_ID
	| typeof NOTIFICATIONS_ID;

export const GET_NEWSLETTER_LABELS = () => ({
	newsletter: i18n.t(
		'Ik ontvang graag tips en inspiratie voor mijn lessen en nieuws van partners.'
	),
	workshop: i18n.t('Ik wil berichten over workshops en events ontvangen.'),
	ambassador: i18n.t(
		'Ik krijg graag berichten om actief mee te werken aan Het Archief voor Onderwijs.'
	),
});
