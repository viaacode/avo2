import { get } from 'lodash-es';
import React, { FunctionComponent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ButtonToolbar, Modal, ModalBody, ModalFooterRight } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import DraggableList from './DraggableList';

export interface DraggableListModalProps {
	items: any[];
	renderItem: (item: any) => ReactNode;
	isOpen: boolean;
	onClose: (elements?: any[]) => void;
	size?: 'small' | 'medium' | 'large' | 'extra-large' | 'fullscreen' | 'fullwidth' | 'auto';
}

const DraggableListModal: FunctionComponent<DraggableListModalProps> = ({
	items,
	renderItem,
	isOpen,
	onClose,
	size = 'medium',
}) => {
	const [t] = useTranslation();

	const [reorderedElements, setReorderedElements] = useState<any[] | null>(null);

	const getFragmentKey = (fragment: Avo.Collection.Fragment) => {
		return `fragment_${fragment.id}-${get(fragment, 'created_at')}-${get(
			fragment,
			'position'
		)}`;
	};

	return (
		<Modal
			title={t('shared/components/draggable-list/draggable-list-modal___herschik-items')}
			isOpen={isOpen}
			size={size}
			scrollable
			onClose={onClose}
		>
			<ModalBody>
				<DraggableList
					items={reorderedElements || items}
					renderItem={renderItem}
					onListChange={setReorderedElements}
					generateKey={getFragmentKey}
				/>
			</ModalBody>
			<ModalFooterRight>
				<ButtonToolbar>
					<Button
						label={t(
							'shared/components/draggable-list/draggable-list-modal___annuleer'
						)}
						type="secondary"
						onClick={() => onClose()}
					/>
					<Button
						label={t('shared/components/draggable-list/draggable-list-modal___opslaan')}
						type="primary"
						onClick={() => {
							onClose(reorderedElements || items);
							setReorderedElements(null);
						}}
					/>
				</ButtonToolbar>
			</ModalFooterRight>
		</Modal>
	);
};

export default DraggableListModal;
