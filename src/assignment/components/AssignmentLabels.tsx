import { cloneDeep, get } from 'lodash-es';
import React, { FunctionComponent, MouseEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ValueType } from 'react-select';

import { Button, Flex, FlexItem, Spacer, TagList, TagOption } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ColorSelect } from '../../admin/content-block/components/fields';
import { ColorOption } from '../../admin/content-block/components/fields/ColorSelect/ColorSelect';
import { AssignmentLabelsService, ToastService } from '../../shared/services';

import './AssignmentLabels.scss';
import ManageAssignmentLabels from './modals/ManageAssignmentLabels';

interface AssignmentLabelsProps {
	labels: Avo.Assignment.Label[];
	user: Avo.User.User;
	onChange: (newLabels: Avo.Assignment.Label[]) => void;
}

const AssignmentLabels: FunctionComponent<AssignmentLabelsProps> = ({ labels, user, onChange }) => {
	const [t] = useTranslation();

	const [allAssignmentLabels, setAllAssignmentLabels] = useState<Avo.Assignment.Label[]>([]);
	const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = useState<boolean>(false);

	const fetchAssignmentLabels = useCallback(async () => {
		// Fetch labels every time the manage labels modal closes and once at startup
		const labels = await AssignmentLabelsService.getLabelsForProfile(get(user, 'profile.id'));
		setAllAssignmentLabels(labels);
	}, [user, setAllAssignmentLabels]);

	useEffect(() => {
		fetchAssignmentLabels();
	}, [fetchAssignmentLabels]);

	const getAssignmentLabelOptions = (labels: Avo.Assignment.Label[]): TagOption[] => {
		return labels.map((labelObj) => ({
			label: labelObj.label || '',
			id: labelObj.id,
			// labelObj.enum_color.label contains hex code (graphql enum quirk)
			// The value of the enum has to be uppercase text, so the value contains the color name
			color: labelObj.color_override || get(labelObj, 'enum_color.label'),
		}));
	};

	const handleManageAssignmentLabelsModalClosed = () => {
		fetchAssignmentLabels();
		setIsManageLabelsModalOpen(false);
	};

	const getColorOptions = (labels: Avo.Assignment.Label[]): ColorOption[] => {
		return labels.map((labelObj) => ({
			label: labelObj.label || '',
			value: String(labelObj.id),
			// labelObj.enum_color.label contains hex code (graphql enum quirk)
			// The value of the enum has to be uppercase text, so the value contains the color name
			color: labelObj.color_override || get(labelObj, 'enum_color.label'),
		}));
	};

	const addAssignmentLabel = (labelOption: ValueType<ColorOption>) => {
		if (!labelOption) {
			ToastService.danger(
				t(
					'assignment/views/assignment-edit___het-geselecteerde-label-kon-niet-worden-toegevoegd-aan-de-opdracht'
				)
			);
			return;
		}
		const assignmentLabel = allAssignmentLabels.find(
			(labelObj) => String(labelObj.id) === (labelOption as ColorOption).value
		);
		if (!assignmentLabel) {
			ToastService.danger(
				t(
					'assignment/views/assignment-edit___het-geselecteerde-label-kon-niet-worden-toegevoegd-aan-de-opdracht'
				)
			);
			return;
		}
		onChange([...labels, assignmentLabel]);
	};

	const deleteAssignmentLabel = (labelId: string | number, evt: MouseEvent) => {
		evt.stopPropagation();
		onChange(labels.filter((labelObj: Avo.Assignment.Label) => labelObj.id !== labelId));
	};

	const assignmentLabelIds = labels.map((labelObj) => labelObj.id);
	const unselectedLabels = cloneDeep(
		allAssignmentLabels.filter((labelObj) => !assignmentLabelIds.includes(labelObj.id))
	);

	return (
		<>
			<TagList
				closable={true}
				tags={getAssignmentLabelOptions(labels)}
				onTagClosed={deleteAssignmentLabel}
			/>
			<Flex>
				<FlexItem>
					<Spacer margin="right-small">
						<ColorSelect
							options={getColorOptions(unselectedLabels)}
							value={null}
							onChange={addAssignmentLabel}
							placeholder={t(
								'assignment/views/assignment-edit___voeg-een-vak-of-project-toe'
							)}
							noOptionsMessage={() =>
								t(
									'assignment/views/assignment-edit___geen-vakken-of-projecten-beschikbaar'
								)
							}
						/>
					</Spacer>
				</FlexItem>
				<FlexItem shrink>
					<Button
						icon="settings"
						title="Beheer je vakken en projecten"
						ariaLabel="Beheer je vakken en projecten"
						type="borderless"
						size="large"
						className="c-button__labels"
						onClick={() => setIsManageLabelsModalOpen(true)}
					/>
				</FlexItem>
			</Flex>

			<ManageAssignmentLabels
				onClose={handleManageAssignmentLabelsModalClosed}
				isOpen={isManageLabelsModalOpen}
				user={user}
			/>
		</>
	);
};

export default AssignmentLabels;
