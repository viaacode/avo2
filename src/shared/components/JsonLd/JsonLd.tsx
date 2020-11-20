import { FunctionComponent } from 'react';

import { toIsoDate } from '../../helpers/formatters';

export interface JsonLdProps {
	url: string;
	title?: string;
	description?: string | null;
	image?: string | null;
	isOrganisation?: boolean;
	author?: string | null;
	publishedAt?: string | null;
	updatedAt?: string | null;
	keywords?: string[] | null;
}

const JsonLd: FunctionComponent<JsonLdProps> = ({
	url,
	title,
	description,
	image,
	isOrganisation = false,
	author,
	publishedAt,
	updatedAt,
	keywords = [],
}) => {
	document
		.querySelectorAll('script[type="application/ld+json"]')
		.forEach((script) => script.remove());

	const info = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': url,
		},
		headline: title || '',
		description: description || '',
		image: image ? [image] : [],
		author: {
			'@type': isOrganisation ? 'Organization' : 'Person',
			name: author || '',
		},
		publisher: {
			'@type': 'Organization',
			name: 'Meemoo',
			logo: {
				'@type': 'ImageObject',
				url: 'https://meemoo.be/img/logo-mobile.svg',
			},
		},
		datePublished: toIsoDate(publishedAt || ''),
		dateModified: toIsoDate(updatedAt || ''),
		keywords: (keywords || []).join(','),
	};

	const scriptElem = document.createElement('script');
	scriptElem.setAttribute('type', 'application/ld+json');
	scriptElem.innerHTML = JSON.stringify(info, null, 2);
	document.head.append(scriptElem);
	return null;
};

export default JsonLd;
