import { clamp, get } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	ButtonToolbar,
	Column,
	Container,
	Form,
	FormGroup,
	Grid,
	Modal,
	ModalBody,
	ModalFooterRight,
	MultiRange,
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
import { CollectionService } from '../../../collection/collection.service';
import { ContentTypeNumber } from '../../../collection/collection.types';
import {
	formatDurationHoursMinutesSeconds,
	isMobileWidth,
	parseDuration,
	toSeconds,
} from '../../../shared/helpers';
import { getValidStartAndEnd } from '../../../shared/helpers/cut-start-and-end';
import { ToastService } from '../../../shared/services';
import { trackEvents } from '../../../shared/services/event-logging-service';
import { VideoStillService } from '../../../shared/services/video-stills-service';
import ItemVideoDescription from '../ItemVideoDescription';

import './AddToCollectionModal.scss';

interface AddToCollectionModalProps extends DefaultSecureRouteProps {
	externalId: string;
	itemMetaData: Avo.Item.Item;
	isOpen: boolean;
	onClose: () => void;
}

const AddToCollectionModal: FunctionComponent<AddToCollectionModalProps> = ({
	externalId,
	itemMetaData,
	isOpen,
	onClose,
	user,
}) => {
	const [t] = useTranslation();

	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [createNewCollection, setCreateNewCollection] = useState<boolean>(false);
	const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
	const [selectedCollection, setSelectedCollection] = useState<
		Avo.Collection.Collection | undefined
	>(undefined);
	const [newCollectionTitle, setNewCollectionTitle] = useState<string>('');

	const [fragmentStartString, setFragmentStartString] = useState<string>(
		formatDurationHoursMinutesSeconds(0)
	);
	const [fragmentEndString, setFragmentEndString] = useState<string>(itemMetaData.duration);
	const [fragmentStartTime, setFragmentStartTime] = useState<number>(0);
	const [fragmentEndTime, setFragmentEndTime] = useState<number>(
		toSeconds(itemMetaData.duration) || 0
	);
	const [collections, setCollections] = useState<Partial<Avo.Collection.Collection>[]>([]);

	const minTime: number = 0;
	const maxTime: number = toSeconds(itemMetaData.duration) || 0;

	const clampDuration = (value: number): number => {
		return clamp(value, minTime, maxTime);
	};

	const fetchCollections = React.useCallback(
		() =>
			CollectionService.fetchCollectionsOrBundlesByUser('collection', user)
				.then((collectionTitles: Partial<Avo.Collection.Collection>[]) => {
					setCollections(collectionTitles);
				})
				.catch((err) => {
					console.error(err);
					ToastService.danger(
						t(
							'item/components/modals/add-to-collection-modal___het-ophalen-van-de-bestaande-collections-is-mislukt'
						)
					);
				}),
		[user, t]
	);

	useEffect(() => {
		fetchCollections().catch((err) => {
			console.error('Failed to fetch collections', err);
			ToastService.danger(
				t(
					'item/components/modals/add-to-collection-modal___het-ophalen-van-de-collecties-is-mislukt'
				)
			);
		});
	}, [fetchCollections, t]);

	useEffect(() => {
		if (isOpen) {
			// Reset the state
			setCreateNewCollection(!collections.length);
			setSelectedCollectionId('');
			setSelectedCollection(undefined);
			setNewCollectionTitle('');
			setFragmentStartTime(0);
			setFragmentEndTime(toSeconds(itemMetaData.duration) || 0);
		}
	}, [isOpen, itemMetaData.duration, collections.length]);

	const setSelectedCollectionIdAndGetCollectionInfo = async (id: string) => {
		try {
			setSelectedCollection(undefined);
			setSelectedCollectionId(id);
			setSelectedCollection(
				await CollectionService.fetchCollectionOrBundleById(id, 'collection')
			);
		} catch (err) {
			ToastService.danger(
				t(
					'item/components/modals/add-to-collection-modal___het-ophalen-van-de-collectie-details-is-mislukt'
				)
			);
		}
	};

	const getFragment = async (
		collection: Partial<Avo.Collection.Collection>
	): Promise<Partial<Avo.Collection.Fragment>> => {
		const hasCut =
			fragmentEndTime !== toSeconds(itemMetaData.duration) || fragmentStartTime !== 0;

		return {
			use_custom_fields: false,
			position: (collection.collection_fragments || []).length,
			external_id: externalId,
			start_oc: hasCut ? fragmentStartTime : null,
			end_oc: hasCut ? fragmentEndTime : null,
			custom_title: null,
			custom_description: null,
			collection_uuid: collection.id,
			item_meta: itemMetaData,
			type: 'ITEM',
			thumbnail_path: !!fragmentStartTime
				? await VideoStillService.getVideoStill(externalId, fragmentStartTime * 1000)
				: null,
		};
	};

	const addItemToExistingCollection = async (collection: Partial<Avo.Collection.Collection>) => {
		// Disable apply button
		setIsProcessing(true);

		try {
			const fragment = await getFragment(collection);
			delete fragment.item_meta;
			const fragments = await CollectionService.insertFragments(collection.id as string, [
				fragment as Avo.Collection.Fragment,
			]);
			ToastService.success(
				t(
					'item/components/modals/add-to-collection-modal___het-fragment-is-toegevoegd-aan-de-collectie'
				)
			);
			onClose();
			trackEvents(
				{
					object: String(collection.id),
					object_type: 'collection',
					message: `Gebruiker ${getProfileName(user)} heeft fragment ${get(
						fragments,
						'[0].id'
					)} toegevoegd aan een collectie`,
					action: 'add_to',
				},
				user
			);
		} catch (err) {
			console.error(err);
			ToastService.danger(
				t(
					'item/components/modals/add-to-collection-modal___het-fragment-kon-niet-worden-toegevoegd-aan-de-collectie'
				)
			);
		}

		// Re-enable apply button
		setIsProcessing(false);
	};

	const addItemToNewCollection = async () => {
		// Disable "Toepassen" button
		setIsProcessing(true);

		let newCollection: Partial<Avo.Collection.Collection> | null = null;
		try {
			// Create new collection with one fragment in it
			newCollection = {
				title: newCollectionTitle,
				thumbnail_path: null,
				is_public: false,
				owner_profile_id: getProfileId(user),
				type_id: ContentTypeNumber.collection,
			};
			try {
				newCollection.thumbnail_path = await VideoStillService.getThumbnailForCollection({
					thumbnail_path: undefined,
					collection_fragments: [
						(await getFragment(newCollection)) as Avo.Collection.Fragment,
					],
				});
			} catch (err) {
				console.error('Failed to find cover image for new collection', err, {
					collectionFragments: [
						(await getFragment(newCollection)) as Avo.Collection.Fragment,
					],
				});
			}

			const insertedCollection: Partial<Avo.Collection.Collection> = await CollectionService.insertCollection(
				newCollection
			);

			trackEvents(
				{
					object: insertedCollection.id || '',
					object_type: 'collection',
					message: `${getProfileName(user)} heeft een collectie aangemaakt`,
					action: 'create',
				},
				user
			);

			// Add fragment to collection
			await addItemToExistingCollection(insertedCollection);

			await fetchCollections();
			onClose();

			// Re-enable apply button
			setIsProcessing(false);
		} catch (err) {
			console.error('Failed to create collection', err, {
				variables: {
					collection: newCollection,
				},
			});
			ToastService.danger(
				t(
					'item/components/modals/add-to-collection-modal___de-collectie-kon-niet-worden-aangemaakt'
				)
			);

			// Re-enable apply button
			setIsProcessing(false);
		}
	};

	const onUpdateMultiRangeValues = (values: number[]) => {
		setFragmentStartTime(values[0]);
		setFragmentEndTime(values[1]);
		setFragmentStartString(formatDurationHoursMinutesSeconds(values[0]));
		setFragmentEndString(formatDurationHoursMinutesSeconds(values[1]));
	};

	const onApply = createNewCollection
		? addItemToNewCollection
		: () =>
				addItemToExistingCollection(
					selectedCollection as Partial<Avo.Collection.Collection>
				);

	const updateStartAndEnd = (type: 'start' | 'end', value?: string) => {
		if (value) {
			// onChange event
			if (type === 'start') {
				setFragmentStartString(value);
			} else {
				setFragmentEndString(value);
			}
			if (/[0-9]{2}:[0-9]{2}:[0-9]{2}/.test(value)) {
				// full duration
				if (type === 'start') {
					const newStartTime = clampDuration(parseDuration(value));
					setFragmentStartTime(newStartTime);
					setFragmentStartString(formatDurationHoursMinutesSeconds(newStartTime));
					if (newStartTime > fragmentEndTime) {
						setFragmentEndTime(newStartTime);
						setFragmentEndString(formatDurationHoursMinutesSeconds(newStartTime));
					}
				} else {
					const newEndTime = clampDuration(parseDuration(value));
					setFragmentEndTime(newEndTime);
					setFragmentEndString(formatDurationHoursMinutesSeconds(newEndTime));
					if (newEndTime < fragmentStartTime) {
						setFragmentStartTime(newEndTime);
						setFragmentStartString(formatDurationHoursMinutesSeconds(newEndTime));
					}
				}
			}
			// else do nothing yet, until the user finishes the time entry
		} else {
			// on blur event
			if (type === 'start') {
				if (/[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}/.test(fragmentStartString)) {
					const newStartTime = clampDuration(parseDuration(fragmentStartString));
					setFragmentStartTime(newStartTime);
					setFragmentStartString(formatDurationHoursMinutesSeconds(newStartTime));
					if (newStartTime > fragmentEndTime) {
						setFragmentEndTime(newStartTime);
						setFragmentEndString(formatDurationHoursMinutesSeconds(newStartTime));
					}
				} else {
					setFragmentStartTime(0);
					setFragmentStartString(formatDurationHoursMinutesSeconds(0));
					ToastService.danger(
						t(
							'item/components/modals/add-to-collection-modal___de-ingevulde-starttijd-heeft-niet-het-correcte-formaat-uu-mm-ss'
						)
					);
				}
			} else {
				if (/[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}/.test(fragmentEndString)) {
					const newEndTime = clampDuration(parseDuration(fragmentEndString));
					setFragmentEndTime(newEndTime);
					setFragmentEndString(formatDurationHoursMinutesSeconds(newEndTime));
					if (newEndTime < fragmentStartTime) {
						setFragmentStartTime(newEndTime);
						setFragmentStartString(formatDurationHoursMinutesSeconds(newEndTime));
					}
				} else {
					setFragmentEndTime(toSeconds(itemMetaData.duration) || 0);
					setFragmentEndString(
						formatDurationHoursMinutesSeconds(toSeconds(itemMetaData.duration) || 0)
					);
					ToastService.danger(
						t(
							'item/components/modals/add-to-collection-modal___de-ingevulde-eidntijd-heeft-niet-het-correcte-formaat-uu-mm-ss'
						)
					);
				}
			}
		}
	};

	const renderAddToCollectionModal = () => {
		const fragmentDuration = toSeconds(itemMetaData.duration) || 0;
		const [start, end] = getValidStartAndEnd(
			fragmentStartTime,
			fragmentEndTime,
			fragmentDuration
		);

		return (
			<Modal
				title={t(
					'item/components/modals/add-to-collection-modal___voeg-fragment-toe-aan-collectie'
				)}
				size="extra-large"
				isOpen={isOpen}
				onClose={onClose}
				scrollable
			>
				<ModalBody>
					<div className="c-modal__body-add-fragment">
						<Spacer>
							<Form>
								<ItemVideoDescription
									itemMetaData={itemMetaData}
									showTitle
									showDescription
									canPlay={isOpen}
									cuePoints={{ start, end }}
									seekTime={fragmentStartTime || 0}
									verticalLayout={isMobileWidth()}
								/>
								<Grid>
									<Column size="2-7">
										<Container mode="vertical" className="m-time-crop-controls">
											<TextInput
												value={fragmentStartString}
												onBlur={() => updateStartAndEnd('start')}
												onChange={(endTime) =>
													updateStartAndEnd('start', endTime)
												}
											/>
											<div className="m-multi-range-wrapper">
												<MultiRange
													values={[start, end]}
													onChange={onUpdateMultiRangeValues}
													min={0}
													max={fragmentDuration}
													step={1}
												/>
											</div>
											<TextInput
												value={fragmentEndString}
												onBlur={() => updateStartAndEnd('end')}
												onChange={(endTime) =>
													updateStartAndEnd('end', endTime)
												}
											/>
										</Container>
									</Column>
									<Column size="2-5">
										<FormGroup
											label={t(
												'item/components/modals/add-to-collection-modal___collectie'
											)}
											required
										>
											<Spacer margin="bottom">
												<RadioButton
													label={t(
														'item/components/modals/add-to-collection-modal___voeg-toe-aan-bestaande-collectie'
													)}
													checked={!createNewCollection}
													value="existing"
													name="collection"
													onChange={() => {
														setCreateNewCollection(false);
													}}
												/>
												<div>
													{collections.length ? (
														<Select
															id="existingCollection"
															options={[
																{
																	label: t(
																		'item/components/modals/add-to-collection-modal___kies-collectie'
																	),
																	value: '',
																	disabled: true,
																},
																...collections.map(
																	(
																		collection: Partial<
																			Avo.Collection.Collection
																		>
																	) => ({
																		label:
																			collection.title || '',
																		value: String(
																			collection.id
																		),
																	})
																),
															]}
															value={selectedCollectionId}
															onChange={
																setSelectedCollectionIdAndGetCollectionInfo
															}
															disabled={createNewCollection}
														/>
													) : (
														<TextInput
															disabled
															value={t(
																'item/components/modals/add-to-collection-modal___je-hebt-nog-geen-collecties'
															)}
														/>
													)}
												</div>
											</Spacer>
											<Spacer margin="bottom">
												<RadioButton
													label={t(
														'item/components/modals/add-to-collection-modal___voeg-toe-aan-een-nieuwe-collectie'
													)}
													checked={createNewCollection}
													value="new"
													name="collection"
													onChange={() => {
														setCreateNewCollection(true);
													}}
												/>
												<div>
													<TextInput
														placeholder={t(
															'item/components/modals/add-to-collection-modal___collectie-titel'
														)}
														disabled={!createNewCollection}
														value={newCollectionTitle}
														onChange={setNewCollectionTitle}
													/>
												</div>
											</Spacer>
										</FormGroup>
									</Column>
								</Grid>
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
											createNewCollection && !newCollectionTitle
												? t(
														'item/components/modals/add-to-collection-modal___u-moet-een-collectie-titel-opgeven'
												  )
												: !createNewCollection && !selectedCollection
												? t(
														'item/components/modals/add-to-collection-modal___je-moet-een-collectie-kiezen-om-dit-item-aan-toe-te-voegen'
												  )
												: ''
										}
										disabled={
											(createNewCollection && !newCollectionTitle) ||
											(!createNewCollection && !selectedCollection) ||
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

	return renderAddToCollectionModal();
};

export default AddToCollectionModal;
