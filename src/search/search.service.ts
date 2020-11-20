import { get, set } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { getEnv } from '../shared/helpers';
import { fetchWithLogout } from '../shared/helpers/fetch-with-logout';

export const fetchSearchResults = async (
	orderProperty: Avo.Search.OrderProperty = 'relevance',
	orderDirection: Avo.Search.OrderDirection = 'desc',
	from: number = 0,
	size: number,
	filters?: Partial<Avo.Search.Filters>,
	filterOptionSearch?: Partial<Avo.Search.FilterOption>,
	requestedAggs?: Avo.Search.FilterProp[],
	aggsSize?: number
) => {
	if (filters) {
		const gte = get(filters, 'broadcastDate.gte');
		const lte = get(filters, 'broadcastDate.lte');
		if (gte) {
			set(filters, 'broadcastDate.gte', gte.split(' ')[0]);
		}
		if (lte) {
			set(filters, 'broadcastDate.lte', lte.split(' ')[0]);
		}
	}
	const response = await fetchWithLogout(`${getEnv('PROXY_URL')}/search`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify({
			filters,
			filterOptionSearch,
			orderProperty,
			orderDirection,
			from,
			size,
			requestedAggs,
			aggsSize,
		}),
	});

	return response.json();
};
