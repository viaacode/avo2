import { get } from 'lodash';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactSelect from 'react-select';
import AsyncSelect from 'react-select/async';
import { ActionMeta, ValueType } from 'react-select/src/types';

import { Column, FormGroup, Grid, TextInput } from '@viaa/avo2-components';

import { CustomError } from '../../../../shared/helpers';
import { ToastService } from '../../../../shared/services';

import { parsePickerItem } from '../../../shared/helpers';
import {
	ContentPickerType,
	PickerItem,
	PickerSelectItem,
	PickerTypeOption,
} from '../../../shared/types';

import {
	CONTENT_TYPES,
	DEFAULT_ALLOWED_TYPES,
	REACT_SELECT_DEFAULT_OPTIONS,
} from './ContentPicker.const';
import { filterTypes, setInitialInput, setInitialItem } from './ContentPicker.helpers';

export interface ContentPickerProps {
	allowedTypes?: ContentPickerType[];
	initialValues?: PickerItem;
	onSelect: (value: ValueType<PickerItem>) => void;
	errors?: string | string[];
}

export const ContentPicker: FunctionComponent<ContentPickerProps> = ({
	allowedTypes = DEFAULT_ALLOWED_TYPES,
	initialValues,
	onSelect,
	errors = [],
}) => {
	const [t] = useTranslation();

	// filter available options for the type picker
	const typeOptions = filterTypes(CONTENT_TYPES, allowedTypes);

	// apply initial type from `initialValues`, default to first available type
	const currentTypeObject = typeOptions.find(type => type.value === get(initialValues, 'type'));
	const [selectedType, setSelectedType] = useState<PickerTypeOption<ContentPickerType>>(
		currentTypeObject || typeOptions[0]
	);

	// available options for the item picker.
	const [itemOptions, setItemOptions] = useState<PickerSelectItem[]>([]);

	// selected option, keep track of wether initial item from `initialValues` has been applied
	const [selectedItem, setSelectedItem] = useState<ValueType<PickerItem>>();
	const [hasAppliedInitialItem, setHasAppliedInitialItem] = useState<boolean>(false);

	// apply initial input if INPUT-based type, default to ''
	const [input, setInput] = useState<string>(setInitialInput(currentTypeObject, initialValues));

	// inflate item picker // TODO: type
	const inflatePicker = (keyword: string | null, callback: any) => {
		if (selectedType && !!selectedType.fetch) {
			selectedType
				.fetch(keyword, 20)
				.then((items: any) => callback((items as any) || [])) // TODO: type
				.catch(handleInflationError);
		}
	};

	// handle error during inflation of item picker // TODO: type
	const handleInflationError = (error: any) => {
		console.error('[Content Picker] - Failed to inflate.', error);
		ToastService.danger(
			t(
				'admin/content/components/content-picker/content-picker___het-ophalen-van-de-content-items-is-mislukt'
			),
			false
		);
	};

	// when selecting a type, reset `selectedItem` and retrieve new item options
	useEffect(() => {
		inflatePicker(null, setItemOptions);
	}, [selectedType]);

	// during the first update of `itemOptions`, set the initial value of the item picker
	useEffect(() => {
		if (itemOptions.length && !hasAppliedInitialItem) {
			setSelectedItem(setInitialItem(itemOptions, initialValues));
			setHasAppliedInitialItem(true);
		}
	}, [itemOptions]);

	// events
	const onSelectType = (selected: ValueType<PickerTypeOption>) => {
		if (selectedType !== selected) {
			setSelectedType(selected as PickerTypeOption);
			setSelectedItem(null);
		}
	};

	const onSelectItem = (selectedItem: ValueType<PickerItem>, event: ActionMeta) => {
		// reset `selectedItem` when clearing item picker
		if (event.action === 'clear') {
			setSelectedItem(null);
			return null;
		}

		const value = get(selectedItem, 'value', null);

		// if value of selected item is `null`, throw error
		if (!get(value, 'value')) {
			onSelect(null);
			setSelectedItem(null);
			console.error(
				new CustomError('[Content Picker] - Selected item has no value.', null, {
					selectedItem,
				})
			);
			ToastService.danger(
				t(
					'admin/shared/components/content-picker/content-picker___voor-deze-content-pagina-is-geen-pad-geconfigureerd'
				),
				false
			);
			return null;
		}

		// trigger `onSelect` function, pass selected item
		onSelect(value);

		// update `selectedItem`
		setSelectedItem(selectedItem);
	};

	const onChangeInput = (value: string) => {
		setInput(value);
		onSelect(parsePickerItem(get(selectedType, 'value') as ContentPickerType, value));
	};

	// render controls
	const renderTypePicker = () => (
		<ReactSelect
			{...REACT_SELECT_DEFAULT_OPTIONS}
			id="content-picker-type"
			placeholder={t('admin/shared/components/content-picker/content-picker___type')}
			aria-label={t(
				'admin/shared/components/content-picker/content-picker___selecteer-een-type'
			)}
			options={typeOptions}
			onChange={onSelectType}
			value={selectedType}
			isSearchable={false}
			isOptionDisabled={(option: PickerTypeOption) => !!option.disabled}
			noOptionsMessage={() =>
				t('admin/shared/components/content-picker/content-picker___geen-types')
			}
		/>
	);

	const renderItemControl = () => {
		if (!selectedType) {
			return null;
		}

		switch (selectedType.picker) {
			case 'SELECT':
				return renderItemPicker();
			case 'TEXT_INPUT':
				return renderTextInputPicker();
			default:
				return null;
		}
	};

	const renderItemPicker = () => (
		<AsyncSelect
			{...REACT_SELECT_DEFAULT_OPTIONS}
			id="content-picker-item"
			placeholder={t(
				'admin/shared/components/content-picker/content-picker___selecteer-een-item'
			)}
			aria-label={t(
				'admin/shared/components/content-picker/content-picker___selecteer-een-item'
			)}
			loadOptions={inflatePicker}
			onChange={onSelectItem}
			value={selectedItem}
			defaultOptions={itemOptions as any} // TODO: type
			isClearable
			noOptionsMessage={() =>
				t('admin/shared/components/content-picker/content-picker___geen-resultaten')
			}
			loadingMessage={() =>
				t('admin/shared/components/content-picker/content-picker___laden')
			}
		/>
	);

	const renderTextInputPicker = () => (
		<TextInput
			value={input}
			onChange={onChangeInput}
			placeholder={get(currentTypeObject, 'placeholder')}
		/>
	);

	// render content picker
	return (
		<FormGroup error={errors}>
			<Grid>
				<Column size="1">{renderTypePicker()}</Column>
				<Column size="3">{renderItemControl()}</Column>
			</Grid>
		</FormGroup>
	);
};
