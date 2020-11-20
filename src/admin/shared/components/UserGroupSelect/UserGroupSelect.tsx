import { isEmpty } from 'lodash-es';
import React, { FunctionComponent } from 'react';

import { FormGroup, TagInfo, TagsInput } from '@viaa/avo2-components';

import { useUserGroupOptions } from '../../../user-groups/hooks/useUserGroupOptions';

export interface UserGroupSelectProps {
	label: string;
	error: string | undefined;
	placeholder: string;
	values: number[];
	required: boolean;
	onChange: (selectedUserGroupIds: number[]) => void;
}

export const UserGroupSelect: FunctionComponent<UserGroupSelectProps> = ({
	label,
	error,
	placeholder,
	values,
	onChange,
	required,
}) => {
	const [userGroupOptions] = useUserGroupOptions('TagInfo', true) as [TagInfo[], boolean];

	const handleSelectOnChange = (values: TagInfo[] | null) => {
		onChange((values || []).map((val) => val.value as number));
	};

	const selectedOptions = userGroupOptions.filter((userGroupOption: TagInfo) => {
		return values.includes(userGroupOption.value as number);
	});

	if (isEmpty(userGroupOptions)) {
		return null;
	}
	return (
		<FormGroup error={error} label={label} required={required}>
			<TagsInput
				placeholder={placeholder}
				options={userGroupOptions}
				onChange={handleSelectOnChange}
				value={selectedOptions}
			/>
		</FormGroup>
	);
};
