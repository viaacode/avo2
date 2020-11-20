import classnames from 'classnames';
import { fromPairs, map } from 'lodash-es';
import queryString from 'query-string';
import React, { FunctionComponent, ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ButtonAction, ContentPickerType, LinkTarget } from '@viaa/avo2-components';

import { BUNDLE_PATH } from '../../../bundle/bundle.const';
import { APP_PATH } from '../../../constants';
import { buildLink, getEnv } from '../../helpers';
import { insideIframe } from '../../helpers/inside-iframe';

export interface SmartLinkProps {
	action?: ButtonAction | null;
	removeStyles?: boolean;
	children: ReactNode;
}

const SmartLink: FunctionComponent<SmartLinkProps> = ({
	action,
	removeStyles = true,
	children,
}) => {
	const renderLink = (
		url: string,
		target: LinkTarget = LinkTarget.Self
	): ReactElement<any, any> | null => {
		let fullUrl = url;
		if (url.startsWith('www.')) {
			fullUrl = `//${url}`;
		}

		switch (target) {
			case LinkTarget.Self:
				// Open inside same tab
				if (fullUrl.includes('//')) {
					// absolute url
					return (
						<a
							href={fullUrl}
							target="_self"
							className={classnames({ 'a-link__no-styles': removeStyles })}
						>
							{children}
						</a>
					);
				} 
					// relative url
					return (
						<Link
							to={fullUrl}
							className={classnames({ 'a-link__no-styles': removeStyles })}
						>
							{children}
						</Link>
					);
				

			case LinkTarget.Blank:
			default:
				// Open in a new tab
				if (fullUrl.includes('//')) {
					// absolute fullUrl
					return (
						<a
							href={fullUrl}
							target="_blank"
							rel="noopener noreferrer"
							className={classnames({ 'a-link__no-styles': removeStyles })}
						>
							{children}
						</a>
					);
				} 
					// relative url
					return (
						<a
							href={`${window.location.origin}${fullUrl}`}
							target="_blank"
							rel="noopener noreferrer"
							className={classnames({ 'a-link__no-styles': removeStyles })}
						>
							{children}
						</a>
					);
				
		}
	};

	const renderSmartLink = (): ReactElement<any, any> | null => {
		if (action) {
			const { type, value, target } = action;

			if (!value) {
				return <>{children}</>;
			}

			let resolvedTarget = target;
			if (insideIframe()) {
				// Klaar page inside smartschool iframe must open all links in new window: https://meemoo.atlassian.net/browse/AVO-1354
				resolvedTarget = LinkTarget.Blank;
			}

			switch (type as ContentPickerType) {
				case 'INTERNAL_LINK':
				case 'CONTENT_PAGE':
				case 'PROJECTS':
					return renderLink(String(value), resolvedTarget);

				case 'COLLECTION':
					const collectionUrl = buildLink(APP_PATH.COLLECTION_DETAIL.route, {
						id: value as string,
					});
					return renderLink(collectionUrl, resolvedTarget);

				case 'ITEM':
					const itemUrl = buildLink(APP_PATH.ITEM_DETAIL.route, {
						id: value,
					});
					return renderLink(itemUrl, resolvedTarget);

				case 'BUNDLE':
					const bundleUrl = buildLink(BUNDLE_PATH.BUNDLE_DETAIL, {
						id: value,
					});
					return renderLink(bundleUrl, resolvedTarget);

				case 'EXTERNAL_LINK':
					const externalUrl = ((value as string) || '').replace(
						'{{PROXY_URL}}',
						getEnv('PROXY_URL') || ''
					);
					return renderLink(externalUrl, resolvedTarget);

				case 'ANCHOR_LINK':
					const urlWithoutQueryOrAnchor = window.location.href
						.split('?')[0]
						.split('#')[0];
					return renderLink(`${urlWithoutQueryOrAnchor}#${value}`, resolvedTarget);

				case 'FILE':
					return renderLink(value as string, LinkTarget.Blank);

				case 'SEARCH_QUERY':
					const queryParams = JSON.parse(value as string);
					return renderLink(
						buildLink(
							APP_PATH.SEARCH.route,
							{},
							queryString.stringify(
								fromPairs(
									map(queryParams, (queryParamValue, queryParam) => [
										queryParam,
										JSON.stringify(queryParamValue),
									])
								)
							)
						),
						resolvedTarget
					);

				default:
					break;
			}
		}
		return <>{children}</>;
	};

	return renderSmartLink();
};

export default SmartLink;
