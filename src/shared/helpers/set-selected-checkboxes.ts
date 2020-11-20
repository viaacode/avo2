import { CheckboxOption } from '../components';

export function setSelectedCheckboxes(
	options: CheckboxOption[],
	selectedIds: string[]
): CheckboxOption[] {
	return options.map((option) => {
		option.checked = !!selectedIds.find((id) => id === String(option.id));
		return option;
	});
}
