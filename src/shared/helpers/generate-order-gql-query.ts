import { Avo } from '@viaa/avo2-types';

export function nullsLast(order: Avo.Search.OrderDirection) {
	return order.replace('desc', 'desc_nulls_last').replace('asc', 'asc_nulls_last');
}

export function getOrderObject(
	sortColumn: string,
	sortOrder: Avo.Search.OrderDirection,
	columns: Partial<{
		[columnName: string]: (order: Avo.Search.OrderDirection) => any;
	}>
) {
	const getOrderFunc: Function | undefined = columns[sortColumn];

	if (getOrderFunc) {
		return [getOrderFunc(nullsLast(sortOrder))];
	}

	return [{ [sortColumn]: nullsLast(sortOrder) }];
}
