import { capitalize, compact, get, startCase, trimStart } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';

import {
	SearchResult,
	SearchResultSubtitle,
	SearchResultThumbnail,
	SearchResultTitle,
	TagOption,
	Thumbnail,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { toEnglishContentType } from '../../collection/collection.types';
import { formatDate, generateContentLinkString, generateSearchLink } from '../../shared/helpers';
import { SearchResultItemProps } from '../search.types';

const SearchResultItem: FunctionComponent<SearchResultItemProps> = ({
	handleBookmarkToggle,
	handleTagClicked,
	handleOriginalCpLinkClicked,
	result,
	isBookmarked,
	collectionLabelLookup,
}) => {
	const contentLink: string = generateContentLinkString(result.administrative_type, result.id);

	const getTags = (result: Avo.Search.ResultItem): TagOption[] => {
		return compact(
			(get(result, 'collection_labels', []) as string[]).map((id: string) => {
				return {
					id,
					label: collectionLabelLookup[id] || capitalize(startCase(id)),
				};
			})
		);
	};

	const getMetaData = () => {
		if (result.administrative_type === 'video' || result.administrative_type === 'audio') {
			const duration = trimStart(result.duration_time, '0:');
			if (duration.includes(':')) {
				return duration;
			}
			return `0:${duration}`;
		}
		return ''; // TODO wait for https://meemoo.atlassian.net/browse/AVO-1107
	};

	const stripMarkdownLinks = (description: string) => {
		return description.replace(/\[([^\]]+)]\([^)]+\)/gi, '$1');
	};

	let date: string;
	if (result.administrative_type === 'collectie' || result.administrative_type === 'bundel') {
		date = result.created_at;
	} else {
		date = result.dcterms_issued;
	}
	return (
		<SearchResult
			key={`search-result-${result.id}`}
			type={toEnglishContentType(result.administrative_type)}
			date={formatDate(date)}
			tags={getTags(result)}
			viewCount={result.views_count || 0}
			bookmarkCount={result.bookmarks_count || 0}
			description={stripMarkdownLinks(result.dcterms_abstract || '')}
			isBookmarked={isBookmarked}
			onToggleBookmark={(active: boolean) => handleBookmarkToggle(result.uid, active)}
			onTagClicked={handleTagClicked}
		>
			<SearchResultTitle>
				<Link to={contentLink}>{result.dc_title}</Link>
			</SearchResultTitle>
			{!!result.original_cp && (
				<SearchResultSubtitle>
					{generateSearchLink('provider', result.original_cp, 'c-body-2', () =>
						handleOriginalCpLinkClicked(result.id, result.original_cp || '')
					)}
				</SearchResultSubtitle>
			)}
			<SearchResultThumbnail>
				<Link to={contentLink}>
					<Thumbnail
						category={toEnglishContentType(result.administrative_type)}
						src={result.thumbnail_path}
						label={result.administrative_type}
						meta={getMetaData()}
					/>
				</Link>
			</SearchResultThumbnail>
		</SearchResult>
	);
};

export default SearchResultItem;
