import { get } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	ButtonToolbar,
	Form,
	FormGroup,
	Modal,
	ModalBody,
	ModalFooterRight,
	RadioButton,
	Select,
	Spacer,
	Spinner,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { getProfileId } from '../../../authentication/helpers/get-profile-id';
import { getProfileName } from '../../../authentication/helpers/get-profile-info';
import { CustomError } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import { trackEvents } from '../../../shared/services/event-logging-service';
import { VideoStillService } from '../../../shared/services/video-stills-service';
import { CollectionService } from '../../collection.service';
import { ContentTypeNumber } from '../../collection.types';

import './AddToBundleModal.scss';

interface AddToBundleModalProps extends DefaultSecureRouteProps {
	collectionId: string;
	collection: Avo.Collection.Collection;
	isOpen: boolean;
	onClose: () => void;
}

const AddToBundleModal: FunctionComponent<AddToBundleModalProps> = ({
	collectionId,
	collection,
	isOpen,
	onClose,
	user,
}) => {
	const [t] = useTranslation();

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [createNewBundle, setCreateNewBundle] = useState<boolean>(false);
	const [selectedBundleId, setSelectedBundleId] = useState<string>('');
	const [selectedBundle, setSelectedBundle] = useState<Avo.Collection.Collection | undefined>(
		undefined
	);
	const [newBundleTitle, setNewBundleTitle] = useState<string>('');
	const [bundles, setBundles] = useState<Partial<Avo.Collection.Collection>[]>([]);

	const fetchBundles = React.useCallback(
		() =>
			CollectionService.fetchCollectionsOrBundlesByUser('bundle', user)
				.then((bundleTitles: Partial<Avo.Collection.Collection>[]) => {
					setBundles(bundleTitles);
					if (!bundleTitles.length) {
						setCreateNewBundle(true);
					}
				})
				.catch((err) => {
					console.error(err);
					ToastService.danger(
						t(
							'collection/components/modals/add-to-bundle-modal___het-ophalen-van-de-bestaande-bundels-is-mislukt'
						)
					);
				}),
		[user, t]
	);

	useEffect(() => {
		fetchBundles().catch((err) => {
			console.error('Failed to fetch bundles', err);
			ToastService.danger(
				t(
					'collection/components/modals/add-to-bundle-modal___het-ophalen-van-de-bundels-is-mislukt'
				)
			);
		});
	}, [fetchBundles, t]);

	const setSelectedBundleIdAndGetBundleInfo = async (id: string) => {
		try {
			setSelectedBundle(undefined);
			setSelectedBundleId(id);
			const collection = await CollectionService.getCollectionById(id);
			setSelectedBundle(collection);
		} catch (err) {
			ToastService.danger(
				t(
					'collection/components/modals/add-to-bundle-modal___het-ophalen-van-de-collectie-details-is-mislukt'
				)
			);
		}
	};

	const getFragment = (
		bundle: Partial<Avo.Collection.Collection>
	): Partial<Avo.Collection.Fragment> => {
		return {
			use_custom_fields: false,
			start_oc: null,
			position: (bundle.collection_fragments || []).length,
			external_id: collectionId,
			end_oc: null,
			custom_title: null,
			custom_description: null,
			collection_uuid: bundle.id,
			item_meta: collection,
			type: 'COLLECTION',
		};
	};

	const addCollectionToExistingBundle = async (bundle: Partial<Avo.Collection.Collection>) => {
		// Disable "Toepassen" button
		setIsProcessing(true);

		try {
			if (!bundle.id) {
				throw new CustomError('Bundle id is undefined', null, bundle);
			}
			const fragment = getFragment(bundle);
			delete fragment.item_meta;
			const insertedFragments = await CollectionService.insertFragments(bundle.id, [
				fragment,
			]);

			ToastService.success(
				t(
					'collection/components/modals/add-to-bundle-modal___de-collectie-is-toegevoegd-aan-de-bundel'
				)
			);
			onClose();
			trackEvents(
				{
					object: String(collection.id),
					object_type: 'bundle',
					message: `Gebruiker ${getProfileName(user)} heeft collectie ${get(
						insertedFragments,
						'[0].id'
					)} toegevoegd aan bundel ${collection.id}`,
					action: 'add_to',
				},
				user
			);
		} catch (err) {
			console.error(err);
			ToastService.danger(
				t(
					'collection/components/modals/add-to-bundle-modal___de-collectie-kon-niet-worden-toegevoegd-aan-de-bundel'
				)
			);
		}

		// Re-enable apply button
		setIsProcessing(false);
	};

	const addCollectionToNewBundle = async () => {
		// Disable "Toepassen" button
		setIsProcessing(true);

		let newBundle: Partial<Avo.Collection.Collection> | null = null;
		try {
			// Create new bundle with one fragment in it
			newBundle = {
				title: newBundleTitle,
				thumbnail_path: null,
				is_public: false,
				owner_profile_id: getProfileId(user),
				type_id: ContentTypeNumber.bundle,
			};
			try {
				newBundle.thumbnail_path = await VideoStillService.getThumbnailForCollection({
					thumbnail_path: undefined,
					collection_fragments: [getFragment(newBundle) as Avo.Collection.Fragment],
				});
			} catch (err) {
				console.error('Failed to find cover image for new collection', err, {
					collectionFragments: [getFragment(newBundle) as Avo.Collection.Fragment],
				});
			}

			const insertedBundle = await CollectionService.insertCollection(newBundle);

			trackEvents(
				{
					object: String(insertedBundle.id),
					object_type: 'bundle',
					message: `Gebruiker ${getProfileName(user)} heeft bundel aangemaakt`,
					action: 'create',
				},
				user
			);

			// Add collection to bundle
			await addCollectionToExistingBundle(insertedBundle);
			await fetchBundles();
			onClose();

			// Re-enable apply button
			setIsProcessing(false);
		} catch (err) {
			console.error('Failed to create bundle', err, {
				variables: {
					bundle: newBundle,
				},
			});
			ToastService.danger(
				t(
					'collection/components/modals/add-to-bundle-modal___de-bundel-kon-niet-worden-aangemaakt'
				)
			);

			// Re-enable apply button
			setIsProcessing(false);
		}
	};

	const onApply = createNewBundle
		? addCollectionToNewBundle
		: () => addCollectionToExistingBundle(selectedBundle as Partial<Avo.Collection.Collection>);

	return (
		<Modal
			title={t(
				'collection/components/modals/add-to-bundle-modal___voeg-collectie-toe-aan-bundel'
			)}
			size="medium"
			isOpen={isOpen}
			onClose={onClose}
		>
			<ModalBody>
				<div className="c-modal__body-add-collection">
					<Spacer>
						<Form>
							<FormGroup>
								<Spacer margin="bottom">
									<RadioButton
										label={t(
											'collection/components/modals/add-to-bundle-modal___bestaande-bundel'
										)}
										checked={!createNewBundle}
										value="existing"
										name="collection"
										onChange={() => setCreateNewBundle(false)}
									/>
									<div>
										{bundles.length ? (
											<Select
												id="existingCollection"
												placeholder={t(
													'collection/components/modals/add-to-bundle-modal___kies-bundel'
												)}
												options={[
													...bundles.map(
														(
															bundle: Partial<
																Avo.Collection.Collection
															>
														) => ({
															label: bundle.title || '',
															value: String(bundle.id),
														})
													),
												]}
												value={selectedBundleId}
												onChange={setSelectedBundleIdAndGetBundleInfo}
												disabled={createNewBundle}
											/>
										) : (
											<TextInput
												disabled
												value={t(
													'collection/components/modals/add-to-bundle-modal___je-hebt-nog-geen-bundels'
												)}
											/>
										)}
									</div>
								</Spacer>
								<Spacer margin="bottom">
									<RadioButton
										label={t(
											'collection/components/modals/add-to-bundle-modal___nieuwe-bundel'
										)}
										checked={createNewBundle}
										value="new"
										name="bundle"
										onChange={() => setCreateNewBundle(true)}
									/>
									<div>
										<TextInput
											placeholder={t(
												'collection/components/modals/add-to-bundle-modal___bundel-titel'
											)}
											disabled={!createNewBundle}
											value={newBundleTitle}
											onChange={setNewBundleTitle}
										/>
									</div>
								</Spacer>
							</FormGroup>
						</Form>
					</Spacer>
				</div>
			</ModalBody>
			<ModalFooterRight>
				<Toolbar spaced>
					<ToolbarRight>
						<ToolbarItem>
							<ButtonToolbar>
								{isProcessing && <Spinner />}
								<Button
									label={t(
										'item/components/modals/add-to-collection-modal___annuleren'
									)}
									type="link"
									block
									onClick={onClose}
									disabled={isProcessing}
								/>
								<Button
									label={t(
										'item/components/modals/add-to-collection-modal___toepassen'
									)}
									type="primary"
									block
									title={
										createNewBundle && !newBundleTitle
											? t(
													'collection/components/modals/add-to-bundle-modal___u-moet-een-bundel-titel-opgeven'
											  )
											: !createNewBundle && !selectedBundle
											? t(
													'collection/components/modals/add-to-bundle-modal___je-moet-een-bundel-kiezen-om-deze-collectie-aan-toe-te-voegen'
											  )
											: ''
									}
									disabled={
										(createNewBundle && !newBundleTitle) ||
										(!createNewBundle && !selectedBundle) ||
										isProcessing
									}
									onClick={onApply}
								/>
							</ButtonToolbar>
						</ToolbarItem>
					</ToolbarRight>
				</Toolbar>
			</ModalFooterRight>
		</Modal>
	);
};

export default AddToBundleModal;
