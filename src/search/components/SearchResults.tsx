import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Blankslate,
	Button,
	Container,
	Flex,
	Pagination,
	Spacer,
	Spinner,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CollectionService } from '../../collection/collection.service';
import { CustomError } from '../../shared/helpers';
import { ToastService } from '../../shared/services';
import { CONTENT_TYPE_TO_EVENT_CONTENT_TYPE_SIMPLIFIED } from '../../shared/services/bookmarks-views-plays-service';
import { SearchResultsProps } from '../search.types';

import SearchResultItem from './SearchResultItem';

const SearchResults: FunctionComponent<SearchResultsProps> = ({
	currentPage,
	loading,
	data,
	pageCount,
	setPage,
	bookmarkStatuses,
	navigateUserRequestForm,
	...resultProps
}) => {
	const [t] = useTranslation();

	const [collectionLabels, setCollectionLabels] = useState<{ [id: string]: string }>({});

	useEffect(() => {
		CollectionService.getCollectionLabels()
			.then(setCollectionLabels)
			.catch((err) => {
				console.error(new CustomError('Failed to get collection labels', err));
				ToastService.danger(
					t(
						'search/components/search-results___het-ophalen-van-de-kwaliteitslabels-is-mislukt'
					)
				);
			});
	}, [setCollectionLabels, t]);

	const getIsBookmarked = (result: Avo.Search.ResultItem) => {
		if (!bookmarkStatuses) {
			return null;
		}
		return (
			bookmarkStatuses[
				CONTENT_TYPE_TO_EVENT_CONTENT_TYPE_SIMPLIFIED[result.administrative_type]
			][result.uid] || false
		);
	};

	const renderSearchResultItem = (result: Avo.Search.ResultItem, index: number) => (
		<SearchResultItem
			{...resultProps}
			key={`search-result-item-${index}`}
			result={result}
			collectionLabelLookup={collectionLabels}
			isBookmarked={getIsBookmarked(result)}
		/>
	);

	return (
		<Container mode="vertical">
			<Container mode="horizontal">
				{loading ? (
					<Flex orientation="horizontal" center>
						<Spinner size="large" />
					</Flex>
				) : data && data.results && data.count !== 0 ? (
					<>
						<ul className="c-search-result-list">
							{data.results.map(renderSearchResultItem)}
						</ul>
						<Spacer margin="large">
							<Pagination
								pageCount={pageCount}
								currentPage={currentPage}
								onPageChange={setPage}
							/>
						</Spacer>
					</>
				) : (
					<Blankslate
						body=""
						icon="search"
						title={t(
							'search/components/search-results___er-zijn-geen-zoekresultaten-die-voldoen-aan-uw-filters'
						)}
					>
						<Button
							label={t('search/components/search-results___vraag-een-item-aan')}
							onClick={navigateUserRequestForm}
						/>
					</Blankslate>
				)}
			</Container>
		</Container>
	);
};

export default SearchResults;
