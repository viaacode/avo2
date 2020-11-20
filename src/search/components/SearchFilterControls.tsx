import classnames from 'classnames';
import { cloneDeep, forEach, get, omit, uniqBy } from 'lodash-es';
import React, { FunctionComponent, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Accordion, AccordionBody, Spacer } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CollectionService } from '../../collection/collection.service';
import { CheckboxDropdownModal, CheckboxOption, DateRangeDropdown } from '../../shared/components';
import { LANGUAGES } from '../../shared/constants';
import { CustomError, isMobileWidth } from '../../shared/helpers';
import { ToastService } from '../../shared/services';
import { SearchFilterControlsProps, SearchFilterMultiOptions } from '../search.types';

import './SearchFilterControls.scss';

const languageCodeToLabel = (code: string): string => {
	return LANGUAGES.nl[code] || code;
};

const SearchFilterControls: FunctionComponent<SearchFilterControlsProps> = ({
	filterState,
	handleFilterFieldChange,
	multiOptions,
	onSearch,
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
						'search/components/search-filter-controls___het-ophalen-van-de-kwaliteitslabels-is-mislukt'
					)
				);
			});
	}, [setCollectionLabels, t]);

	const getCombinedMultiOptions = () => {
		const combinedMultiOptions: SearchFilterMultiOptions = cloneDeep(multiOptions);
		const arrayFilters = omit(filterState, ['query', 'broadcastDate']) as {
			[filterName: string]: string[];
		};
		forEach(arrayFilters, (values: string[], filterName: string) => {
			combinedMultiOptions[filterName] = uniqBy(
				[
					...(combinedMultiOptions[filterName] || []),
					...(values || []).map((val) => ({ option_name: val, option_count: 0 })),
				],
				'option_name'
			);
		});
		return combinedMultiOptions;
	};

	const renderCheckboxDropdownModal = (
		label: string,
		propertyName: Avo.Search.FilterProp,
		disabled = false,
		labelsMapping?: { [id: string]: string }
	): ReactNode => {
		const checkboxMultiOptions = (getCombinedMultiOptions()[propertyName] || []).map(
			({ option_name, option_count }: Avo.Search.OptionProp): CheckboxOption => {
				let checkboxLabel = option_name;

				if (propertyName === 'language') {
					checkboxLabel = languageCodeToLabel(option_name);
				}

				if (labelsMapping) {
					checkboxLabel = labelsMapping[option_name];
				}

				return {
					label: checkboxLabel,
					optionCount: option_count,
					id: option_name,
					checked: (get(filterState, propertyName, []) as string[]).includes(option_name),
				};
			}
		);

		return (
			<li className={`c-filter-dropdown c-filter-dropdown-${propertyName.toLowerCase()}`}>
				<CheckboxDropdownModal
					label={label}
					id={propertyName as string}
					options={checkboxMultiOptions}
					showMaxOptions={40}
					disabled={disabled}
					onChange={async (values: string[]) => {
						await handleFilterFieldChange(values, propertyName);
					}}
					onSearch={onSearch}
				/>
			</li>
		);
	};

	const renderDateRangeDropdown = (
		label: string,
		propertyName: Avo.Search.FilterProp
	): ReactNode => {
		const range: Avo.Search.DateRange = get(filterState, 'broadcastDate') || {
			gte: '',
			lte: '',
		};
		const correctRange: Avo.Search.DateRange = {
			gte: range.gte || '',
			lte: range.lte || '',
		};

		return (
			<li className={`c-filter-dropdown c-filter-dropdown-${propertyName.toLowerCase()}`}>
				<DateRangeDropdown
					label={label}
					id={propertyName}
					range={correctRange as { gte: string; lte: string }}
					onChange={async (dateRange: Avo.Search.DateRange) =>
						await handleFilterFieldChange(dateRange, propertyName)
					}
				/>
			</li>
		);
	};

	const renderFilters = () => (
		<ul
			className={classnames('c-filter-dropdown-list', {
				'c-filter-dropdown-list--mobile': isMobileWidth(),
			})}
		>
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___type'),
				'type'
			)}
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___onderwijsniveau'),
				'educationLevel'
			)}
			{/*{renderCheckboxDropdownModal( TODO: DISABLED FEATURE */}
			{/*	t('search/components/search-filter-controls___domein'),*/}
			{/*	'domain',*/}
			{/*)}*/}
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___vak'),
				'subject'
			)}
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___trefwoord'),
				'keyword'
			)}
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___serie'),
				'serie'
			)}
			{renderDateRangeDropdown(
				t('search/components/search-filter-controls___uitzenddatum'),
				'broadcastDate'
			)}
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___taal'),
				'language'
			)}
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___aanbieder'),
				'provider'
			)}
			{renderCheckboxDropdownModal(
				t('search/components/search-filter-controls___label'),
				'collectionLabel',
				false,
				collectionLabels
			)}
		</ul>
	);

	if (isMobileWidth()) {
		return (
			<Spacer margin="bottom-large">
				<Accordion
					title={t('search/components/search-filter-controls___filters')}
					className="c-accordion--filters"
				>
					<AccordionBody>{renderFilters()}</AccordionBody>
				</Accordion>
			</Spacer>
		);
	}

	return renderFilters();
};

export default SearchFilterControls;
