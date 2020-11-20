import { noop } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
	Button,
	ButtonToolbar,
	Modal,
	ModalBody,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { AssignmentService } from '../../../assignment/assignment.service';
import { APP_PATH } from '../../../constants';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../shared/components';
import { buildLink, CustomError } from '../../../shared/helpers';

interface DeleteCollectionModalProps {
	collectionId: string;
	isOpen: boolean;
	onClose?: () => void;
	deleteObjectCallback: () => void;
}

const DeleteCollectionModal: FunctionComponent<DeleteCollectionModalProps> = ({
	collectionId,
	isOpen,
	onClose,
	deleteObjectCallback,
}) => {
	const [t] = useTranslation();

	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [assignments, setAssignments] = useState<Partial<Avo.Assignment.Assignment>[] | null>(
		null
	);

	const fetchAssignmentsUsedByCollection = useCallback(async () => {
		try {
			setAssignments(
				await AssignmentService.fetchAssignmentByContentIdAndType(collectionId, 'COLLECTIE')
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to get assignments used by collection', err, {
					collectionId,
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'collection/components/modals/delete-collection-modal___het-controleren-of-deze-collectie-gebruikt-wordt-door-een-van-je-opdrachten-is-mislukt'
				),
			});
		}
	}, [setAssignments, collectionId, t]);

	useEffect(() => {
		if (assignments) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [assignments, setLoadingInfo]);

	useEffect(() => {
		if (isOpen) {
			fetchAssignmentsUsedByCollection();
		}
	}, [isOpen, fetchAssignmentsUsedByCollection]);

	const handleDelete = async () => {
		deleteObjectCallback();
		(onClose || noop)();
		setAssignments(null);
	};

	const renderConfirmButtons = () => {
		return (
			<Toolbar spaced>
				<ToolbarRight>
					<ToolbarItem>
						<ButtonToolbar>
							<Button
								type="secondary"
								label={t(
									'collection/components/modals/delete-collection-modal___annuleer'
								)}
								onClick={onClose}
							/>
							<Button
								type="danger"
								label={t(
									'collection/components/modals/delete-collection-modal___verwijder'
								)}
								onClick={handleDelete}
							/>
						</ButtonToolbar>
					</ToolbarItem>
				</ToolbarRight>
			</Toolbar>
		);
	};

	const renderConfirmUsedByAssignment = () => {
		return (
			<>
				<p>
					{t(
						'collection/components/modals/delete-collection-modal___deze-collectie-wordt-nog-gebruikt-door-deze-opdrachten'
					)}
				</p>
				<ul>
					{(assignments || []).map((assigment) => (
						<li key={assigment.id}>
							<Link
								to={buildLink(APP_PATH.ASSIGNMENT_EDIT.route, {
									id: assigment.id,
								})}
							>
								{assigment.title}
							</Link>
						</li>
					))}
				</ul>
				{renderDeleteMessage()}
			</>
		);
	};

	const renderDeleteMessage = () => {
		return (
			<p>
				{t(
					'collection/components/modals/delete-collection-modal___ben-je-zeker-dat-je-deze-collectie-wil-verwijderen'
				)}
				<br />
				{t(
					'collection/components/modals/delete-collection-modal___deze-operatie-kan-niet-meer-ongedaan-gemaakt-worden'
				)}
			</p>
		);
	};

	const renderModalBody = () => {
		return (
			<>
				{!!assignments && !!assignments.length
					? renderConfirmUsedByAssignment()
					: renderDeleteMessage()}
				{renderConfirmButtons()}
			</>
		);
	};

	return (
		<Modal
			isOpen={isOpen}
			title={t(
				'collection/components/modals/delete-collection-modal___verwijder-deze-collectie'
			)}
			size="large"
			onClose={onClose}
			scrollable
			className="c-content"
		>
			<ModalBody>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={assignments}
					render={renderModalBody}
				/>
			</ModalBody>
		</Modal>
	);
};

export default DeleteCollectionModal;
