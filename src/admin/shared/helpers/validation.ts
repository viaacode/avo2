import { isNumber, pick, pickBy } from 'lodash-es';

import i18n from '../../../shared/translations/i18n';
import { ContentBlockErrors } from '../types';

// Handle content-block config components/block state validation
export const validateContentBlockField = (
	fieldKey: string,
	validator: ((value: any) => string[]) | undefined,
	oldErrors: ContentBlockErrors = {},
	value: any,
	stateIndex?: number
): ContentBlockErrors => {
	if (!validator) {
		return oldErrors;
	}

	const errorArray = validator(value);

	if (errorArray.length) {
		if (isNumber(stateIndex)) {
			const errorsByKey = [...(oldErrors[fieldKey] || [])];
			errorsByKey[stateIndex] = errorArray;

			return {
				...oldErrors,
				[fieldKey]: errorsByKey,
			};
		}

		return {
			...oldErrors,
			[fieldKey]: errorArray,
		};
	}

	// If no errors are given, cleanup empty properties
	if (isNumber(stateIndex)) {
		const errorsByKey = [...(oldErrors[fieldKey] || [])];
		delete errorsByKey[stateIndex];

		const updatedErrors = {
			...oldErrors,
			[fieldKey]: errorsByKey,
		};

		return pickBy(updatedErrors, (value) => value.length !== 0);
	}

	const newKeys = Object.keys(oldErrors).filter((key) => key !== fieldKey);

	return pick(oldErrors, newKeys);
};

export function validateFlowplayerVideoUrl(url: string | null | undefined) {
	if (!url) {
		return [];
	}
	if (!url.startsWith('https://')) {
		return [i18n.t('admin/shared/helpers/validation___video-url-moet-beginnen-met-http')];
	}
	if (!url.endsWith('.m3u8') && !url.endsWith('.mp4')) {
		return [
			i18n.t('admin/shared/helpers/validation___video-url-moet-eindigen-met-m-3-u-8-of-mp-4'),
		];
	}
	return [];
}
