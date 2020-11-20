import { compact, isArray, isNil, set, without } from 'lodash-es';

export const NULL_FILTER = 'null';

export function getQueryFilter(
	query: string | undefined,
	getQueryFilterObj: (queryWildcard: string, query: string) => any[]
) {
	if (query) {
		return [
			{
				_or: getQueryFilterObj(`%${query}%`, query),
			},
		];
	}
	return [];
}

export function getDateRangeFilters(filters: any, props: string[], nestedProps?: string[]): any[] {
	return setNestedValues(filters, props, nestedProps || props, (prop: string, value: any) => {
		return {
			[prop]: {
				...(value && value.gte ? { _gte: value.gte } : null),
				...(value && value.lte ? { _lte: value.lte } : null),
			},
		};
	});
}

export function getBooleanFilters(filters: any, props: string[], nestedProps?: string[]): any[] {
	return setNestedValues(filters, props, nestedProps || props, (prop: string, value: any) => {
		return { [prop]: { _eq: value ? 'true' : 'false' } };
	});
}

export function getMultiOptionFilters(
	filters: any,
	props: string[],
	nestedProps?: string[]
): any[] {
	return setNestedValues(filters, props, nestedProps || props, (prop: string, value: any) => {
		if (isArray(value) && value.includes(NULL_FILTER)) {
			return {
				_or: [
					{ [prop]: { _is_null: true } },
					{ [prop]: { _in: without(value, NULL_FILTER) } },
				],
			};
		} 
			return { [prop]: { _in: value } };
		
	});
}

/**
 * Takes a filter object and a list of properties and outputs a valid graphql query object
 * @param filters object containing the filter props and values set by the ui
 * @param props which props should be added to the graphql query
 * @param nestedProps wich props should be added to the graphql query in a nested fashion (matched to props by index in the array)
 * @param getValue function that returns the last part of the graphql query
 */
function setNestedValues(
	filters: any,
	props: string[],
	nestedProps: string[],
	getValue: (nestedProp: string, value: any) => any
) {
	return compact(
		props.map((prop: string, index: number) => {
			const value = (filters as any)[prop];
			if (!isNil(value) && (!isArray(value) || value.length)) {
				const nestedProp = nestedProps ? nestedProps[index] : prop;

				const lastProp = nestedProp.split('.').pop() as string;
				const path = nestedProp.substring(0, nestedProp.length - lastProp.length - 1);

				if (path) {
					const response = {};
					set(response, path, getValue(lastProp, value));
					return response;
				} 
					return getValue(lastProp, value);
				
			}
			return null;
		})
	);
}
