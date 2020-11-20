import { isNil } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';

import {
	CheckboxDropdownModal,
	CheckboxOption,
} from '../CheckboxDropdownModal/CheckboxDropdownModal';

export interface BooleanCheckboxDropdownProps {
	label: string;
	id: string;
	disabled?: boolean;
	value: boolean | null | undefined;
	onChange: (value: boolean | null, id: string) => void;
}

const BooleanCheckboxDropdown: FunctionComponent<BooleanCheckboxDropdownProps> = ({
	label,
	id,
	disabled,
	value,
	onChange,
}) => {
	const [t] = useTranslation();

	const getOptions = (): CheckboxOption[] => {
		return [
			{
				label: t(
					'shared/components/boolean-checkbox-dropdown/boolean-checkbox-dropdown___ja'
				),
				id: 'true',
				checked: isNil(value) ? false : value,
			},
			{
				label: t(
					'shared/components/boolean-checkbox-dropdown/boolean-checkbox-dropdown___nee'
				),
				id: 'false',
				checked: isNil(value) ? false : !value,
			},
		];
	};

	// Methods
	const handleCheckboxChange = (selectedCheckboxes: string[]) => {
		if (selectedCheckboxes.length === 0 || selectedCheckboxes.length === 2) {
			onChange(null, id);
		} else if (selectedCheckboxes[0] === 'true') {
			onChange(true, id);
		} else {
			onChange(false, id);
		}
	};

	return (
		<CheckboxDropdownModal
			label={label}
			id={id}
			options={getOptions()}
			onChange={handleCheckboxChange}
			disabled={disabled}
		/>
	);
};

export default BooleanCheckboxDropdown;
