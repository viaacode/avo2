import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal, ModalBody } from '@viaa/avo2-components';

interface ReorderCollectionModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const ReorderCollectionModal: FunctionComponent<ReorderCollectionModalProps> = ({
	onClose,
	isOpen,
}) => {
	const [t] = useTranslation();

	return (
		<Modal
			isOpen={isOpen}
			title={t(
				'collection/components/modals/reorder-collection-modal___herschik-items-in-collectie'
			)}
			size="large"
			onClose={onClose}
			scrollable
		>
			{/* TODO: Add draggable list component */}
			<ModalBody>
				<p>REORDER</p>
			</ModalBody>
		</Modal>
	);
};

export default ReorderCollectionModal;
