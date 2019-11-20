import React, { FunctionComponent, useState } from 'react';

import {
	Button,
	ButtonToolbar,
	FormGroup,
	Modal,
	ModalBody,
	Spacer,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';

import toastService, { TOAST_TYPE } from '../../services/toast-service';

interface InputModalProps {
	title?: string;
	inputLabel?: string;
	cancelLabel?: string;
	confirmLabel?: string;
	inputValue?: string;
	inputPlaceholder?: string;
	isOpen: boolean;
	onClose?: () => void;
	inputCallback: (input: string) => void;
	emptyMessage?: string;
}

const InputModal: FunctionComponent<InputModalProps> = ({
	inputValue,
	inputCallback,
	isOpen,
	title = 'Vul in',
	inputLabel = '',
	inputPlaceholder = '',
	cancelLabel = 'Annuleer',
	confirmLabel = 'Opslaan',
	onClose = () => {},
	emptyMessage = 'Gelieve een waarde in te vullen.',
}) => {
	const [input, setInput] = useState<string>(inputValue || '');

	// Listeners
	const onClickClose = () => {
		onClose();
		setInput(inputValue || '');
	};

	const onClickConfirm = () => {
		if (!input) {
			toastService(emptyMessage, TOAST_TYPE.DANGER);
			return null;
		}

		onClose();
		inputCallback(input);
	};

	// Render
	return (
		<Modal isOpen={isOpen} title={title} size="small" onClose={onClickClose} scrollable={true}>
			<ModalBody>
				<>
					<Spacer margin="bottom-large">
						<FormGroup label={inputLabel} labelFor="collectionNameId">
							<TextInput
								type="text"
								value={input}
								onChange={setInput}
								placeholder={inputPlaceholder}
							/>
						</FormGroup>
					</Spacer>
					<Toolbar>
						<ToolbarRight>
							<ToolbarItem>
								<ButtonToolbar>
									<Button type="secondary" label={cancelLabel} onClick={onClickClose} />
									<Button type="primary" label={confirmLabel} onClick={onClickConfirm} />
								</ButtonToolbar>
							</ToolbarItem>
						</ToolbarRight>
					</Toolbar>
				</>
			</ModalBody>
		</Modal>
	);
};

export default InputModal;