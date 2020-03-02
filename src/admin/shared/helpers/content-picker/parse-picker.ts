import queryString from 'query-string';

import { ToastService } from '../../../../shared/services';
import i18n from '../../../../shared/translations/i18n';

import { ContentPickerType, PickerItem } from '../../types';

const parseSearchQuery = (input: string): string => {
	try {
		// replace %22 by "
		const replacedString = decodeURI(input);

		// split on first instance of ?
		const splitString = replacedString.includes('?')
			? replacedString
					.split('?')
					.slice(1)
					.join('?')
			: replacedString;

		// parse as objects

		const output = queryString.parse(splitString);
		output.filters = JSON.parse(output.filters as string);

		return JSON.stringify(output);
	} catch (err) {
		console.error('Failed to parse search query input', err);
		ToastService.danger(
			i18n.t(
				'admin/shared/helpers/content-picker/parse-picker___gelieve-een-correcte-zoekfilter-link-in-te-vullen'
			),
			false
		);

		return 'Ongeldige zoekfilter';
	}
};

export const parsePickerItem = (type: ContentPickerType, value: string): PickerItem => ({
	type,
	value: type === 'SEARCH_QUERY' ? parseSearchQuery(value) : value,
});
