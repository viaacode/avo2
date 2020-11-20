import { clamp } from 'lodash-es';
import React, { FunctionComponent, KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	ButtonToolbar,
	Container,
	Modal,
	ModalBody,
	MultiRange,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { FlowPlayerWrapper } from '../../../shared/components';
import { CustomError, formatDurationHoursMinutesSeconds, toSeconds } from '../../../shared/helpers';
import { getValidStartAndEnd } from '../../../shared/helpers/cut-start-and-end';
import { ToastService } from '../../../shared/services';
import { VideoStillService } from '../../../shared/services/video-stills-service';
import { KeyCode } from '../../../shared/types';
import { getValidationErrorsForStartAndEnd } from '../../collection.helpers';
import { CollectionAction } from '../CollectionOrBundleEdit';

import './CutFragmentModal.scss';

interface CutFragmentModalProps {
	isOpen: boolean;
	itemMetaData: Avo.Item.Item;
	index: number;
	fragment: Avo.Collection.Fragment;
	changeCollectionState: (action: CollectionAction) => void;
	onClose: () => void;
}

const CutFragmentModal: FunctionComponent<CutFragmentModalProps> = ({
	isOpen,
	itemMetaData,
	index,
	fragment,
	changeCollectionState,
	onClose,
}) => {
	const [t] = useTranslation();

	// Save initial state for reusability purposes
	const [start, end] = getValidStartAndEnd(
		fragment.start_oc,
		fragment.end_oc,
		toSeconds(itemMetaData.duration)
	);
	const startString = formatDurationHoursMinutesSeconds(start);
	const endString = formatDurationHoursMinutesSeconds(end);
	const itemMeta = fragment.item_meta as Avo.Item.Item;

	const [fragmentStart, setFragmentStart] = useState<number>(start);
	const [fragmentEnd, setFragmentEnd] = useState<number>(end);
	const [fragmentStartString, setFragmentStartString] = useState<string>(startString);
	const [fragmentEndString, setFragmentEndString] = useState<string>(endString);

	const getValidationErrors = (): string[] => {
		const startTime = toSeconds(fragmentStartString, true);
		const endTime = toSeconds(fragmentEndString, true);

		return getValidationErrorsForStartAndEnd({
			...fragment,
			start_oc: startTime,
			end_oc: endTime,
		});
	};

	const onSaveCut = async () => {
		setFragmentStart(toSeconds(fragmentStartString, true) as number);
		setFragmentEnd(toSeconds(fragmentEndString, true) as number);
		setFragmentStartString(formatDurationHoursMinutesSeconds(fragmentStart));
		setFragmentEndString(formatDurationHoursMinutesSeconds(fragmentEnd));

		const errors = getValidationErrors();

		if (errors && errors.length) {
			ToastService.danger(errors);

			return;
		}

		const startTime = toSeconds(fragmentStartString, true);
		const endTime = toSeconds(fragmentEndString, true);

		const hasNoCut = startTime === 0 && endTime === fragmentDuration;

		const videoStill: string = hasNoCut
			? itemMetaData.thumbnail_path
			: await VideoStillService.getVideoStill(fragment.external_id, (startTime || 0) * 1000);

		changeCollectionState({
			index,
			type: 'UPDATE_FRAGMENT_PROP',
			fragmentProp: 'start_oc',
			fragmentPropValue: hasNoCut ? null : startTime,
		});

		changeCollectionState({
			index,
			type: 'UPDATE_FRAGMENT_PROP',
			fragmentProp: 'end_oc',
			fragmentPropValue: hasNoCut ? null : endTime,
		});

		if (videoStill) {
			changeCollectionState({
				index,
				type: 'UPDATE_FRAGMENT_PROP',
				fragmentProp: 'thumbnail_path',
				fragmentPropValue: videoStill,
			});
		}

		changeCollectionState({
			index,
			type: 'UPDATE_FRAGMENT_PROP',
			fragmentProp: 'start_oc',
			fragmentPropValue: startTime,
		});

		changeCollectionState({
			index,
			type: 'UPDATE_FRAGMENT_PROP',
			fragmentProp: 'end_oc',
			fragmentPropValue: endTime,
		});
		onClose();
	};

	const onCancelCut = () => {
		// Reset to default state
		setFragmentStart(start);
		setFragmentEnd(end);
		setFragmentStartString(startString);
		setFragmentEndString(endString);

		// Close modal
		onClose();
	};

	/**
	 * Checks in the text input fields have a correct value
	 */
	const parseTimes = () => {
		// Limit start end and times between 0 and fragment duration
		let startTime = toSeconds(fragmentStartString, true) as number;
		let endTime = toSeconds(fragmentEndString, true) as number;
		const duration = (itemMeta && itemMeta.duration && toSeconds(itemMeta.duration)) || 0;
		if (startTime) {
			startTime = clamp(startTime, 0, duration);
			setFragmentStart(startTime);
			setFragmentStartString(formatDurationHoursMinutesSeconds(startTime));
		}
		if (endTime) {
			endTime = clamp(endTime, 0, duration);
			setFragmentEnd(endTime);
			setFragmentEndString(formatDurationHoursMinutesSeconds(endTime));
		}
	};

	const onUpdateMultiRangeValues = (values: number[]) => {
		setFragmentStart(values[0]);
		setFragmentEnd(values[1]);
		setFragmentStartString(formatDurationHoursMinutesSeconds(values[0]));
		setFragmentEndString(formatDurationHoursMinutesSeconds(values[1]));
	};

	const handleOnKeyUp = (evt: KeyboardEvent<HTMLInputElement>) => {
		try {
			if (evt.keyCode === KeyCode.Enter) {
				parseTimes();
			}
		} catch (err) {
			console.error(new CustomError('Failed to parse times on enter key', err));
			ToastService.danger(
				t(
					'collection/components/modals/cut-fragment-modal___de-ingevulde-tijd-heeft-geen-geldig-formaat'
				)
			);
		}
	};

	const fragmentDuration: number = toSeconds(itemMetaData.duration, true) || 0;
	return (
		<Modal
			isOpen={isOpen}
			title={t('collection/components/modals/cut-fragment-modal___knip-fragment')}
			size="medium"
			onClose={onClose}
			scrollable
			className="m-cut-fragment-modal"
		>
			<ModalBody>
				<FlowPlayerWrapper
					item={{
						...itemMetaData,
						thumbnail_path: fragment.thumbnail_path || itemMetaData.thumbnail_path,
					}}
					seekTime={fragmentStart}
					cuePoints={{
						start: fragmentStart,
						end: fragmentEnd,
					}}
					canPlay={isOpen}
				/>
				<Container mode="vertical" className="m-time-crop-controls">
					<TextInput
						value={fragmentStartString}
						onChange={setFragmentStartString}
						onBlur={parseTimes}
						onKeyUp={handleOnKeyUp}
					/>
					<div className="m-multi-range-wrapper">
						<MultiRange
							values={[fragmentStart, Math.min(fragmentEnd, fragmentDuration)]}
							onChange={onUpdateMultiRangeValues}
							min={0}
							max={fragmentDuration}
							step={1}
						/>
					</div>
					<TextInput
						value={fragmentEndString}
						onChange={setFragmentEndString}
						onBlur={parseTimes}
						onKeyUp={handleOnKeyUp}
					/>
				</Container>
				<Toolbar spaced>
					<ToolbarRight>
						<ToolbarItem>
							<ButtonToolbar>
								<Button
									type="secondary"
									label={t(
										'collection/components/modals/cut-fragment-modal___annuleren'
									)}
									onClick={onCancelCut}
								/>
								<Button
									type="primary"
									label={t(
										'collection/components/modals/cut-fragment-modal___knippen'
									)}
									onClick={onSaveCut}
								/>
							</ButtonToolbar>
						</ToolbarItem>
					</ToolbarRight>
				</Toolbar>
			</ModalBody>
		</Modal>
	);
};

export default CutFragmentModal;
