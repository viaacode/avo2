import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { Avo } from '@viaa/avo2-types';
import { isArray, isEmpty, isNil, noop } from 'lodash-es';
import queryString from 'query-string';

import { RouteParts } from '../../constants';

export const CONTENT_TYPE_TO_ROUTE: { [contentType in Avo.Core.ContentType]: string } = {
	video: RouteParts.Item,
	audio: RouteParts.Item,
	collectie: RouteParts.Collection,
	bundel: RouteParts.Folder,
};

export function buildLink(route: string, params: { [key: string]: any } = {}) {
	if (route.includes(':') && (isNil(params) || isEmpty(params))) {
		const missingParams = route
			.split('/')
			.filter(r => r.includes(':'))
			.join(', ');
		console.error(`Include following params: ${missingParams}`);

		return '';
	}

	let builtLink = route;

	Object.keys(params).forEach((param: string) => {
		builtLink = builtLink.replace(`:${param}`, params[param]);
	});

	return builtLink;
}

export function generateSearchLinks(
	key: string,
	filterProp: Avo.Search.FilterProp,
	filterValue: string | string[] | undefined,
	className: string = ''
) {
	if (isArray(filterValue)) {
		return filterValue.map((value: string, index: number) => (
			<Fragment key={`${key}:${filterProp}":${value}`}>
				{generateSearchLink(filterProp, value, className)}
				{index === filterValue.length - 1 ? '' : ', '}
			</Fragment>
		));
	}
	return generateSearchLink(filterProp, filterValue, className);
}

export function generateSearchLink(
	filterProp: Avo.Search.FilterProp,
	filterValue: string | undefined,
	className: string = '',
	onClick: () => void = noop
) {
	return filterValue ? (
		<Link
			className={className}
			to={generateSearchLinkString(filterProp, filterValue)}
			onClick={onClick}
		>
			{filterValue}
		</Link>
	) : (
		<Fragment />
	);
}

export function generateSearchLinkString(filterProp: Avo.Search.FilterProp, filterValue: string) {
	const queryParams =
		String(filterProp) === 'query'
			? queryString.stringify({ filters: JSON.stringify({ query: filterValue }) })
			: queryString.stringify({ filters: `{"${filterProp}":["${filterValue}"]}` });

	return `/${RouteParts.Search}?${queryParams}`;
}

export function generateContentLinkString(contentType: Avo.Core.ContentType, id: string) {
	return `/${CONTENT_TYPE_TO_ROUTE[contentType]}/${id}`;
}

export function generateAssignmentCreateLink(
	assignmentType: Avo.Assignment.Type,
	contentId?: string,
	contentLabel?: Avo.Assignment.ContentLabel
) {
	return `/${RouteParts.MyWorkspace}/${RouteParts.Assignments}/${
		RouteParts.Create
	}?assignment_type=${assignmentType}&content_id=${contentId}&content_label=${contentLabel}`;
}
