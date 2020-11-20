import { RichEditorState } from '@viaa/avo2-components/dist/esm/wysiwyg';
import { Avo } from '@viaa/avo2-types';

import { FilterableTableState } from '../shared/components/FilterTable/FilterTable';

export type InteractiveTourOverviewTableCols =
	| 'name'
	| 'page_id'
	| 'created_at'
	| 'updated_at'
	| 'actions';

export interface InteractiveTourEditFormErrorState {
	name?: string;
	page_id?: string;
	steps?: { title?: string; content?: string }[];
}

export interface InteractiveTourTableState extends FilterableTableState {
	name: string;
	page_id: string;
	created_at: string;
	updated_at: string;
}

export type InteractiveTourPageType = 'static' | 'content';

export enum InteractiveTourEditActionType {
	UPDATE_STEP_PROP = '@@admin-interactive-tour-edit/UPDATE_STEP_PROP',
	SWAP_STEPS = '@@admin-interactive-tour-edit/SWAP_STEPS',
	REMOVE_STEP = '@@admin-interactive-tour-edit/REMOVE_STEP',
	UPDATE_INTERACTIVE_TOUR = '@@admin-interactive-tour-edit/UPDATE_INTERACTIVE_TOUR',
	UPDATE_INTERACTIVE_TOUR_PROP = '@@admin-interactive-tour-edit/UPDATE_INTERACTIVE_TOUR_PROP',
}

export interface EditableStep extends Avo.InteractiveTour.Step {
	contentState: RichEditorState | undefined;
}

export interface EditableInteractiveTour extends Avo.InteractiveTour.InteractiveTour {
	steps: EditableStep[];
}

export interface InteractiveTourState {
	currentInteractiveTour: EditableInteractiveTour | null;
	initialInteractiveTour: EditableInteractiveTour | null;
	formErrors: InteractiveTourEditFormErrorState | null;
}
