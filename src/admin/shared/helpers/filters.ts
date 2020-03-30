import { compact, isNil } from 'lodash-es';

export function getQueryFilter(
	query: string | undefined,
	getQueryFilterObj: (query: string, queryWord: string, queryWordWildcard: string) => any[]
) {
	if (query) {
		return query.split(' ').map(queryWord => {
			return {
				_or: getQueryFilterObj(`%${queryWord}%`, queryWord, query),
			};
		});
	}
	return [];
}

export function getDateRangeFilters(filters: any, dateProps: string[]): any[] {
	return compact(
		dateProps.map((dateProp: string) => {
			const rangeValue = (filters as any)[dateProp];
			if (rangeValue) {
				return {
					[dateProp]: {
						...(rangeValue && rangeValue.gte ? { _gte: rangeValue.gte } : null),
						...(rangeValue && rangeValue.lte ? { _lte: rangeValue.lte } : null),
					},
				};
			}
			return null;
		})
	);
}

export function getBooleanFilters(filters: any, booleanProps: string[]): any[] {
	return compact(
		booleanProps.map((booleanProp: string) => {
			const booleanValue = (filters as any)[booleanProp];
			if (!isNil(booleanValue)) {
				return { is_published: { _eq: booleanValue ? 'true' : 'false' } };
			}
			return null;
		})
	);
}

export function getMultiOptionFilters(filters: any, multiOptionProps: string[]): any[] {
	return compact(
		multiOptionProps.map((multiOptionProp: string) => {
			const multiOptionValue = (filters as any)[multiOptionProp];
			if (multiOptionValue && multiOptionValue.length) {
				return { [multiOptionProp]: { _in: multiOptionValue } };
			}
			return null;
		})
	);
}