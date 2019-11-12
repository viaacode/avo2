import { clamp } from 'lodash-es';
import React, { FunctionComponent, KeyboardEvent, useState } from 'react';

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

import { getEnv } from '../../../shared/helpers/env';
import { formatDurationHoursMinutesSeconds } from '../../../shared/helpers/formatters/duration';
import { toSeconds } from '../../../shared/helpers/parsers/duration';
import { fetchPlayerTicket } from '../../../shared/services/player-ticket-service';
import toastService, { TOAST_TYPE } from '../../../shared/services/toast-service';
import { getValidationErrorsForStartAndEnd } from '../../helpers/validation';

export interface FragmentPropertyUpdateInfo {
	value: string | number | boolean | null;
	fieldName: keyof Avo.Collection.Fragment;
	fragmentId: number;
}

interface CutFragmentModalProps {
	isOpen: boolean;
	itemMetaData: Avo.Item.Item;
	fragment: Avo.Collection.Fragment;
	updateFragmentProperties: (updateInfos: FragmentPropertyUpdateInfo[]) => void;
	updateCuePoints: (cuepoints: any) => void;
	onClose: () => void;
}

const CutFragmentModal: FunctionComponent<CutFragmentModalProps> = ({
	onClose,
	isOpen,
	itemMetaData,
	updateFragmentProperties,
	fragment,
	updateCuePoints,
}) => {
	// Save initial state for reusability purposess
	const { start, end, startString, endString } = {
		start: fragment.start_oc || 0,
		end: fragment.end_oc || toSeconds(itemMetaData.duration, true) || 0,
		startString: formatDurationHoursMinutesSeconds(fragment.start_oc || 0),
		endString: formatDurationHoursMinutesSeconds(
			fragment.end_oc || toSeconds(itemMetaData.duration, true) || 0
		),
	};

	const [playerTicket, setPlayerTicket] = useState<string>();
	const [fragmentStart, setFragmentStart] = useState<number>(start);
	const [fragmentEnd, setFragmentEnd] = useState<number>(end);
	const [fragmentStartString, setFragmentStartString] = useState<string>(startString);
	const [fragmentEndString, setFragmentEndString] = useState<string>(endString);

	const getValidationErrors = (): string[] => {
		const start = toSeconds(fragmentStartString, true);
		const end = toSeconds(fragmentEndString, true);

		return getValidationErrorsForStartAndEnd({
			...fragment,
			start_oc: start,
			end_oc: end,
		});
	};

	const onSaveCut = () => {
		setFragmentStart(toSeconds(fragmentStartString, true) as number);
		setFragmentEnd(toSeconds(fragmentEndString, true) as number);
		setFragmentStartString(formatDurationHoursMinutesSeconds(fragmentStart));
		setFragmentEndString(formatDurationHoursMinutesSeconds(fragmentEnd));

		const errors = getValidationErrors();

		if (errors && errors.length) {
			toastService(errors, TOAST_TYPE.DANGER);

			return;
		}

		const start = toSeconds(fragmentStartString, true);
		const end = toSeconds(fragmentEndString, true);

		updateFragmentProperties([
			{ value: start, fieldName: 'start_oc' as const, fragmentId: fragment.id },
			{ value: end, fieldName: 'end_oc' as const, fragmentId: fragment.id },
		]);
		updateCuePoints({
			start,
			end,
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
		let start = toSeconds(fragmentStartString, true) as number;
		let end = toSeconds(fragmentEndString, true) as number;
		const duration =
			(fragment.item_meta &&
				fragment.item_meta.duration &&
				toSeconds(fragment.item_meta.duration)) ||
			0;
		if (start) {
			start = clamp(start, 0, duration);
			setFragmentStart(start);
			setFragmentStartString(formatDurationHoursMinutesSeconds(start));
		}
		if (end) {
			end = clamp(end, 0, duration);
			setFragmentEnd(end);
			setFragmentEndString(formatDurationHoursMinutesSeconds(end));
		}
	};

	const onUpdateMultiRangeValues = (values: number[]) => {
		setFragmentStart(values[0]);
		setFragmentEnd(values[1]);
		setFragmentStartString(formatDurationHoursMinutesSeconds(values[0]));
		setFragmentEndString(formatDurationHoursMinutesSeconds(values[1]));
	};

	const handleOnKeyUp = (evt: KeyboardEvent<HTMLInputElement>) => {
		if (evt.keyCode === 13 || evt.which === 13) {
			parseTimes();
		}
	};

	const initFlowPlayer = () =>
		!playerTicket &&
		fetchPlayerTicket(itemMetaData.external_id).then(data => setPlayerTicket(data));

	// TODO: Replace publisher, published_at by real publisher
	return (
		<Modal isOpen={isOpen} title="Knip fragment" size="medium" onClose={onClose} scrollable={true}>
			<ModalBody>
				<>
					<FlowPlayer
						src={playerTicket ? playerTicket.toString() : null}
						poster={itemMetaData.thumbnail_path}
						title={itemMetaData.title}
						onInit={initFlowPlayer}
						subtitles={['30-12-2011', 'VRT']}
						token={getEnv('FLOW_PLAYER_TOKEN')}
						dataPlayerId={getEnv('FLOW_PLAYER_ID')}
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
								values={[fragmentStart, fragmentEnd]}
								onChange={onUpdateMultiRangeValues}
								min={0}
								max={toSeconds(itemMetaData.duration, true) || 0}
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
									<Button type="secondary" label="Annuleren" onClick={onCancelCut} />
									<Button type="primary" label="Knippen" onClick={onSaveCut} />
								</ButtonToolbar>
							</ToolbarItem>
						</ToolbarRight>
					</Toolbar>
				</>
			</ModalBody>
		</Modal>
	);
};

export default CutFragmentModal;
