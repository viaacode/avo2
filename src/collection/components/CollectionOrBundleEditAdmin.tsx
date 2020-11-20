import H from 'history';
import { get, isNil, orderBy } from 'lodash-es';
import React, { FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	BlockHeading,
	Button,
	Column,
	Container,
	Form,
	FormGroup,
	Grid,
	Icon,
	Spacer,
	Table,
	TagInfo,
	TagsInput,
	TextArea,
	TextInput,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ContentPicker } from '../../admin/shared/components/ContentPicker/ContentPicker';
import { PickerItem } from '../../admin/shared/types';
import { AssignmentService } from '../../assignment/assignment.service';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { redirectToClientPage } from '../../authentication/helpers/redirects';
import { APP_PATH } from '../../constants';
import { buildLink, CustomError, formatTimestamp, getFullName } from '../../shared/helpers';
import { truncateTableValue } from '../../shared/helpers/truncate';
import withUser, { UserProps } from '../../shared/hocs/withUser';
import { ToastService } from '../../shared/services';
import { CollectionService } from '../collection.service';
import { QualityLabel } from '../collection.types';

import { CollectionAction } from './CollectionOrBundleEdit';

type BundleColumnId = 'title' | 'author' | 'is_public' | 'organization' | 'actions';
type AssignmentColumnId = 'title' | 'author' | 'is_archived' | 'actions';

/* eslint-disable @typescript-eslint/no-unused-vars */
const columnIdToBundlePath: { [columnId in BundleColumnId]: string } = {
	/* eslint-enable @typescript-eslint/no-unused-vars */
	title: 'title',
	author: 'profile.user.last_name',
	is_public: 'is_public',
	organization: 'profile.profile_organizations[0].organization_id',
	actions: '',
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const columnIdToAssignmentPath: { [columnId in AssignmentColumnId]: string } = {
	/* eslint-enable @typescript-eslint/no-unused-vars */
	title: 'title',
	author: 'profile.user.last_name',
	is_archived: 'is_archived',
	actions: '',
};

interface CollectionOrBundleEditAdminProps {
	collection: Avo.Collection.Collection;
	changeCollectionState: (action: CollectionAction) => void;
	history: H.History;
}

const CollectionOrBundleEditAdmin: FunctionComponent<
	CollectionOrBundleEditAdminProps & UserProps
> = ({ collection, changeCollectionState, history, user }) => {
	const [t] = useTranslation();

	// State
	const [qualityLabels, setQualityLabels] = useState<TagInfo[] | null>(null);

	const [bundlesContainingCollection, setBundlesContainingCollection] = useState<
		Avo.Collection.Collection[] | undefined
	>(undefined);
	const [bundleSortColumn, setBundleSortColumn] = useState<string>('title');
	const [bundleSortOrder, setBundleSortOrder] = useState<Avo.Search.OrderDirection>('asc');

	const [assignmentsContainingCollection, setAssignmentsContainingCollection] = useState<
		Partial<Avo.Assignment.Assignment>[] | undefined
	>(undefined);
	const [assignmentSortColumn, setAssignmentSortColumn] = useState<string>('title');
	const [assignmentSortOrder, setAssignmentSortOrder] = useState<Avo.Search.OrderDirection>(
		'asc'
	);

	// Computed
	const isCollection: boolean = collection.type_id === 3;

	const fetchBundlesByCollectionUuid = useCallback(async () => {
		try {
			if (!collection) {
				return;
			}
			setBundlesContainingCollection(
				await CollectionService.fetchCollectionsByFragmentId(collection.id)
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to get bundles containing collection', err, {
					collection,
				})
			);
			ToastService.danger(
				t(
					'collection/components/collection-or-bundle-edit-admin___het-ophalen-van-de-bundles-die-deze-collectie-bevatten-is-mislukt'
				)
			);
		}
	}, [setBundlesContainingCollection, t, collection]);

	const fetchAssignmentsByCollectionUuid = useCallback(async () => {
		try {
			if (!collection) {
				return;
			}
			setAssignmentsContainingCollection(
				await AssignmentService.fetchAssignmentByContentIdAndType(
					collection.id,
					'COLLECTIE'
				)
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to get assignments containing collection', err, {
					collection,
				})
			);
			ToastService.danger(
				t(
					'collection/components/collection-or-bundle-edit-admin___het-ophalen-van-de-opdrachten-die-deze-collectie-bevatten-is-mislukt'
				)
			);
		}
	}, [setAssignmentsContainingCollection, t, collection]);

	const fetchQualityLabels = useCallback(async () => {
		try {
			const dbLabels = await CollectionService.fetchQualityLabels();
			setQualityLabels(
				dbLabels.map((dbLabel: QualityLabel) => ({
					label: dbLabel.description,
					value: dbLabel.value,
				}))
			);
		} catch (err) {
			console.error(new CustomError('Failed to fetch quality labels', err));
			ToastService.danger(
				t(
					'collection/components/collection-or-bundle-edit-admin___het-ophalen-van-de-kwaliteitslabels-is-mislukt'
				)
			);
		}
	}, [setQualityLabels, t]);

	useEffect(() => {
		fetchBundlesByCollectionUuid();
		fetchAssignmentsByCollectionUuid();
		fetchQualityLabels();
	}, [fetchBundlesByCollectionUuid, fetchAssignmentsByCollectionUuid, fetchQualityLabels]);

	const updateCollectionMultiProperty = (
		selectedTagOptions: TagInfo[],
		collectionProp: keyof Avo.Collection.Collection
	) => {
		changeCollectionState({
			collectionProp,
			type: 'UPDATE_COLLECTION_PROP',
			collectionPropValue: (selectedTagOptions || []).map((tag) => ({
				label: tag.value as string,
			})) as any,
		});
	};

	const getCollectionLabels = (): TagInfo[] => {
		if (!qualityLabels) {
			return [];
		}
		const labelIds = ((collection.collection_labels || []) as Avo.Collection.Label[]).map(
			(item: any) => item.label
		);
		return qualityLabels.filter((qualityLabel) => labelIds.includes(qualityLabel.value));
	};

	const navigateToBundleDetail = (id: string) => {
		const link = buildLink(APP_PATH.BUNDLE_DETAIL.route, { id });
		redirectToClientPage(link, history);
	};

	const navigateToAssignmentDetail = (id: string) => {
		const link = buildLink(APP_PATH.ASSIGNMENT_DETAIL.route, { id });
		redirectToClientPage(link, history);
	};

	const handleBundleColumnClick = (columnId: BundleColumnId) => {
		const sortOrder = bundleSortOrder === 'asc' ? 'desc' : 'asc'; // toggle
		setBundleSortColumn(columnId);
		setBundleSortOrder(sortOrder);
		setBundlesContainingCollection(
			orderBy(
				bundlesContainingCollection,
				[(coll) => get(coll, columnIdToBundlePath[columnId])],
				[sortOrder]
			)
		);
	};

	const handleAssignmentColumnClick = (columnId: AssignmentColumnId) => {
		const sortOrder = assignmentSortOrder === 'asc' ? 'desc' : 'asc'; // toggle
		setAssignmentSortColumn(columnId);
		setAssignmentSortOrder(sortOrder);
		setAssignmentsContainingCollection(
			orderBy(
				assignmentsContainingCollection,
				[(coll) => get(coll, columnIdToAssignmentPath[columnId])],
				[sortOrder]
			)
		);
	};

	const renderBundleCell = (
		rowData: Partial<Avo.Collection.Collection>,
		columnId: BundleColumnId
	): ReactNode => {
		switch (columnId) {
			case 'author':
				const user = get(rowData, 'profile.user');
				if (!user) {
					return '-';
				}
				return truncateTableValue(`${user.first_name} ${user.last_name}`);

			case 'organization':
				return get(rowData, 'profile.organisation.name', '-');

			case 'is_public':
				return (
					<div
						title={
							rowData.is_public
								? t('collection/components/collection-or-bundle-overview___publiek')
								: t(
										'collection/components/collection-or-bundle-overview___niet-publiek'
								  )
						}
					>
						<Icon name={rowData.is_public ? 'unlock-3' : 'lock'} />
					</div>
				);

			case 'actions':
				return (
					<Button
						type="borderless"
						icon="eye"
						title={t(
							'collection/components/collection-or-bundle-edit-admin___ga-naar-de-bundel-detail-pagina'
						)}
						ariaLabel={t(
							'collection/components/collection-or-bundle-edit-admin___ga-naar-de-bundel-detail-pagina'
						)}
						onClick={(evt) => {
							evt.stopPropagation();
							navigateToBundleDetail(rowData.id as string);
						}}
					/>
				);

			default:
				return rowData[columnId];
		}
	};

	const renderAssignmentCell = (
		rowData: Partial<Avo.Assignment.Assignment>,
		columnId: AssignmentColumnId
	): ReactNode => {
		switch (columnId) {
			case 'author':
				const user = get(rowData, 'profile.user');
				if (!user) {
					return '-';
				}
				return truncateTableValue(`${user.first_name} ${user.last_name}`);

			case 'is_archived':
				return rowData[columnId]
					? t('collection/components/collection-or-bundle-edit-admin___gearchiveerd')
					: t('collection/components/collection-or-bundle-edit-admin___actief');

			case 'actions':
				return (
					<Button
						type="borderless"
						icon="eye"
						title={t(
							'collection/components/collection-or-bundle-edit-admin___ga-naar-de-opdracht-detail-pagina'
						)}
						ariaLabel={t(
							'collection/components/collection-or-bundle-edit-admin___ga-naar-de-opdracht-detail-pagina'
						)}
						onClick={(evt) => {
							evt.stopPropagation();
							if (isNil(rowData.id)) {
								return;
							}
							navigateToAssignmentDetail(String(rowData.id) as string);
						}}
					/>
				);

			default:
				return rowData[columnId];
		}
	};

	const owner: PickerItem | undefined = collection.profile
		? {
				label: `${collection.profile.user.first_name} ${collection.profile.user.last_name} (${collection.profile.user.mail})`,
				type: 'PROFILE',
				value: collection.profile.id,
		  }
		: undefined;

	return (
		<>
			<Container mode="vertical">
				<Container mode="horizontal">
					<Form>
						<Spacer margin="bottom">
							<Grid>
								<Column size="3-7">
									<FormGroup
										label={t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___laatste-bewerkt-door'
										)}
									>
										<TextInput
											disabled
											value={
												getFullName(collection.updated_by, true, false) ||
												'-'
											}
										/>
									</FormGroup>
									<FormGroup
										label={t(
											'admin/collections-or-bundles/collections-or-bundles___aangepast-op'
										)}
									>
										<TextInput
											disabled
											value={
												collection.updated_at
													? formatTimestamp(collection.updated_at)
													: '-'
											}
										/>
									</FormGroup>
									{isCollection && (
										<FormGroup
											label={t(
												'collection/components/collection-or-bundle-edit-admin___briefing-s'
											)}
										>
											<TextArea
												height="auto"
												value={collection.briefing_id || undefined}
												onChange={(newBriefing: string) =>
													changeCollectionState({
														type: 'UPDATE_COLLECTION_PROP',
														collectionProp: 'briefing_id',
														collectionPropValue: newBriefing,
													})
												}
											/>
										</FormGroup>
									)}
									{PermissionService.hasPerm(
										user,
										isCollection
											? PermissionName.EDIT_COLLECTION_LABELS
											: PermissionName.EDIT_BUNDLE_LABELS
									) && (
										<FormGroup
											label={t(
												'collection/components/collection-or-bundle-edit-admin___kwaliteitslabels'
											)}
										>
											{!!qualityLabels && (
												<TagsInput
													options={qualityLabels}
													value={getCollectionLabels()}
													onChange={(values: TagInfo[]) =>
														updateCollectionMultiProperty(
															values,
															'collection_labels'
														)
													}
												/>
											)}
										</FormGroup>
									)}
									{PermissionService.hasPerm(
										user,
										isCollection
											? PermissionName.EDIT_COLLECTION_AUTHOR
											: PermissionName.EDIT_BUNDLE_AUTHOR
									) && (
										<FormGroup
											label={t(
												'collection/components/collection-or-bundle-edit-admin___eigenaar'
											)}
											required
										>
											<ContentPicker
												initialValue={owner}
												hideTargetSwitch
												hideTypeDropdown
												allowedTypes={['PROFILE']}
												onSelect={(value: PickerItem | null) => {
													if (!value) {
														return;
													}
													changeCollectionState({
														type: 'UPDATE_COLLECTION_PROP',
														collectionProp: 'owner_profile_id',
														collectionPropValue: value.value,
													});
												}}
											/>
										</FormGroup>
									)}
								</Column>
								<Column size="3-5">
									<></>
								</Column>
							</Grid>

							{/* Show bundles that contain this collection */}
							{isCollection && (
								<>
									<Spacer margin={['top-extra-large', 'bottom-small']}>
										<BlockHeading type="h2">
											{t(
												'collection/components/collection-or-bundle-edit-admin___bundels-die-deze-collectie-bevatten'
											)}
										</BlockHeading>
									</Spacer>
									{!!bundlesContainingCollection &&
									!!bundlesContainingCollection.length ? (
										<Table
											columns={[
												{
													label: t(
														'collection/components/collection-or-bundle-edit-admin___titel'
													),
													id: 'title',
													sortable: true,
												},
												{
													label: t(
														'collection/components/collection-or-bundle-edit-admin___auteur'
													),
													id: 'author',
													sortable: true,
												},
												{
													label: 'Organisatie',
													id: 'organization',
													sortable: false,
												},
												{
													label: t('admin/items/items___publiek'),
													id: 'is_public',
													sortable: true,
												},
												{
													tooltip: t(
														'collection/components/collection-or-bundle-edit-admin___acties'
													),
													id: 'actions',
													sortable: false,
												},
											]}
											data={bundlesContainingCollection}
											onColumnClick={handleBundleColumnClick as any}
											onRowClick={(coll) => navigateToBundleDetail(coll.id)}
											renderCell={renderBundleCell as any}
											sortColumn={bundleSortColumn}
											sortOrder={bundleSortOrder}
											variant="bordered"
											rowKey="id"
										/>
									) : (
										t(
											'collection/components/collection-or-bundle-edit-admin___deze-collectie-is-in-geen-enkele-bundel-opgenomen'
										)
									)}
								</>
							)}

							{/* Show assignments that contain this collection */}
							{isCollection && (
								<>
									<Spacer margin={['top-extra-large', 'bottom-small']}>
										<BlockHeading type="h2">
											{t(
												'collection/components/collection-or-bundle-edit-admin___opdrachten-die-deze-collectie-bevatten'
											)}
										</BlockHeading>
									</Spacer>
									{!!assignmentsContainingCollection &&
									!!assignmentsContainingCollection.length ? (
										<Table
											columns={[
												{
													label: t(
														'collection/components/collection-or-bundle-edit-admin___titel'
													),
													id: 'title',
													sortable: true,
												},
												{
													label: t(
														'collection/components/collection-or-bundle-edit-admin___auteur'
													),
													id: 'author',
													sortable: true,
												},
												{
													label: t(
														'collection/components/collection-or-bundle-edit-admin___status'
													),
													id: 'is_archived',
													sortable: true,
												},
												{
													tooltip: t(
														'collection/components/collection-or-bundle-edit-admin___acties'
													),
													id: 'actions',
													sortable: false,
												},
											]}
											data={assignmentsContainingCollection}
											onColumnClick={handleAssignmentColumnClick as any}
											onRowClick={(coll) =>
												navigateToAssignmentDetail(coll.id)
											}
											renderCell={renderAssignmentCell as any}
											sortColumn={assignmentSortColumn}
											sortOrder={assignmentSortOrder}
											variant="bordered"
											rowKey="id"
										/>
									) : (
										t(
											'collection/components/collection-or-bundle-edit-admin___deze-collectie-is-in-geen-enkele-opdracht-opgenomen'
										)
									)}
								</>
							)}
						</Spacer>
					</Form>
				</Container>
			</Container>
		</>
	);
};

export default withUser(CollectionOrBundleEditAdmin) as FunctionComponent<
	CollectionOrBundleEditAdminProps
>;
