import { ExecutionResult } from '@apollo/react-common';
import { cloneDeep, get } from 'lodash-es';
import { ApolloCacheManager } from '../shared/services/data-service';
import toastService, { TOAST_TYPE } from '../shared/services/toast-service';
import { Assignment, AssignmentLayout } from './types';

/**
 * Helper functions for inserting, updating, validating and deleting assigment
 * This will be used by the Assignments view and the AssignmentEdit view
 * @param assignment
 */
const validateAssignment = (assignment: Partial<Assignment>): [string[], Assignment] => {
	const assignmentToSave = cloneDeep(assignment);
	const errors = [];

	if (!assignmentToSave.title) {
		errors.push('Een titel is verplicht');
	}

	if (!assignmentToSave.description) {
		errors.push('Een beschrijving is verplicht');
	}

	assignmentToSave.content_layout =
		assignmentToSave.content_layout || AssignmentLayout.PlayerAndText;

	if (assignmentToSave.answer_url && !/^(https?:)?\/\//.test(assignmentToSave.answer_url)) {
		assignmentToSave.answer_url = `//${assignmentToSave.answer_url}`;
	}

	if (!assignmentToSave.deadline_at) {
		errors.push('Een deadline is verplicht');
	}

	assignmentToSave.owner_profile_id = assignmentToSave.owner_profile_id || 'owner_profile_id';
	assignmentToSave.is_archived = assignmentToSave.is_archived || false;
	assignmentToSave.is_deleted = assignmentToSave.is_deleted || false;
	assignmentToSave.is_collaborative = assignmentToSave.is_collaborative || false;
	delete assignmentToSave.assignment_responses; // = assignmentToSave.assignment_responses || [];
	delete assignmentToSave.assignment_assignment_tags; // = assignmentToSave.assignment_assignment_tags || {
	// 	assignment_tag: [],
	// };
	delete (assignmentToSave as any).__typename;
	return [errors, assignmentToSave as Assignment];
};

export const deleteAssignment = async (triggerAssignmentDelete: any, id: number | string) => {
	try {
		await triggerAssignmentDelete({
			variables: { id },
			update: ApolloCacheManager.clearAssignmentCache,
		});
	} catch (err) {
		console.error(err);
		throw new Error('Failed to delete assignment');
	}
};

export const updateAssignment = async (
	triggerAssignmentUpdate: any,
	assignment: Partial<Assignment>
): Promise<Assignment | null> => {
	try {
		const [validationErrors, assignmentToSave] = validateAssignment({ ...assignment });

		if (validationErrors.length) {
			toastService(validationErrors.join('<br/>'), TOAST_TYPE.DANGER);
			return null;
		}

		const response: void | ExecutionResult<Assignment> = await triggerAssignmentUpdate({
			variables: {
				id: assignment.id,
				assignment: assignmentToSave,
			},
			update: ApolloCacheManager.clearAssignmentCache,
		});

		if (!response || !response.data) {
			console.error('assignment update returned empty response', response);
			throw new Error('Het opslaan van de opdracht is mislukt');
		}

		return assignment as Assignment;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const insertAssignment = async (
	triggerAssignmentInsert: any,
	assignment: Partial<Assignment>
): Promise<Assignment | null> => {
	try {
		const [validationErrors, assignmentToSave] = validateAssignment({ ...assignment });

		if (validationErrors.length) {
			toastService(validationErrors.join('<br/>'), TOAST_TYPE.DANGER);
			return null;
		}

		const response: void | ExecutionResult<Assignment> = await triggerAssignmentInsert({
			variables: {
				assignment: assignmentToSave,
			},
			update: ApolloCacheManager.clearAssignmentCache,
		});

		const id = get(response, 'data.insert_app_assignments.returning[0].id');

		if (typeof id !== undefined) {
			return {
				...assignment, // Do not copy the auto modified fields from the validation back into the input controls
				id,
			} as Assignment;
		}

		console.error('assignment insert returned empty response', response);
		throw Error('Het opslaan van de opdracht is mislukt');
	} catch (err) {
		console.error(err);
		throw err;
	}
};