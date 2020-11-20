import { compact, get, intersection, sortBy, without } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ValueType } from 'react-select';

import {
	Button,
	ButtonToolbar,
	Modal,
	ModalBody,
	ModalFooterRight,
	Spacer,
	Spinner,
	Table,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ColorSelect } from '../../../admin/content-block/components/fields';
import { CustomError } from '../../../shared/helpers';
import { generateRandomId } from '../../../shared/helpers/uuid';
import { UserProps } from '../../../shared/hocs/withUser';
import { AssignmentLabelsService, ToastService } from '../../../shared/services';
import { AssignmentLabelColor } from '../../assignment.types';

import './ManageAssignmentLabels.scss';

interface ManageAssignmentLabelsProps extends UserProps {
	onClose: () => void;
	isOpen: boolean;
}

const ManageAssignmentLabels: FunctionComponent<ManageAssignmentLabelsProps> = ({
	isOpen,
	onClose,
	user,
}) => {
	const [t] = useTranslation();

	const [assignmentLabels, setAssignmentLabels] = useState<Avo.Assignment.Label[]>([]);
	const [initialAssignmentLabels, setInitialAssignmentLabels] = useState<Avo.Assignment.Label[]>(
		[]
	);
	const [assignmentLabelColors, setAssignmentLabelColors] = useState<AssignmentLabelColor[]>([]);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	const fetchAssignmentLabels = useCallback(async () => {
		try {
			const labels = sortBy(
				await AssignmentLabelsService.getLabelsForProfile(get(user, 'profile.id')),
				'label'
			);
			setAssignmentLabels(labels);
			setInitialAssignmentLabels(labels);
		} catch (err) {
			console.error(
				new CustomError('Failed to fetch assignment labels for user', err, { user })
			);
			ToastService.danger(
				t(
					'assignment/components/modals/manage-assignment-labels___het-ophalen-van-je-labels-is-mislukt'
				)
			);
		}
	}, [user, setAssignmentLabels, t]);

	const fetchAssignmentColors = useCallback(async () => {
		try {
			setAssignmentLabelColors(await AssignmentLabelsService.getLabelColors());
		} catch (err) {
			console.error(new CustomError('Failed to fetch assignment label colors', err));
			ToastService.danger(
				t(
					'assignment/components/modals/manage-assignment-labels___het-ophalen-van-je-label-kleuren-is-mislukt'
				)
			);
		}
	}, [setAssignmentLabelColors, t]);

	useEffect(() => {
		if (isOpen) {
			// Fetch labels and colors when modal opens
			fetchAssignmentLabels();
			fetchAssignmentColors();
		}
	}, [fetchAssignmentLabels, fetchAssignmentColors, isOpen]);

	const handleAddLabelClick = () => {
		setAssignmentLabels([
			...assignmentLabels,
			{
				id: -generateRandomId(),
				label: '',
				color_enum_value: assignmentLabelColors[0].value,
				owner_profile_id: get(user, 'profile.id'),
				color_override: null,
				enum_color: assignmentLabelColors[0],
			},
		]);
	};

	const handleRowColorChanged = (
		assignmentLabel: Avo.Assignment.Label,
		newColor: ValueType<AssignmentLabelColor>
	) => {
		if (!newColor) {
			return;
		}
		assignmentLabel.color_enum_value = (newColor as AssignmentLabelColor).value;
		setAssignmentLabels([...assignmentLabels]);
	};

	const handleRowLabelChanged = (assignmentLabel: Avo.Assignment.Label, newLabel: string) => {
		assignmentLabel.label = newLabel;
		setAssignmentLabels([...assignmentLabels]);
	};

	const handleRowDelete = (id: number) => {
		setAssignmentLabels([...assignmentLabels.filter((labelObj) => labelObj.id !== id)]);
	};

	const handleSaveLabels = async () => {
		try {
			setIsProcessing(true);
			const initialAssignmentLabelIds = initialAssignmentLabels.map((l) => l.id);
			const updatedAssignmentLabelIds = assignmentLabels.map((l) => l.id);

			const newIds = without(updatedAssignmentLabelIds, ...initialAssignmentLabelIds);
			const oldIds = without(initialAssignmentLabelIds, ...updatedAssignmentLabelIds);
			const updatedIds = intersection(initialAssignmentLabelIds, updatedAssignmentLabelIds);

			const newLabels = compact(
				newIds.map((newId) => assignmentLabels.find((l) => l.id === newId))
			);
			const updatedLabels = compact(
				updatedIds.map((updatedId) => assignmentLabels.find((l) => l.id === updatedId))
			);

			const profileId = get(user, 'profile.id');
			await Promise.all([
				AssignmentLabelsService.insertLabels(newLabels),
				AssignmentLabelsService.deleteLabels(profileId, oldIds),
				updatedLabels.map((l) =>
					AssignmentLabelsService.updateLabel(
						profileId,
						l.id,
						l.label || '',
						l.color_enum_value
					)
				),
			]);
			onClose();
			ToastService.success(
				t(
					'assignment/components/modals/manage-assignment-labels___de-labels-zijn-opgeslagen'
				)
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to save label changes', err, {
					initialAssignmentLabels,
					assignmentLabels,
				})
			);
			ToastService.danger(
				t(
					'assignment/components/modals/manage-assignment-labels___het-opslaan-van-de-labels-is-mislukt'
				)
			);
		}
		setIsProcessing(false);
	};

	const renderCell = (rowData: any, columnId: string) => {
		const assignmentLabel = rowData as Avo.Assignment.Label;
		const colorOptions = assignmentLabelColors.map((assignmentLabelColor) => ({
			label: '',
			value: assignmentLabelColor.value,
			color: assignmentLabelColor.label,
		}));
		switch (columnId) {
			case 'color':
				return (
					<Spacer margin="right-small">
						<ColorSelect
							options={colorOptions}
							value={colorOptions.find(
								(colorOption) =>
									colorOption.value === assignmentLabel.color_enum_value
							)}
							onChange={(newColor) =>
								handleRowColorChanged(assignmentLabel, newColor)
							}
						/>
					</Spacer>
				);

			case 'label':
				return (
					<Spacer margin="right-small">
						<TextInput
							value={assignmentLabel.label || ''}
							onChange={(newLabel) =>
								handleRowLabelChanged(assignmentLabel, newLabel)
							}
						/>
					</Spacer>
				);

			case 'actions':
				return (
					<Button
						ariaLabel={t(
							'assignment/components/modals/manage-assignment-labels___verwijder-dit-label'
						)}
						title={t(
							'assignment/components/modals/manage-assignment-labels___verwijder-dit-label'
						)}
						onClick={() => handleRowDelete(assignmentLabel.id)}
						type="danger-hover"
						icon="delete"
					/>
				);
		}
	};

	return (
		<Modal
			className="m-manage-assignment-labels"
			title={t(
				'assignment/components/modals/manage-assignment-labels___beheer-vakken-en-projecten'
			)}
			size="large"
			isOpen={isOpen}
			onClose={onClose}
			scrollable
		>
			<ModalBody>
				<Spacer margin="bottom-large">
					<Button
						label={t(
							'assignment/components/modals/manage-assignment-labels___label-toevoegen'
						)}
						icon="plus"
						onClick={handleAddLabelClick}
						type="secondary"
					/>
				</Spacer>
				<Table
					columns={[
						{
							label: t(
								'assignment/components/modals/manage-assignment-labels___kleur'
							),
							id: 'color',
							col: '2',
						},
						{
							label: t(
								'assignment/components/modals/manage-assignment-labels___label'
							),
							id: 'label',
						},
						{ label: '', id: 'actions' },
					]}
					emptyStateMessage={t(
						'assignment/components/modals/manage-assignment-labels___er-zijn-nog-geen-labels-aangemaakt'
					)}
					data={assignmentLabels}
					renderCell={renderCell}
					rowKey="id"
				/>
			</ModalBody>
			<ModalFooterRight>
				<Toolbar spaced>
					<ToolbarRight>
						<ToolbarItem>
							<ButtonToolbar>
								{isProcessing && <Spinner />}
								<Button
									label={t(
										'assignment/components/modals/manage-assignment-labels___annuleren'
									)}
									type="secondary"
									block
									onClick={onClose}
									disabled={isProcessing}
								/>
								<Button
									label={t(
										'assignment/components/modals/manage-assignment-labels___opslaan'
									)}
									type="primary"
									block
									disabled={isProcessing}
									onClick={handleSaveLabels}
								/>
							</ButtonToolbar>
						</ToolbarItem>
					</ToolbarRight>
				</Toolbar>
			</ModalFooterRight>
		</Modal>
	);
};

export default ManageAssignmentLabels;
