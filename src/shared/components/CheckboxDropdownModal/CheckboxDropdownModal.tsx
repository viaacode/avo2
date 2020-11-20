import classnames from 'classnames';
import { clone, compact, fromPairs, take } from 'lodash-es';
import React, { FunctionComponent, MouseEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	ButtonToolbar,
	Checkbox,
	CheckboxGroup,
	Column,
	Dropdown,
	DropdownButton,
	DropdownContent,
	Form,
	FormGroup,
	Grid,
	Icon,
	Modal,
	ModalBody,
	ModalFooterRight,
	Spacer,
	TagList,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';

import { isMobileWidth } from '../../helpers';

import './CheckboxDropdownModal.scss';

interface CheckedState {
	[checkboxId: string]: boolean;
}

export interface Tag {
	label: string;
	id: string;
}

export interface CheckboxOption {
	label: string;
	// Provide option count separately from the label
	// because the selected filters in the taglist do not contain the optionCount
	optionCount?: number;
	id: string;
	checked: boolean;
}

export interface CheckboxDropdownModalProps {
	label: string;
	id: string;
	options: CheckboxOption[];
	showMaxOptions?: number;
	disabled?: boolean;
	// Show selected values when dropdown or modal are closed
	showSelectedValuesOnCollapsed?: boolean;
	showSearch?: boolean;
	onChange: (checkedOptions: string[], id: string) => void;
	onSearch?: (aggId: string) => void;
}

export const CheckboxDropdownModal: FunctionComponent<CheckboxDropdownModalProps> = ({
	label,
	id,
	options,
	showMaxOptions,
	disabled,
	showSelectedValuesOnCollapsed = true,
	showSearch = true,
	onChange,
	onSearch,
}) => {
	const [t] = useTranslation();

	// Computed
	const optionsFromPairs = fromPairs(
		options.map(({ checked, ...option }: CheckboxOption) => [option.id, checked])
	);

	// State
	const [checkedStates, setCheckedStates] = useState(optionsFromPairs);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [searchKeyword, setSearchKeyword] = useState<string>('');

	// Methods
	const getSelectedTags = (): Tag[] =>
		compact(
			options.map(({ checked, ...option }: CheckboxOption) => {
				// Only change when user clicks submit.
				if (!checked) {
					return null;
				}

				return { label: option.label, id: option.id };
			})
		);

	const getSelectedFilterIds = (currentCheckedStates: CheckedState) =>
		compact(
			Object.keys(currentCheckedStates).map((key) => (currentCheckedStates[key] ? key : null))
		);

	const resetInternalCheckboxStates = () => setCheckedStates(optionsFromPairs);

	// Listeners
	const applyFilter = async (): Promise<void> => {
		onChange(getSelectedFilterIds(checkedStates), id);
		await closeDropdownOrModal();
	};

	const handleCheckboxToggled = async (newCheckedState: boolean, toggledCheckboxId: string) => {
		setCheckedStates({
			...checkedStates,
			[toggledCheckboxId]: newCheckedState,
		});
	};

	const openDropdownOrModal = async () => {
		await resetInternalCheckboxStates();
		setIsOpen(true);
	};

	const closeDropdownOrModal = () => {
		setIsOpen(false);
		setSearchKeyword('');
	};

	const removeFilter = (tagId: string | number, evt: MouseEvent) => {
		evt.stopPropagation();
		const clonedCheckedStates = clone(checkedStates);
		clonedCheckedStates[tagId] = false;
		setCheckedStates(clonedCheckedStates);
		onChange(getSelectedFilterIds(clonedCheckedStates), id);
	};

	const renderCheckbox = ({ id: optionId, optionCount, label: optionLabel }: CheckboxOption) => (
		<Checkbox
			key={optionId}
			id={optionId}
			label={optionCount ? `${optionLabel} (${optionCount})` : optionLabel}
			checked={checkedStates[optionId]}
			onChange={(checked: boolean) => handleCheckboxToggled(checked, optionId)}
		/>
	);

	const renderCheckboxGroup = (checkboxOptions: CheckboxOption[]) => (
		<FormGroup>
			<CheckboxGroup>{checkboxOptions.map(renderCheckbox)}</CheckboxGroup>
		</FormGroup>
	);

	const renderCheckboxControl = () => {
		return (
			<Dropdown
				label={label}
				menuWidth="fit-content"
				isOpen={isOpen}
				onOpen={openDropdownOrModal}
				onClose={closeDropdownOrModal}
			>
				<DropdownButton>
					{renderDropdownButton(
						label,
						isOpen,
						getSelectedTags(),
						removeFilter,
						showSelectedValuesOnCollapsed
					)}
				</DropdownButton>
				<DropdownContent>
					<Spacer>
						<Form>
							<FormGroup label={label} labelFor={id}>
								<CheckboxGroup>
									{options.map((option: CheckboxOption) => (
										<Checkbox
											key={`checkbox-${id}-${option.id}`}
											id={option.id}
											label={
												option.optionCount
													? `${option.label} (${option.optionCount})`
													: option.label
											}
											checked={checkedStates[option.id]}
											onChange={(checked: boolean) =>
												handleCheckboxToggled(checked, option.id)
											}
										/>
									))}
									{!options.length && (
										<span>Er zijn geen zoekfilters in deze categorie.</span>
									)}
								</CheckboxGroup>
							</FormGroup>
							<FormGroup>
								<Button
									disabled={!options.length}
									label={t(
										'shared/components/checkbox-dropdown-modal/checkbox-dropdown-modal___toepassen'
									)}
									type="primary"
									className="c-apply-filter-button"
									block
									onClick={applyFilter}
								/>
							</FormGroup>
						</Form>
					</Spacer>
				</DropdownContent>
			</Dropdown>
		);
	};

	const renderModalControl = () => {
		const filteredOptions = take(
			options.filter((option: CheckboxOption) =>
				(option.label || '')
					.replace(/ /g, '')
					.toLowerCase()
					.includes(searchKeyword.replace(/ /g, '').toLowerCase())
			),
			showMaxOptions || Number.POSITIVE_INFINITY // Limit number of items so the modal doesn't scroll on desktop
		);
		const oneThird = Math.ceil(filteredOptions.length / 3);
		const firstColumnOptions = filteredOptions.slice(0, oneThird);
		const secondColumnOptions = filteredOptions.slice(oneThird, oneThird * 2);
		const thirdColumnOptions = filteredOptions.slice(oneThird * 2);

		return (
			<>
				<div className="c-checkbox-dropdown__trigger" onClick={openDropdownOrModal}>
					{renderDropdownButton(
						label,
						isOpen,
						getSelectedTags(),
						removeFilter,
						showSelectedValuesOnCollapsed
					)}
				</div>
				<Modal
					isOpen={isOpen}
					title={label}
					size="large"
					onClose={closeDropdownOrModal}
					scrollable
				>
					<ModalBody>
						{showSearch && (
							<>
								<TextInput
									placeholder={t(
										'shared/components/checkbox-dropdown-modal/checkbox-dropdown-modal___zoeken'
									)}
									icon="search"
									value={searchKeyword}
									onChange={(value) => {
										setSearchKeyword(value);

										if (onSearch) {
											onSearch(id);
										}
									}}
								/>
								{!!options.filter(
									(option: CheckboxOption) => checkedStates[option.id]
								).length && (
									<div className="c-checkbox-dropdown__checked">
										<TagList
											tags={options.filter(
												(option: CheckboxOption) => checkedStates[option.id]
											)}
											swatches={false}
											closable={true}
											onTagClosed={(id) =>
												handleCheckboxToggled(false, id.toString())
											}
										/>
									</div>
								)}
							</>
						)}
						<Spacer className="c-checkbox-dropdown__list">
							<Form>
								{isMobileWidth() ? (
									renderCheckboxGroup(take(filteredOptions, 14))
								) : (
									<Grid>
										<Column size="2-4">
											{renderCheckboxGroup(firstColumnOptions)}
										</Column>
										<Column size="2-4">
											{renderCheckboxGroup(secondColumnOptions)}
										</Column>
										<Column size="2-4">
											{renderCheckboxGroup(thirdColumnOptions)}
										</Column>
									</Grid>
								)}
							</Form>
						</Spacer>
					</ModalBody>
					<ModalFooterRight>
						<Toolbar spaced>
							<ToolbarRight>
								<ToolbarItem>
									<ButtonToolbar>
										<Button
											label={t(
												'shared/components/checkbox-dropdown-modal/checkbox-dropdown-modal___annuleren'
											)}
											type="secondary"
											block
											onClick={closeDropdownOrModal}
										/>
										<Button
											label={t(
												'shared/components/checkbox-dropdown-modal/checkbox-dropdown-modal___toepassen'
											)}
											className="c-apply-filter-button"
											type="primary"
											block
											onClick={applyFilter}
										/>
									</ButtonToolbar>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</ModalFooterRight>
				</Modal>
			</>
		);
	};

	if (disabled) {
		return (
			<div className={classnames({ 'u-opacity-50 u-disable-click': disabled })}>
				{options.length <= 7 ? renderCheckboxControl() : renderModalControl()}
			</div>
		);
	}

	return options.length <= 7 ? renderCheckboxControl() : renderModalControl();
};

export const renderDropdownButton = (
	label: string,
	isOpen: boolean,
	selectedTags: { label: string; id: string | number }[],
	removeFilter: (tagId: string | number, clickEvent: MouseEvent) => void,
	showSelectedValuesOnCollapsed: boolean = true
) => {
	return (
		<Button autoHeight className="c-checkbox-dropdown-modal__trigger" type="secondary">
			<div className="c-button__content">
				<div className="c-button__label">{label}</div>
				{!!selectedTags.length && showSelectedValuesOnCollapsed && (
					<TagList
						tags={selectedTags}
						swatches={false}
						closable
						onTagClosed={removeFilter}
					/>
				)}
				<Icon
					className="c-button__icon"
					name={isOpen ? 'caret-up' : 'caret-down'}
					size="small"
					type="arrows"
				/>
			</div>
		</Button>
	);
};
