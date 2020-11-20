import produce, { Draft } from 'immer';
import { cloneDeep } from 'lodash-es';

import { RichEditorState } from '@viaa/avo2-components/dist/esm/wysiwyg';
import { Avo } from '@viaa/avo2-types';

import { ToastService } from '../../../../shared/services';
import i18n from '../../../../shared/translations/i18n';
import { ValueOf } from '../../../../shared/types';
import { InteractiveTourService } from '../../interactive-tour.service';
import {
	EditableInteractiveTour,
	InteractiveTourEditActionType,
	InteractiveTourState,
} from '../../interactive-tour.types';

type StepPropUpdateAction = {
	type: InteractiveTourEditActionType.UPDATE_STEP_PROP;
	stepIndex: number;
	stepProp: keyof Avo.InteractiveTour.Step | 'contentState';
	stepPropValue: ValueOf<Avo.InteractiveTour.Step> | RichEditorState;
};

type StepSwapAction = {
	type: InteractiveTourEditActionType.SWAP_STEPS;
	index: number;
	direction: 'up' | 'down';
};

type StepRemoveAction = {
	type: InteractiveTourEditActionType.REMOVE_STEP;
	index: number;
};

type InteractiveTourUpdateAction = {
	type: InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR;
	newInteractiveTour: EditableInteractiveTour | null;
	updateInitialInteractiveTour?: boolean;
};

type InteractiveTourPropUpdateAction = {
	type: InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR_PROP;
	interactiveTourProp: keyof EditableInteractiveTour;
	interactiveTourPropValue: ValueOf<EditableInteractiveTour>;
	updateInitialInteractiveTour?: boolean;
};

export type InteractiveTourAction =
	| StepPropUpdateAction
	| StepSwapAction
	| StepRemoveAction
	| InteractiveTourUpdateAction
	| InteractiveTourPropUpdateAction;

export const INTERACTIVE_TOUR_EDIT_INITIAL_STATE = (): InteractiveTourState => ({
	currentInteractiveTour: null,
	initialInteractiveTour: null,
	formErrors: {},
});

// Reducer
export const interactiveTourEditReducer = produce(
	(draft: Draft<InteractiveTourState>, action: InteractiveTourAction) => {
		// Because we use immer, we have to mutate the draft state in place for it to work properly
		// We don't have to return anything because our produce() will automagically do that for us

		if (action.type === InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR) {
			draft.currentInteractiveTour = action.newInteractiveTour;
			draft.initialInteractiveTour = cloneDeep(action.newInteractiveTour);
			return;
		}

		if (!draft.currentInteractiveTour) {
			ToastService.danger(
				i18n.t(
					'admin/interactive-tour/views/interactive-tour-edit___de-interactieve-tour-is-nog-niet-geladen'
				)
			);
			return;
		}

		switch (action.type) {
			case InteractiveTourEditActionType.UPDATE_STEP_PROP:
				draft.currentInteractiveTour.steps[action.stepIndex] = {
					...draft.currentInteractiveTour.steps[action.stepIndex],
					[action.stepProp]: action.stepPropValue,
				};
				break;

			case InteractiveTourEditActionType.SWAP_STEPS:
				if (
					!draft.currentInteractiveTour.steps ||
					!draft.currentInteractiveTour.steps.length
				) {
					ToastService.danger(
						i18n.t(
							'admin/interactive-tour/views/interactive-tour-edit___deze-interactive-tour-lijkt-geen-stappen-te-bevatten'
						)
					);
					return;
				}

				const delta = action.direction === 'up' ? -1 : 1;

				draft.currentInteractiveTour.steps = InteractiveTourService.swapStepPositions(
					draft.currentInteractiveTour.steps || [],
					action.index,
					delta
				);
				draft.formErrors = {};
				break;

			case InteractiveTourEditActionType.REMOVE_STEP:
				const newSteps = draft.currentInteractiveTour.steps;
				newSteps.splice(action.index, 1);
				draft.currentInteractiveTour.steps = newSteps;
				draft.formErrors = {};
				break;

			case InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR_PROP:
				const prop = action.interactiveTourProp;
				(draft.currentInteractiveTour as any)[prop] = action.interactiveTourPropValue;
				if (action.updateInitialInteractiveTour) {
					(draft.initialInteractiveTour as any)[prop] = action.interactiveTourPropValue;
				}
				break;
		}
	}
);
