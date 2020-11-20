import { isNumber } from 'lodash-es';
import moment, { Moment } from 'moment';

type DateLike = string | Moment | Date | number;
type DateLikeNullable = DateLike | undefined | null;

/**
 * Converts a date from format 2000-12-31 to 31/12/2000
 */
export function reorderDate(dateString: string | null, separator: string = '/'): string {
	return (dateString || '').substring(0, 10).split('-').reverse().join(separator);
}

export function normalizeTimestamp(timestamp: DateLike): Moment {
	if (moment.isMoment(timestamp)) {
		return timestamp;
	}
	if (timestamp instanceof Date || isNumber(timestamp)) {
		return moment(timestamp);
	}
	if (
		timestamp.match(
			/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[+-][0-9]{2}:[0-9]{2}/g
		)
	) {
		return moment.parseZone(timestamp);
	}
	return moment(timestamp);
}

/**
 * Convert viaa format to relative date
 * @param timestamp
 */
export function fromNow(timestamp: DateLikeNullable) {
	if (!timestamp) {
		return '';
	}
	return normalizeTimestamp(timestamp).fromNow();
}

export function formatTimestamp(timestamp: DateLikeNullable, includeSeconds: boolean = true) {
	if (!timestamp) {
		return '';
	}
	return normalizeTimestamp(timestamp)
		.local()
		.format(`DD-MM-YYYY HH:mm${includeSeconds ? ':ss' : ''}`);
}

export function formatDate(timestamp: DateLikeNullable) {
	if (!timestamp) {
		return '';
	}
	return normalizeTimestamp(timestamp).local().format('DD-MM-YYYY');
}

export function toIsoDate(timestamp: DateLikeNullable) {
	if (!timestamp) {
		return '';
	}
	return normalizeTimestamp(timestamp).format('YYYY-MM-DD');
}
