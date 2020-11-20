import React, { FunctionComponent } from 'react';

import {
	Button,
	ButtonToolbar,
	ButtonType,
	Modal,
	ModalBody,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';

import { sanitizeHtml } from '../../helpers/sanitize';
import i18n from '../../translations/i18n';
import Html from '../Html/Html';

interface DeleteObjectModalProps {
	title?: string;
	body?: string;
	cancelLabel?: string;
	confirmLabel?: string;
	confirmButtonType?: ButtonType;
	isOpen: boolean;
	onClose?: () => void;
	deleteObjectCallback: () => void;
}

const DeleteObjectModal: FunctionComponent<DeleteObjectModalProps> = ({
	title = i18n.t(
		'shared/components/delete-object-modal/delete-object-modal___ben-je-zeker-dat-je-deze-actie-wil-uitvoeren'
	),
	body = i18n.t(
		'shared/components/delete-object-modal/delete-object-modal___deze-actie-kan-niet-ongedaan-gemaakt-worden'
	),
	cancelLabel = 'Annuleer',
	confirmLabel = 'Verwijder',
	confirmButtonType = 'danger',
	onClose = () => {},
	isOpen,
	deleteObjectCallback,
}) => {
	const handleDelete = () => {
		onClose();
		deleteObjectCallback();
	};

	return (
		<Modal
			isOpen={isOpen}
			title={title && sanitizeHtml(title, 'basic')}
			size="small"
			onClose={onClose}
			scrollable
		>
			<ModalBody>
				{!!body && <Html content={body} />}
				<Toolbar spaced>
					<ToolbarRight>
						<ToolbarItem>
							<ButtonToolbar>
								<Button type="secondary" label={cancelLabel} onClick={onClose} />
								<Button
									type={confirmButtonType}
									label={confirmLabel}
									onClick={handleDelete}
								/>
							</ButtonToolbar>
						</ToolbarItem>
					</ToolbarRight>
				</Toolbar>
			</ModalBody>
		</Modal>
	);
};

export default DeleteObjectModal;
