import React, { FunctionComponent, useState } from 'react';

import {
	Button,
	Form,
	FormGroup,
	Modal,
	ModalBody,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';

interface RenameCollectionModalProps {
	initialCollectionName: string;
	updateCollectionProperty: (value: string, fieldName: string) => void;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}

const RenameCollectionModal: FunctionComponent<RenameCollectionModalProps> = ({
	initialCollectionName,
	updateCollectionProperty,
	setIsOpen,
	isOpen,
}) => {
	const [collectionName, setCollectionName] = useState(initialCollectionName);

	const onSave = () => {
		setIsOpen(false);
		updateCollectionProperty(collectionName, 'title');
	};

	return (
		<Modal
			isOpen={isOpen}
			title="Hernoem deze collectie"
			size="medium"
			onClose={() => setIsOpen(!isOpen)}
			scrollable={true}
		>
			<ModalBody>
				<Form>
					<FormGroup label="Naam collectie" labelFor="collectionNameId">
						<TextInput
							id="collectionNameId"
							type="text"
							value={collectionName || ''}
							onChange={(value: string) => setCollectionName(value)}
						/>
					</FormGroup>
					<Toolbar spaced>
						<ToolbarRight>
							<ToolbarItem>
								<div className="c-button-toolbar">
									<Button type="secondary" label="Annuleren" onClick={() => setIsOpen(false)} />
									<Button type="primary" label="Opslaan" onClick={onSave} />
								</div>
							</ToolbarItem>
						</ToolbarRight>
					</Toolbar>
				</Form>
			</ModalBody>
		</Modal>
	);
};

export default RenameCollectionModal;
