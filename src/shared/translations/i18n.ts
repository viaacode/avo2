import I18n from 'i18next';
import XHR from 'i18next-xhr-backend';
import { lowerCase, upperFirst } from 'lodash-es';
import { initReactI18next } from 'react-i18next';

import { getEnv } from '../helpers';

let resolveTranslations: () => void | undefined;
export const waitForTranslations = new Promise((resolve) => {
	resolveTranslations = resolve;
});

I18n.use(XHR)
	.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		backend: {
			loadPath: `${getEnv('PROXY_URL')}/translations/nl.json`,
			parse: (data: any) => {
				setTimeout(() => {
					resolveTranslations();
				}, 0);
				return JSON.parse(data).value;
			},
		},
		debug: false,
		keySeparator: '^',
		nsSeparator: '^',
		lng: 'nl',
		fallbackLng: 'nl',
		interpolation: {
			escapeValue: false,
		},
		initImmediate: true,
		react: {
			useSuspense: false,
		},
		parseMissingKeyHandler: (key) => {
			if (key.includes('___')) {
				return `${upperFirst(lowerCase(key.split('___').pop()))} ***`;
			}
			return `${key} ***`;
		},
	});

export default I18n;
