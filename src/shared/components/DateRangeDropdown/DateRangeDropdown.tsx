import moment from 'moment';
import React, { FunctionComponent, MouseEvent, ReactText, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	Column,
	DatePicker,
	Dropdown,
	DropdownButton,
	DropdownContent,
	Form,
	FormGroup,
	Grid,
	RadioButton,
	RadioButtonGroup,
	TextInput,
} from '@viaa/avo2-components';

import { reorderDate } from '../../helpers/formatters';
import { ToastService } from '../../services';
import { renderDropdownButton } from '../CheckboxDropdownModal/CheckboxDropdownModal';

export interface DateRangeDropdownProps {
	label: string;
	id: string;
	range?: { gte: string; lte: string };
	onChange: (dateRange: { gte: string; lte: string }, id: string) => void;
}

export interface DateRange {
	gte: string;
	lte: string;
}

const DEFAULT_DATE_RANGE = { gte: '', lte: '' };

const DateRangeDropdown: FunctionComponent<DateRangeDropdownProps> = ({
	label,
	id,
	range = DEFAULT_DATE_RANGE,
	onChange,
}) => {
	const [t] = useTranslation();

	// Internal range state (copied to external range state when the user clicks on the apply button
	const [rangeState, setRangeState] = useState<DateRange>(range);
	const [showYearControls, setShowYearControls] = useState<boolean>(true);
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [yearInputGte, setYearInputGte] = useState<string>('');
	const [yearInputLte, setYearInputLte] = useState<string>('');

	// @ts-ignore
	const resetInternalRangeState = async (tagId?: ReactText, evt?: MouseEvent): Promise<void> => {
		evt && evt.stopPropagation();
		setRangeState(range);
	};

	/**
	 * State is only passed from the component to the parent when the user clicks the "Apply" button
	 */
	const applyFilter = async (): Promise<void> => {
		onChange(rangeState, id);
		await closeDropdown();
	};

	// @ts-ignore
	const removeFilter = (tagId: ReactText, evt: MouseEvent) => {
		evt.stopPropagation();
		setRangeState(DEFAULT_DATE_RANGE);
		setYearInputGte('');
		setYearInputLte('');
		onChange(DEFAULT_DATE_RANGE, id);
	};

	const handleDateChange = async (date: Date | null, rangeId: string) => {
		if (date) {
			setRangeState({
				...rangeState,
				[rangeId]: moment(date).format('YYYY-MM-DD'),
			});
		} else {
			setRangeState({
				...rangeState,
				[rangeId]: '',
			});
		}
	};

	const handleYearInputChange = async (value: string, rangeId: 'gte' | 'lte') => {
		try {
			rangeId === 'gte' ? setYearInputGte(value) : setYearInputLte(value);
			if (value.match(/^[0-9]{4}$/g)) {
				await handleDateChange(
					new Date(
						parseInt(value, 10),
						rangeId === 'gte' ? 0 : 11,
						rangeId === 'gte' ? 1 : 31
					),
					rangeId
				);
			} else {
				await handleDateChange(null, rangeId);
			}
		} catch (err) {
			ToastService.danger(`Ongeldig jaar: ${value}`);
		}
	};

	/**
	 * Called when the user switches between "year" range and "full date" range controls
	 * @param type
	 */
	const dateTypeChanged = (type: 'year' | 'date') => {
		setShowYearControls(type === 'year');

		if (type === 'year') {
			// Round selected dates to the larger year
			const newRangeState = {
				gte: rangeState.gte ? `${rangeState.gte.split('-')[0]}-01-01` : '',
				lte: rangeState.lte ? `${rangeState.lte.split('-')[0]}-12-31` : '',
			};
			setRangeState(newRangeState);
			setYearInputGte(rangeState.gte ? rangeState.gte.split('-')[0] : '');
			setYearInputLte(rangeState.lte ? rangeState.lte.split('-')[0] : '');
		}
	};

	const openDropdown = async () => {
		await resetInternalRangeState();
		setIsDropdownOpen(true);
	};

	const closeDropdown = () => setIsDropdownOpen(false);

	const getTag = () => {
		const { gte, lte } = range;
		const isGteStartOfYear = gte.includes('-01-01');
		const isLteEndOfYear = lte.includes('-12-31');
		const gteFormattedDate = reorderDate(gte);
		const lteFormattedDate = reorderDate(lte);
		const gteYear = gte.split('-')[0];
		const lteYear = lte.split('-')[0];
		let tagLabel: string | null = null;

		if (gte && lte) {
			if (isGteStartOfYear && isLteEndOfYear) {
				// only show years
				tagLabel = `${gteYear} - ${lteYear}`;
			} else {
				// show full dates
				tagLabel = `${reorderDate(gte)} - ${reorderDate(lte)}`;
			}
		} else if (gte) {
			tagLabel = `na ${isGteStartOfYear ? gteYear : gteFormattedDate}`;
		} else if (lte) {
			tagLabel = `voor ${isLteEndOfYear ? lteYear : lteFormattedDate}`;
		}

		if (tagLabel) {
			return [
				{
					label: tagLabel,
					id: 'date',
				},
			];
		}

		return []; // Do not render a filter if date object is empty: {gte: "", lte: ""}
	};

	const from = rangeState.gte;
	const till = rangeState.lte;
	let fromYear: string;
	let tillYear: string;

	// Get year from state or yearInputString
	if (showYearControls) {
		fromYear = (yearInputGte || from || '').split('-')[0];
		tillYear = (yearInputLte || till || '').split('-')[0];
	} else {
		fromYear = (from || yearInputGte || '').split('-')[0];
		tillYear = (till || yearInputLte || '').split('-')[0];
	}

	const fromDate: Date | null = from ? new Date(from) : null;
	const tillDate: Date | null = till ? new Date(till) : null;

	return (
		<Dropdown
			label={label}
			menuWidth="fit-content"
			isOpen={isDropdownOpen}
			onOpen={openDropdown}
			onClose={closeDropdown}
		>
			<DropdownButton>
				{renderDropdownButton(label, isDropdownOpen, getTag(), removeFilter)}
			</DropdownButton>
			<DropdownContent>
				<div className="u-spacer">
					<Form>
						<FormGroup
							label={t(
								'shared/components/date-range-dropdown/date-range-dropdown___hoe-specifiek'
							)}
						>
							<RadioButtonGroup inline>
								<RadioButton
									label={t(
										'shared/components/date-range-dropdown/date-range-dropdown___op-jaartal'
									)}
									name="year"
									value="year"
									checked={showYearControls}
									onChange={async (checked: boolean) => {
										if (checked) {
											await dateTypeChanged('year');
										}
									}}
								/>
								<RadioButton
									label={t(
										'shared/components/date-range-dropdown/date-range-dropdown___specifieke-datums'
									)}
									name="year"
									value="date"
									checked={!showYearControls}
									onChange={async (checked: boolean) => {
										if (checked) {
											await dateTypeChanged('date');
										}
									}}
								/>
							</RadioButtonGroup>
							{showYearControls && (
								<Grid>
									<Column size="6">
										<FormGroup
											label={t(
												'shared/components/date-range-dropdown/date-range-dropdown___van'
											)}
										>
											<TextInput
												id={`${id}-gte`}
												placeholder={t(
													'shared/components/date-range-dropdown/date-range-dropdown___jjjj'
												)}
												value={fromYear}
												onChange={(value: string) =>
													handleYearInputChange(value, 'gte')
												}
											/>
										</FormGroup>
									</Column>
									<Column size="6">
										<FormGroup
											label={t(
												'shared/components/date-range-dropdown/date-range-dropdown___tot'
											)}
										>
											<TextInput
												id={`${id}-lte`}
												placeholder={t(
													'shared/components/date-range-dropdown/date-range-dropdown___jjjj'
												)}
												value={tillYear}
												onChange={(value: string) =>
													handleYearInputChange(value, 'lte')
												}
											/>
										</FormGroup>
									</Column>
								</Grid>
							)}
							{!showYearControls && (
								<Grid>
									<Column size="6">
										<FormGroup
											label={t(
												'shared/components/date-range-dropdown/date-range-dropdown___van'
											)}
										>
											<DatePicker
												value={fromDate}
												onChange={value => handleDateChange(value, 'gte')}
											/>
										</FormGroup>
									</Column>
									<Column size="6">
										<FormGroup
											label={t(
												'shared/components/date-range-dropdown/date-range-dropdown___tot'
											)}
										>
											<DatePicker
												value={tillDate}
												onChange={value => handleDateChange(value, 'lte')}
											/>
										</FormGroup>
									</Column>
								</Grid>
							)}
						</FormGroup>
						<FormGroup>
							<Button
								label={t(
									'shared/components/date-range-dropdown/date-range-dropdown___toepassen'
								)}
								type="primary"
								className="c-apply-filter-button"
								block
								onClick={applyFilter}
							/>
						</FormGroup>
					</Form>
				</div>
			</DropdownContent>
		</Dropdown>
	);
};

export default DateRangeDropdown;
