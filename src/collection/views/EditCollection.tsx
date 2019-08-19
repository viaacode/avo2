import { useMutation } from '@apollo/react-hooks';
import React, { Fragment, FunctionComponent, ReactText, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';

import { get, isEmpty, without } from 'lodash-es';
import {
	DELETE_COLLECTION_FRAGMENT,
	GET_COLLECTION_BY_ID,
	INSERT_COLLECTION_FRAGMENT,
	UPDATE_COLLECTION,
	UPDATE_COLLECTION_FRAGMENT,
} from '../collection.gql';

import {
	Avatar,
	Button,
	Container,
	Dropdown,
	DropdownButton,
	DropdownContent,
	Icon,
	MetaData,
	MetaDataItem,
	Modal,
	ModalBody,
	Spacer,
	Tabs,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';
import { withApollo } from 'react-apollo';

import { DataQueryComponent } from '../../shared/components/DataComponent/DataQueryComponent';
import EditCollectionContent from './EditCollectionContent';
import EditCollectionMetadata from './EditCollectionMetadata';

interface EditCollectionProps extends RouteComponentProps {}

// TODO: Get these from the api once the database is filled up
export const USER_GROUPS: string[] = ['Docent', 'Leering', 'VIAA medewerker', 'Uitgever'];

const EditCollection: FunctionComponent<EditCollectionProps> = props => {
	const [triggerCollectionUpdate] = useMutation(UPDATE_COLLECTION);
	const [triggerCollectionFragmentDelete] = useMutation(DELETE_COLLECTION_FRAGMENT);
	const [triggerCollectionFragmentInsert] = useMutation(INSERT_COLLECTION_FRAGMENT);
	const [triggerCollectionFragmentUpdate] = useMutation(UPDATE_COLLECTION_FRAGMENT);
	const [collectionId] = useState((props.match.params as any)['id'] as string);
	const [currentTab, setCurrentTab] = useState('inhoud');
	const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [currentCollection, setCurrentCollection] = useState();
	const [isFirstRender, setIsFirstRender] = useState(false);

	// Tab navigation
	const tabs = [
		{
			id: 'inhoud',
			label: 'Inhoud',
			active: currentTab === 'inhoud',
		},
		{
			id: 'metadata',
			label: 'Metadata',
			active: currentTab === 'metadata',
		},
	];

	// Change page on tab selection
	const selectTab = (selectedTab: ReactText) => {
		setCurrentTab(String(selectedTab));
	};

	const onRenameCollection = () => {
		// TODO: Add cursor pointer to menu items under dropdown
		setIsOptionsMenuOpen(false);
		// TODO: Show toast
	};

	const onDeleteCollection = () => {
		setIsOptionsMenuOpen(false);
	};

	const onPreviewCollection = () => {
		// TODO: Open preview in new tab
	};

	// Update individual property of fragment
	const updateFragmentProperty = (value: string, propertyName: string, fragmentId: number) => {
		const temp: Avo.Collection.Response = { ...currentCollection };

		const fragmentToUpdate = temp.collection_fragments.find(
			(item: Avo.Collection.Fragment) => item.id === fragmentId
		);

		(fragmentToUpdate as any)[propertyName] = value;

		updateCollection(temp);
	};

	// Update individual property of collection
	const updateCollectionProperty = (value: string, fieldName: string) =>
		setCurrentCollection({
			...currentCollection,
			[fieldName]: value,
		});

	// Swap position of two fragments within a collection
	const swapFragments = (currentId: number, direction: 'up' | 'down') => {
		const fragments = currentCollection.collection_fragments;

		const changeFragmentsPositions = (sign: number) => {
			const otherFragment = currentCollection.collection_fragments.find(
				(fragment: any) => fragment.position === currentId - sign
			);
			fragments.find((fragment: any) => fragment.position === currentId).position -= sign;
			otherFragment.position += sign;
		};

		direction === 'up' ? changeFragmentsPositions(1) : changeFragmentsPositions(-1);

		setCurrentCollection({
			...currentCollection,
			collection_fragments: fragments,
		});
	};

	const updateCollection = (collection: Avo.Collection.Response) => {
		setCurrentCollection(collection);
	};

	const renderEditCollection = (collection: Avo.Collection.Response) => {
		async function onSaveCollection() {
			let newCollection: Avo.Collection.Response = { ...currentCollection };

			// Insert fragments that added to collection
			const insertFragmentIds = without(
				newCollection.collection_fragment_ids || [],
				...(collection.collection_fragment_ids || [])
			);

			// Delete fragments that were removed from collection
			const deleteFragmentIds = without(
				collection.collection_fragment_ids || [],
				...(newCollection.collection_fragment_ids || [])
			);

			// Update fragments that are neither inserted nor deleted
			const updateFragmentIds = without(currentCollection.collection_fragment_ids, [
				...insertFragmentIds,
				...deleteFragmentIds,
			]);

			const insertFragment = async (id: number) => {
				const fragmentToAdd = {
					...currentCollection.collection_fragments.find(
						(fragment: Avo.Collection.Fragment) => fragment.id === id
					),
				};

				const tempId = fragmentToAdd.id;
				delete fragmentToAdd.id;
				delete fragmentToAdd.__typename;

				const response = await triggerCollectionFragmentInsert({
					variables: {
						id: currentCollection.id,
						fragment: fragmentToAdd,
					},
				});

				const newFragment = get(response, 'data.insert_app_collection_fragments.returning[0]');

				return {
					newFragment,
					oldId: tempId,
				};
			};

			const promises: any = [];

			insertFragmentIds.forEach(id => {
				promises.push(insertFragment(id));
			});

			const newFragmentData = await Promise.all(promises);

			newFragmentData.forEach((data: any) => {
				newCollection = {
					...currentCollection,
					collection_fragment_ids: [
						...currentCollection.collection_fragment_ids.filter(
							(fragmentId: number) => fragmentId !== data.oldId
						),
						data.newFragment.id,
					],
					collection_fragments: [
						...currentCollection.collection_fragments.filter(
							(fragment: Avo.Collection.Fragment) => fragment.id !== data.oldId
						),
						data.newFragment,
					],
				};
			});

			deleteFragmentIds.forEach(id => {
				triggerCollectionFragmentDelete({ variables: { id } });

				newCollection = {
					...newCollection,
					collection_fragment_ids: [
						...(newCollection.collection_fragment_ids || []).filter(
							(fragmentId: number) => fragmentId !== id
						),
					],
					collection_fragments: [
						...newCollection.collection_fragments.filter(
							(fragment: Avo.Collection.Fragment) => fragment.id !== id
						),
					],
				};
			});

			updateFragmentIds.forEach(id => {
				const fragment: any = {
					...newCollection.collection_fragments.find((fragment: Avo.Collection.Fragment) => {
						return Number(id) === fragment.id;
					}),
				};

				delete fragment.__typename;

				triggerCollectionFragmentUpdate({
					variables: {
						id,
						fragment,
					},
				});
			});

			setCurrentCollection(newCollection);

			const readyToStore = { ...newCollection };

			// Trigger collection update
			const propertiesToDelete = [
				'collection_fragments',
				'label_redactie',
				'owner',
				'collection_permissions',
				'__typename',
				'type',
			];

			const otherTables: any = {};

			propertiesToDelete.forEach((property: any) => {
				otherTables[property] = (readyToStore as any)[property];
				delete (readyToStore as any)[property];
			});

			triggerCollectionUpdate({
				variables: {
					id: currentCollection.id,
					collection: {
						...readyToStore,
					},
				},
			});
		}

		if (!isFirstRender) {
			setCurrentCollection(collection);
			setIsFirstRender(true);
		}

		return currentCollection ? (
			<Fragment>
				<Container background="alt">
					<Container mode="vertical" size="small" background="alt">
						<Container mode="horizontal">
							<Toolbar>
								<ToolbarLeft>
									<ToolbarItem>
										<Spacer margin="bottom">
											<MetaData spaced={true} category="collection">
												<MetaDataItem>
													<div className="c-content-type c-content-type--collection">
														<Icon name="collection" />
														<p>COLLECTION</p>
													</div>
												</MetaDataItem>
												<MetaDataItem
													icon="eye"
													label={String(188) /* TODO currentCollection.view_count */}
												/>
												<MetaDataItem
													icon="bookmark"
													label={String(12) /* TODO currentCollection.bookInhoud_count */}
												/>
											</MetaData>
										</Spacer>
										<h1 className="c-h2 u-m-b-0">{currentCollection.title}</h1>
										{currentCollection.owner && (
											<div className="o-flex o-flex--spaced">
												{!isEmpty(currentCollection.owner_id) && (
													<Avatar
														image={get(currentCollection, 'owner.avatar')}
														name={`${get(currentCollection, 'owner.first_name')} ${get(
															currentCollection,
															'owner.last_name'
														)} (
														${USER_GROUPS[get(currentCollection, 'owner.role.id')]})`}
														initials={
															get(currentCollection, 'owner.first_name[0]', '') +
															get(currentCollection, 'owner.last_name[0]', '')
														}
													/>
												)}
											</div>
										)}
									</ToolbarItem>
								</ToolbarLeft>
								<ToolbarRight>
									<ToolbarItem>
										<div className="c-button-toolbar">
											<Button
												type="secondary"
												label="Delen"
												onClick={() => setIsShareModalOpen(!isShareModalOpen)}
											/>
											<Button type="secondary" label="Bekijk" onClick={onPreviewCollection} />
											<Button
												type="secondary"
												label="Herschik alle items"
												onClick={() => setIsReorderModalOpen(!isReorderModalOpen)}
											/>
											<Dropdown
												isOpen={isOptionsMenuOpen}
												onOpen={() => setIsOptionsMenuOpen(true)}
												onClose={() => setIsOptionsMenuOpen(false)}
												placement="bottom-end"
												autoSize
											>
												<DropdownButton>
													<Button type="secondary" icon="more-horizontal" />
												</DropdownButton>
												<DropdownContent>
													<Fragment>
														<a className="c-menu__item" onClick={onRenameCollection}>
															<div className="c-menu__label">Collectie hernoemen</div>
														</a>
														<a className="c-menu__item" onClick={onDeleteCollection}>
															<div className="c-menu__label">Verwijder</div>
														</a>
													</Fragment>
												</DropdownContent>
											</Dropdown>
											<Button type="primary" label="Opslaan" onClick={onSaveCollection} />
										</div>
									</ToolbarItem>
								</ToolbarRight>
							</Toolbar>
						</Container>
					</Container>
					<Container mode="horizontal" background="alt">
						<Tabs tabs={tabs} onClick={selectTab} />
					</Container>
				</Container>
				{currentTab === 'inhoud' && (
					<EditCollectionContent
						collection={currentCollection}
						swapFragments={swapFragments}
						updateCollection={updateCollection}
						updateFragmentProperty={updateFragmentProperty}
					/>
				)}
				{currentTab === 'metadata' && (
					<EditCollectionMetadata
						collection={currentCollection}
						updateCollectionProperty={updateCollectionProperty}
					/>
				)}
				<Modal
					isOpen={isReorderModalOpen}
					title="Herschik items in collectie"
					size="large"
					onClose={() => setIsReorderModalOpen(!isReorderModalOpen)}
					scrollable={true}
				>
					<ModalBody>
						<p>DRAGGABLE LIST</p>
					</ModalBody>
				</Modal>
				<Modal
					isOpen={isShareModalOpen}
					title="Deel deze collectie"
					size="large"
					onClose={() => setIsShareModalOpen(!isShareModalOpen)}
					scrollable={true}
				>
					<ModalBody>
						<p>SHARE</p>
					</ModalBody>
				</Modal>
			</Fragment>
		) : null;
	};

	return (
		<DataQueryComponent
			query={GET_COLLECTION_BY_ID}
			variables={{ id: collectionId }}
			resultPath="app_collections[0]"
			renderData={renderEditCollection}
			notFoundMessage="Deze collectie werd niet gevonden"
		/>
	);
};

export default withApollo(EditCollection);
