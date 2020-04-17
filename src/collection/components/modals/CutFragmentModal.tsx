import { clamp, get } from 'lodash-es';
import React, { FunctionComponent, KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	ButtonToolbar,
	Container,
	FlowPlayer,
	Modal,
	ModalBody,
	MultiRange,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import {
	CustomError,
	formatDurationHoursMinutesSeconds,
	getEnv,
	toSeconds,
} from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import { fetchPlayerTicket } from '../../../shared/services/player-ticket-service';
import { getVideoStills } from '../../../shared/services/stills-service';
import { KeyCode } from '../../../shared/types';

import { getValidationErrorsForStartAndEnd } from '../../collection.helpers';
import { CollectionAction } from '../CollectionOrBundleEdit';

interface CutFragmentModalProps {
	isOpen: boolean;
	itemMetaData: Avo.Item.Item;
	index: number;
	fragment: Avo.Collection.Fragment;
	changeCollectionState: (action: CollectionAction) => void;
	updateCuePoints: (cuepoints: any) => void;
	onClose: () => void;
}

const CutFragmentModal: FunctionComponent<CutFragmentModalProps> = ({
	isOpen,
	itemMetaData,
	index,
	fragment,
	changeCollectionState,
	updateCuePoints,
	onClose,
}) => {
	const [t] = useTranslation();

	// Save initial state for reusability purposess
	const { start, end, startString, endString } = {
		start: fragment.start_oc || 0,
		end: fragment.end_oc || toSeconds(itemMetaData.duration, true) || 0,
		startString: formatDurationHoursMinutesSeconds(fragment.start_oc || 0),
		endString: formatDurationHoursMinutesSeconds(
			fragment.end_oc || toSeconds(itemMetaData.duration, true) || 0
		),
	};
	const itemMeta = fragment.item_meta as Avo.Item.Item;

	const [playerTicket, setPlayerTicket] = useState<string>();
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

		const videoStills = await getVideoStills([
			{ externalId: fragment.external_id, startTime: startTime || 0 },
		]);

		const hasNoCut = startTime === 0 && endTime === fragmentDuration;

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

		if (videoStills && videoStills.length) {
			changeCollectionState({
				index,
				type: 'UPDATE_FRAGMENT_PROP',
				fragmentProp: 'thumbnail_path',
				fragmentPropValue: videoStills[0].previewImagePath,
			});
		}

		updateCuePoints({
			start: startTime,
			end: endTime,
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

	const initFlowPlayer = () =>
		!playerTicket &&
		fetchPlayerTicket(itemMetaData.external_id).then(data => setPlayerTicket(data));

	const fragmentDuration: number = toSeconds(itemMetaData.duration, true) || 0;
	return (
		<Modal
			isOpen={isOpen}
			title={t('collection/components/modals/cut-fragment-modal___knip-fragment')}
			size="medium"
			onClose={onClose}
			scrollable
		>
			<ModalBody>
				<FlowPlayer
					src={playerTicket ? playerTicket.toString() : null}
					poster={itemMetaData.thumbnail_path}
					title={itemMetaData.title}
					onInit={initFlowPlayer}
					subtitles={[itemMetaData.issued, get(itemMetaData, 'organisation.name', '')]}
					token={getEnv('FLOW_PLAYER_TOKEN')}
					dataPlayerId={getEnv('FLOW_PLAYER_ID')}
					logo={get(itemMetaData, 'organisation.logo_url')}
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
