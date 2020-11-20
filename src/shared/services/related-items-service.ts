import { stringify } from 'query-string';

import { Avo } from '@viaa/avo2-types';

import { DEFAULT_AUDIO_STILL } from '../constants';
import { CustomError, getEnv } from '../helpers';
import { fetchWithLogout } from '../helpers/fetch-with-logout';

export async function getRelatedItems(
	id: string | number,
	type: 'items' | 'collections' | 'bundles',
	limit: number = 5
): Promise<Avo.Search.ResultItem[]> {
	let url: string | undefined;
	let body: any | undefined;
	try {
		url = `${getEnv('PROXY_URL')}/search/related?${stringify({
			id,
			type,
			limit,
		})}`;
		body = {
			method: 'GET',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
		};
		const response = await fetchWithLogout(url, body);

		// Apply default audio stills

		const resolvedResponse = await response.json();
		const processedResults = (resolvedResponse.results || []).map(
			(result: Avo.Search.ResultItem) => {
				if (result.administrative_type === 'audio') {
					result.thumbnail_path = DEFAULT_AUDIO_STILL;
				}

				return result;
			}
		);

		return processedResults;
	} catch (err) {
		throw new CustomError('Failed to get related items', err, {
			id,
			url,
			body,
			limit,
		});
	}
}
