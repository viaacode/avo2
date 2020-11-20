import { useMutation } from '@apollo/react-hooks';
import { fromPairs, get, isNil } from 'lodash-es';
import React, { FunctionComponent, ReactText, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
	Button,
	ButtonToolbar,
	Icon,
	MetaData,
	MetaDataItem,
	Pagination,
	Spacer,
	Table,
	TableColumn,
	Thumbnail,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileName } from '../../authentication/helpers/get-profile-info';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { BUNDLE_PATH } from '../../bundle/bundle.const';
import { APP_PATH } from '../../constants';
import { ErrorView } from '../../error/views';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../shared/components';
import MoreOptionsDropdown from '../../shared/components/MoreOptionsDropdown/MoreOptionsDropdown';
import {
	buildLink,
	createDropdownMenuItem,
	formatDate,
	formatTimestamp,
	generateAssignmentCreateLink,
	isMobileWidth,
	navigate,
} from '../../shared/helpers';
import { truncateTableValue } from '../../shared/helpers/truncate';
import { ApolloCacheManager, ToastService } from '../../shared/services';
import { trackEvents } from '../../shared/services/event-logging-service';
import { ITEMS_PER_PAGE } from '../../workspace/workspace.const';
import { DELETE_COLLECTION } from '../collection.gql';
import { CollectionService } from '../collection.service';
import { ContentTypeNumber, toDutchContentType } from '../collection.types';

import './CollectionOrBundleOverview.scss';
import DeleteCollectionModal from './modals/DeleteCollectionModal';

interface CollectionOrBundleOverviewProps extends DefaultSecureRouteProps {
	numberOfItems: number;
	type: 'collection' | 'bundle';
	onUpdate: () => void | Promise<void>;
}

const CollectionOrBundleOverview: FunctionComponent<CollectionOrBundleOverviewProps> = ({
	numberOfItems,
	type,
	onUpdate = () => {},
	history,
	user,
}) => {
	const [t] = useTranslation();

	// State
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [collections, setCollections] = useState<Avo.Collection.Collection[] | null>(null);
	const [permissions, setPermissions] = useState<{
		[collectionId: string]: { canEdit?: boolean; canDelete?: boolean };
	}>({});

	const [dropdownOpen, setDropdownOpen] = useState<{ [key: string]: boolean }>({});
	const [idToDelete, setIdToDelete] = useState<string | null>(null);
	const [sortColumn, setSortColumn] = useState<keyof Avo.Collection.Collection>('updated_at');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [page, setPage] = useState<number>(0);

	// Mutations
	const [triggerCollectionDelete] = useMutation(DELETE_COLLECTION);

	// Listeners
	const onClickDelete = (collectionId: string) => {
		setDropdownOpen({ [collectionId]: false });
		setIdToDelete(collectionId);
	};

	const isCollection = type === 'collection';

	const fetchCollections = useCallback(async () => {
		try {
			const collections = await CollectionService.fetchCollectionsByOwner(
				user,
				page * ITEMS_PER_PAGE,
				ITEMS_PER_PAGE,
				{ [sortColumn]: sortOrder },
				isCollection ? ContentTypeNumber.collection : ContentTypeNumber.bundle
			);

			// Check edit and delete permissions for every row, so we can show the correct dropdown list of operations
			let perms: boolean[][];
			if (isCollection) {
				perms = await Promise.all(
					(collections || []).map((collection: Avo.Collection.Collection) => {
						const editPermission = PermissionService.hasPermissions(
							[
								{
									name: PermissionName.EDIT_OWN_COLLECTIONS,
									obj: collection,
								},
								PermissionName.EDIT_ANY_COLLECTIONS,
							],
							user
						);
						const deletePermission = PermissionService.hasPermissions(
							[
								{
									name: PermissionName.DELETE_OWN_COLLECTIONS,
									obj: collection,
								},
								PermissionName.DELETE_ANY_COLLECTIONS,
							],
							user
						);
						return Promise.all([editPermission, deletePermission]);
					})
				);
			} else {
				// bundles
				perms = await Promise.all(
					collections.map((bundle: Avo.Collection.Collection) => {
						const editPermission = PermissionService.hasPermissions(
							[
								{
									name: PermissionName.EDIT_OWN_BUNDLES,
									obj: bundle,
								},
								PermissionName.EDIT_ANY_BUNDLES,
							],
							user
						);
						const deletePermission = PermissionService.hasPermissions(
							[
								{
									name: PermissionName.DELETE_OWN_BUNDLES,
									obj: bundle,
								},
								PermissionName.DELETE_ANY_BUNDLES,
							],
							user
						);
						return Promise.all([editPermission, deletePermission]);
					})
				);
			}
			setPermissions(
				fromPairs(
					perms.map((permsForCollection: boolean[], index: number) => [
						collections[index].id,
						{
							canEdit: permsForCollection[0],
							canDelete: permsForCollection[1],
						},
					])
				)
			);
			setCollections(collections);
		} catch (err) {
			console.error('Failed to fetch collections', err, {});
			setLoadingInfo({
				state: 'error',
				message: isCollection
					? t(
							'collection/components/collection-or-bundle-overview___het-ophalen-van-de-collecties-is-mislukt'
					  )
					: t(
							'collection/components/collection-or-bundle-overview___het-ophalen-van-de-bundels-is-mislukt'
					  ),
				actionButtons: ['home'],
			});
		}
	}, [user, page, sortColumn, sortOrder, isCollection, t]);

	useEffect(() => {
		fetchCollections();
	}, [fetchCollections]);

	useEffect(() => {
		if (collections) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [setLoadingInfo, collections]);

	const onDeleteCollection = async () => {
		try {
			await triggerCollectionDelete({
				variables: {
					id: idToDelete,
				},
				update: ApolloCacheManager.clearCollectionCache,
			});

			trackEvents(
				{
					object: String(idToDelete),
					object_type: type,
					message: `Gebruiker ${getProfileName(user)} heeft een ${toDutchContentType(
						type
					)} verwijderd`,
					action: 'delete',
				},
				user
			);

			ToastService.success(
				isCollection
					? t(
							'collection/components/collection-or-bundle-overview___collectie-is-verwijderd'
					  )
					: t(
							'collection/components/collection-or-bundle-overview___bundel-is-verwijderd'
					  )
			);
			onUpdate();
			fetchCollections();
		} catch (err) {
			console.error(err);
			ToastService.danger(
				isCollection
					? t(
							'collection/components/collection-or-bundle-overview___collectie-kon-niet-verwijderd-worden'
					  )
					: t(
							'collection/components/collection-or-bundle-overview___bundel-kon-niet-verwijderd-worden'
					  )
			);
		}

		setIdToDelete(null);
	};

	const onClickCreate = () =>
		history.push(
			buildLink(
				APP_PATH.SEARCH.route,
				{},
				isCollection
					? { filters: '{"type":["video","audio"]}' }
					: { filters: '{"type":["collectie"]}' }
			)
		);

	// TODO: Make shared function because also used in assignments
	const onClickColumn = (columnId: keyof Avo.Collection.Collection) => {
		if (sortColumn === columnId) {
			// Change column sort order
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			// Initial column sort order
			setSortColumn(columnId);
			setSortOrder('asc');
		}
	};

	// Render functions
	const getLinkProps = (id: string, title: string): { to: string; title: string } => ({
		title,
		to: buildLink(isCollection ? APP_PATH.COLLECTION_DETAIL.route : BUNDLE_PATH.BUNDLE_DETAIL, {
			id,
		}),
	});

	const renderThumbnail = ({ id, title, thumbnail_path }: Avo.Collection.Collection) => (
		<Link {...getLinkProps(id, title)}>
			<Thumbnail
				alt="thumbnail"
				category={type}
				className="m-collection-overview-thumbnail"
				src={thumbnail_path || undefined}
			/>
		</Link>
	);

	const renderTitle = (collection: Avo.Collection.Collection) => (
		<div className="c-content-header">
			<h3 className="c-content-header__header">
				<Link {...getLinkProps(collection.id, collection.title)}>
					{truncateTableValue(collection.title)}
				</Link>
			</h3>
			<div className="c-content-header__meta u-text-muted">
				<MetaData category={type}>
					<MetaDataItem>
						<span title={`Aangemaakt: ${formatDate(collection.created_at)}`}>
							{formatDate(collection.created_at)}
						</span>
					</MetaDataItem>
					<MetaDataItem
						icon="eye"
						label={get(collection, 'view_counts_aggregate.aggregate.sum.count') || '0'}
					/>
				</MetaData>
			</div>
		</div>
	);

	const renderActions = (collectionId: string) => {
		const ROW_DROPDOWN_ITEMS = [
			...(permissions[collectionId] && permissions[collectionId].canEdit
				? [
						createDropdownMenuItem(
							'edit',
							t('collection/views/collection-overview___bewerk'),
							'edit2'
						),
				  ]
				: []),
			...(isCollection && PermissionService.hasPerm(user, PermissionName.CREATE_ASSIGNMENTS)
				? [
						createDropdownMenuItem(
							'createAssignment',
							t('collection/views/collection-overview___maak-opdracht'),
							'clipboard'
						),
				  ]
				: []),
			...(permissions[collectionId] && permissions[collectionId].canDelete
				? [
						createDropdownMenuItem(
							'delete',
							t('collection/views/collection-overview___verwijderen')
						),
				  ]
				: []),
		];

		// Listeners
		const onClickDropdownItem = (item: ReactText) => {
			setDropdownOpen({ [collectionId]: false });
			switch (item) {
				case 'edit':
					navigate(
						history,
						isCollection ? APP_PATH.COLLECTION_EDIT.route : BUNDLE_PATH.BUNDLE_EDIT,
						{ id: collectionId }
					);
					break;
				case 'createAssignment':
					history.push(
						generateAssignmentCreateLink('KIJK', `${collectionId}`, 'COLLECTIE')
					);
					break;
				case 'delete':
					onClickDelete(collectionId);
					break;
				default:
					return null;
			}
		};

		if (!ROW_DROPDOWN_ITEMS.length) {
			return null;
		}

		return (
			<ButtonToolbar>
				<MoreOptionsDropdown
					isOpen={dropdownOpen[collectionId] || false}
					onOpen={() => setDropdownOpen({ [collectionId]: true })}
					onClose={() => setDropdownOpen({ [collectionId]: false })}
					menuItems={ROW_DROPDOWN_ITEMS}
					onOptionClicked={onClickDropdownItem}
				/>

				{!isMobileWidth() && (
					<Button
						icon="chevron-right"
						onClick={() =>
							navigate(
								history,
								isCollection
									? APP_PATH.COLLECTION_DETAIL.route
									: BUNDLE_PATH.BUNDLE_DETAIL,
								{ id: collectionId }
							)
						}
						title={
							isCollection
								? t(
										'collection/components/collection-or-bundle-overview___bekijk-deze-collectie'
								  )
								: t(
										'collection/components/collection-or-bundle-overview___bekijk-deze-bundel'
								  )
						}
						type="borderless"
					/>
				)}
			</ButtonToolbar>
		);
	};

	const renderCell = (collection: Avo.Collection.Collection, colKey: string) => {
		const { id } = collection;

		switch (colKey) {
			case 'thumbnail':
				return renderThumbnail(collection);

			case 'title':
				return renderTitle(collection);

			case 'inFolder':
				const isInFolder = true; // TODO: Check if collection is in bundle
				return isInFolder && <Button icon="folder" type="borderless" />;

			case 'is_public':
				return (
					<div
						title={
							collection.is_public
								? t('collection/components/collection-or-bundle-overview___publiek')
								: t(
										'collection/components/collection-or-bundle-overview___niet-publiek'
								  )
						}
					>
						<Icon name={collection.is_public ? 'unlock-3' : 'lock'} />
					</div>
				);

			// TODO re-enable once users can give share collection view/edit rights with other users
			// case 'access':
			// 	const userProfiles: Avo.User.Profile[] = compact([profile]); // TODO: Get all users that are allowed to edit this collection
			// 	const avatarProps = userProfiles.map(userProfile => {
			// 		const props = getAvatarProps(userProfile);
			// 		(props as any).subtitle = 'mag bewerken'; // TODO: Check permissions for all users
			// 		return props;
			// 	});
			//
			// 	return userProfiles && <AvatarList avatars={avatarProps} isOpen={false} />;

			case 'actions':
				return renderActions(id);

			case 'created_at':
			case 'updated_at':
				const cellData = collection[colKey as 'created_at' | 'updated_at'];
				return <span title={formatTimestamp(cellData)}>{formatDate(cellData)}</span>;

			default:
				return null;
		}
	};

	const getColumns = (): TableColumn[] => {
		if (isMobileWidth()) {
			return [
				{ id: 'thumbnail', label: '', col: '2' },
				{
					id: 'title',
					label: t('collection/views/collection-overview___titel'),
					col: '6',
					sortable: true,
				},
				{
					id: 'actions',
					tooltip: t('collection/components/collection-or-bundle-overview___acties'),
					col: '1',
				},
			];
		}
		return [
			{
				id: 'thumbnail',
				tooltip: t('collection/components/collection-or-bundle-overview___cover'),
				col: '2',
			},
			{
				id: 'title',
				label: t('collection/views/collection-overview___titel'),
				col: '6',
				sortable: true,
			},
			{
				id: 'updated_at',
				label: t('collection/views/collection-overview___laatst-bewerkt'),
				col: '3',
				sortable: true,
			},
			{
				id: 'is_public',
				label: t('collection/components/collection-or-bundle-overview___is-publiek'),
				col: '2',
				sortable: true,
			},
			// TODO re-enable once we can put collections in folders https://meemoo.atlassian.net/browse/AVO-591
			// ...(isCollection
			// 	? [
			// 			{
			// 				id: 'inFolder',
			// 				label: t('collection/views/collection-overview___in-map'),
			// 				col: '2' as any,
			// 			},
			// 	  ]
			// 	: []),
			// TODO re-enable once users can give share collection view/edit rights with other users
			// {
			// 	id: 'access',
			// 	label: t('collection/views/collection-overview___toegang'),
			// 	col: '2',
			// },
			{
				id: 'actions',
				tooltip: t('collection/components/collection-or-bundle-overview___acties'),
				col: '1',
			},
		];
	};

	const renderPagination = () => (
		<Pagination
			pageCount={Math.ceil(numberOfItems / ITEMS_PER_PAGE)}
			currentPage={page}
			onPageChange={setPage}
		/>
	);

	const renderTable = (collections: Avo.Collection.Collection[]) => (
		<>
			<Table
				columns={getColumns()}
				data={collections}
				emptyStateMessage={t(
					'collection/views/collection-overview___geen-resultaten-gevonden'
				)}
				renderCell={renderCell}
				rowKey="id"
				variant="styled"
				onColumnClick={onClickColumn as any}
				sortColumn={sortColumn}
				sortOrder={sortOrder}
			/>
			<Spacer margin="top-large">{renderPagination()}</Spacer>
		</>
	);

	const renderEmptyFallback = () => (
		<ErrorView
			icon={isCollection ? 'collection' : 'folder'}
			message={
				isCollection
					? t(
							'collection/views/collection-overview___je-hebt-nog-geen-collecties-aangemaakt'
					  )
					: t(
							'collection/components/collection-or-bundle-overview___je-hebt-nog-geen-bundels-aangemaakt'
					  )
			}
		>
			<p>
				{isCollection ? (
					<Trans i18nKey="collection/views/collection-overview___beschrijving-hoe-collecties-aan-te-maken">
						Een collectie is een verzameling van video- of audiofragmenten rond een
						bepaald thema of voor een bepaalde les. Nadat je een collectie hebt
						aangemaakt kan je deze delen met andere gebruikers om samen aan te werken.
						Andere gebruikers kunnen ook collecties met jou delen die je dan hier
						terugvindt.
					</Trans>
				) : (
					<Trans i18nKey="collection/components/beschrijving-hoe-collecties-aan-te-maken">
						Een bundel is een verzameling van collecties rond een bepaald thema of voor
						een bepaalde les. Nadat je een bundel hebt aangemaakt kan je deze delen met
						andere gebruikers om samen aan te werken. Andere gebruikers kunnen ook
						bundels met jou delen die je dan hier terugvindt.
					</Trans>
				)}
			</p>
			<Spacer margin="top">
				<Button
					type="primary"
					icon="search"
					autoHeight
					label={
						isCollection
							? t('collection/views/collection-overview___maak-je-eerste-collectie')
							: t(
									'collection/components/collection-or-bundle-overview___zoek-een-collectie-en-maak-je-eerste-bundel'
							  )
					}
					onClick={onClickCreate}
				/>
			</Spacer>
		</ErrorView>
	);

	const renderDeleteModal = () => {
		if (isCollection) {
			return (
				<DeleteCollectionModal
					collectionId={idToDelete as string}
					isOpen={!isNil(idToDelete)}
					onClose={() => setIdToDelete(null)}
					deleteObjectCallback={onDeleteCollection}
				/>
			);
		}
		return (
			<DeleteObjectModal
				title={t('collection/components/collection-or-bundle-overview___verwijder-bundel')}
				body={t(
					'collection/views/collection-overview___bent-u-zeker-deze-actie-kan-niet-worden-ongedaan-gemaakt'
				)}
				isOpen={!isNil(idToDelete)}
				onClose={() => setIdToDelete(null)}
				deleteObjectCallback={onDeleteCollection}
			/>
		);
	};

	const renderCollections = () => (
		<>
			{collections && collections.length ? renderTable(collections) : renderEmptyFallback()}
			{!isNil(idToDelete) && renderDeleteModal()}
		</>
	);

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={collections}
			render={renderCollections}
		/>
	);
};

export default CollectionOrBundleOverview;
