import { isEmpty, isNil, keys } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { NewsletterList } from '../types';

export const convertToNewsletterPreferenceUpdate = (
	oldPreferences: Avo.Newsletter.Preferences,
	newPreferences: Partial<Avo.Newsletter.Preferences>
) => {
	// Convert to update object for newsletter preferences.
	const uniqKeys = keys(oldPreferences) as NewsletterList[];

	const convertedPreferences: Partial<Avo.Newsletter.Preferences> = {};
	uniqKeys.forEach((key) => {
		if (!isNil(newPreferences[key]) && oldPreferences[key] !== newPreferences[key]) {
			convertedPreferences[key] = newPreferences[key];
		}
	});

	return isEmpty(convertedPreferences) ? null : convertedPreferences;
};
