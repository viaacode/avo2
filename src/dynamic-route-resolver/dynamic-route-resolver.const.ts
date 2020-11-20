import { getEnv } from '../shared/helpers';
import i18n from '../shared/translations/i18n';

export const DYNAMIC_ROUTE_RESOLVER_PATH = Object.freeze({
	ALL_ROUTES: `*`,
});

export const GET_REDIRECTS: () => { [avo1Path: string]: string } = () => ({
	'/frontpage': '/start',
	'/themas.*': '/zoeken',
	'/collecties': '/zoeken',
	'/content/beeldgeletterdheid': '/projecten/beeldgeletterdheid',
	'/content/501-werken-van-de-literaire-canon': '/projecten/501-werken-van-de-literaire-canon',
	'/content/actief-met-archief': '/projecten/actief-met-archief',
	'/content/cultuur-de-spiegel': '/projecten/cultuur-de-spiegel',
	'/user': '/instellingen/profiel',
	'/user/[0-9]+#media': '/werkruimte/collecties',
	'/user/[0-9]+/bundels#media': '/werkruimte/bundels',
	'/user/[0-9]+/watch_later#media': '/werkruimte/bladwijzers',
	'/user/[0-9]+/favourites#media': '/werkruimte/bladwijzers',
	'/cookieverklaring': '/cookiebeleid',
	'/privacyverklaring': '/privacy-voorwaarden',
	'/hulp#.*': '/hulp',
	'/faq': '/faq-lesgever',
	'/faq#.*': '/faq-lesgever',
	'/aanmelden-op-het-archief-voor-onderwijs-met-smartschool': '/faq-lesgever',
	'/aanmelden-op-het-archief-voor-onderwijs-met-klascement': '/faq-lesgever',
	'/wat-zijn-collecties': '/faq-lesgever?item=/faq-lesgever/wat-zijn-collecties',
	'/alles-over-collecties': '/faq-lesgever?item=/faq-lesgever/wat-zijn-collecties',
	'/barend-van-heusden-aan-het-woord-over-cultuur-de-spiegel':
		'/nieuws/barend-van-heusden-aan-het-woord-over-cultuur-de-spiegel',

	'/klaar.json': `${getEnv('PROXY_URL')}/klaar/klaar.json`,
});

export const GET_ERROR_MESSAGES: () => { [key: string]: string } = () => ({
	DEPUBLISHED_PAGINA: i18n.t(
		'dynamic-route-resolver/dynamic-route-resolver___deze-pagina-is-niet-meer-beschikbaar'
	),
	DEPUBLISHED_EVENT_DETAIL: i18n.t(
		'dynamic-route-resolver/dynamic-route-resolver___dit-event-is-reeds-afgelopen-a-href-workshops-en-events-bekijk-al-onze-events-a'
	),
});
