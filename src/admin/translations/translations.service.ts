import { get } from 'lodash-es';

import { CustomError } from '../../shared/helpers';
import { ApolloCacheManager, dataService } from '../../shared/services';

import { GET_TRANSLATIONS, UPDATE_TRANSLATIONS } from './translations.gql';

const TRANSLATIONS_RESULT_PATH = 'app_site_variables';

export const fetchTranslations = async (): Promise<any> => {
	try {
		// retrieve translations
		const response = await dataService.query({
			query: GET_TRANSLATIONS,
			fetchPolicy: 'no-cache',
		});

		return get(response, `data.${TRANSLATIONS_RESULT_PATH}`, null);
	} catch (err) {
		// handle error
		const error = new CustomError('Failed to fetch translations', err, {
			query: 'GET_TRANSLATIONS',
		});

		console.error(error);

		throw error;
	}
};

export const updateTranslations = async (name: string, translations: any) => {
	try {
		// update translation by name
		await dataService.mutate({
			mutation: UPDATE_TRANSLATIONS,
			variables: {
				name,
				translations,
			},
			update: ApolloCacheManager.clearTranslations,
		});
	} catch (err) {
		// handle error
		const error = new CustomError('Failed to update translations', err, {
			query: 'UPDATE_TRANSLATIONS',
			variables: {
				name,
				translations,
			},
		});

		console.error(error);

		throw error;
	}
};
