import { cloneDeep } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { Step } from 'react-joyride';

import { Button, Container, Toolbar, ToolbarItem } from '@viaa/avo2-components';

import { InteractiveTour } from '../interactive-tour.types';
import { InteractiveTourAction } from '../views/InteractiveTourEdit';

interface InteractiveTourAddProps {
	index: number;
	interactiveTour: InteractiveTour;
	changeInteractiveTourState: (action: InteractiveTourAction) => void;
}

const InteractiveTourAdd: FunctionComponent<InteractiveTourAddProps> = ({
	index,
	interactiveTour,
	changeInteractiveTourState,
}) => {
	const [t] = useTranslation();

	const getStepsAfterInsertNewStep = (): Step[] => {
		const steps = cloneDeep(interactiveTour.steps || []);

		steps.splice(index, 0, {
			title: '',
			content: '',
			target: '',
		});
		return steps;
	};

	// Listeners
	const handleAddStepClick = () => {
		changeInteractiveTourState({
			type: 'UPDATE_INTERACTIVE_TOUR_PROP',
			interactiveTourProp: 'steps',
			interactiveTourPropValue: getStepsAfterInsertNewStep(),
		});
	};

	// Render methods
	const renderDivider = () => (
		<ToolbarItem grow>
			<div className="c-hr" />
		</ToolbarItem>
	);

	return (
		<Container>
			<Toolbar justify>
				{renderDivider()}
				<ToolbarItem>
					<Button
						type="secondary"
						icon="add"
						onClick={handleAddStepClick}
						ariaLabel={t('Stap toevoegen')}
						title={t('Stap toevoegen')}
					/>
				</ToolbarItem>
				{renderDivider()}
			</Toolbar>
		</Container>
	);
};

export default InteractiveTourAdd;
