import { get, isBoolean, isNil, isString } from 'lodash-es';
import React, { ReactElement, ReactNode } from 'react';

import { TagList, TagOption } from '@viaa/avo2-components';

import { formatDate } from '../../../shared/helpers/formatters';
import { sanitizeHtml, sanitizePresets } from '../../../shared/helpers/sanitize';

export function renderDetailRow(value: ReactNode, label: string): ReactElement {
	return (
		<tr key={`detail-row_${label}`}>
			<th>{label}</th>
			{isString(value) && (
				<td
					dangerouslySetInnerHTML={{ __html: sanitizeHtml(value, sanitizePresets.link) }}
				/>
			)}
			{!isString(value) && <td>{value}</td>}
		</tr>
	);
}

export function renderSimpleDetailRows(
	obj: any,
	propAndTranslations: [string, string][]
): ReactElement[] {
	return propAndTranslations.map((propAndTranslation) => {
		let value = get(obj, propAndTranslation[0]);
		if (isBoolean(value)) {
			value = value ? 'Ja' : 'Nee';
		}
		return renderDetailRow(isNil(value) ? '-' : value, propAndTranslation[1]);
	});
}

export function renderDateDetailRows(
	obj: any,
	propAndTranslations: [string, string][]
): ReactElement[] {
	return propAndTranslations.map((propAndTranslation) => {
		const value = get(obj, propAndTranslation[0]);
		return renderDetailRow(value ? formatDate(value) : '-', propAndTranslation[1]);
	});
}

export function renderMultiOptionDetailRows(
	obj: any,
	propAndTranslations: [string, string][]
): ReactElement[] {
	return propAndTranslations.map((propAndTranslation) => {
		return renderDetailRow(
			obj[propAndTranslation[0]] ? (
				<TagList
					swatches={false}
					tags={obj[propAndTranslation[0]].map(
						(subject: string): TagOption => ({
							id: subject,
							label: subject,
						})
					)}
				/>
			) : (
				'-'
			),
			propAndTranslation[1]
		);
	});
}
