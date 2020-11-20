import queryString from 'query-string';

import { ContentPickerType, LinkTarget } from '@viaa/avo2-components';

import { ToastService } from '../../../../../shared/services';
import i18n from '../../../../../shared/translations/i18n';
import { PickerItem } from '../../../types';

export const parseSearchQuery = (input: string): string => {
	try {
		// replace %22 by "
		const replacedString = decodeURI(input);

		// split on first instance of ?
		const splitString = replacedString.includes('?')
			? replacedString.split('?').slice(1).join('?')
			: replacedString;

		// parse as objects
		let filterDefinition: any;
		if (splitString.trim()[0] !== '{') {
			filterDefinition = queryString.parse(splitString);
			filterDefinition.filters = JSON.parse(filterDefinition.filters as string);
		} else {
			filterDefinition = JSON.parse(splitString);
		}

		return JSON.stringify(filterDefinition);
	} catch (err) {
		console.error('Failed to parse search query input', err);
		ToastService.danger(
			i18n.t(
				'admin/shared/helpers/content-picker/parse-picker___gelieve-een-correcte-zoekfilter-link-in-te-vullen'
			)
		);

		return 'Ongeldige zoekfilter';
	}
};

export const parsePickerItem = (
	type: ContentPickerType,
	value: string,
	target: LinkTarget = LinkTarget.Blank
): PickerItem => ({
	type,
	target,
	value: type === 'SEARCH_QUERY' ? parseSearchQuery(value) : value,
});
