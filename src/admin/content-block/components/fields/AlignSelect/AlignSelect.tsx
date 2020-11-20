import React, { FunctionComponent } from 'react';

import { Button, ButtonGroup, IconName } from '@viaa/avo2-components';

import { AlignOption } from '../../../../shared/types';

interface AlignSelectProps {
	onChange: (value: string) => void;
	options: { label: string; value: AlignOption }[];
	value: AlignOption;
}

const AlignSelect: FunctionComponent<AlignSelectProps> = ({ onChange, options, value }) => {
	return (
		<ButtonGroup>
			{options.map((option) => (
				<Button
					key={`heading-block-align-${option.value}`}
					active={value === option.value}
					icon={`align-${option.value}` as IconName}
					onClick={() => onChange(option.value)}
					title={option.label}
					type="secondary"
				/>
			))}
		</ButtonGroup>
	);
};

export default AlignSelect;
