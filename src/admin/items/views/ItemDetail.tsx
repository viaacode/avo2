import { get, orderBy } from 'lodash-es';
import React, { FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Container,
	Icon,
	Spacer,
	Table,
	Toolbar,
	ToolbarRight,
} from '@viaa/avo2-components';
import { RichEditorState } from '@viaa/avo2-components/dist/esm/wysiwyg';
import { Avo } from '@viaa/avo2-types';

import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { CollectionService } from '../../../collection/collection.service';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import WYSIWYGWrapper from '../../../shared/components/WYSIWYGWrapper/WYSIWYGWrapper';
import { WYSIWYG_OPTIONS_FULL } from '../../../shared/constants';
import { buildLink, CustomError, navigate, sanitizeHtml } from '../../../shared/helpers';
import { getSubtitles } from '../../../shared/helpers/get-subtitles';
import { truncateTableValue } from '../../../shared/helpers/truncate';
import { ToastService } from '../../../shared/services';
import { RelationService } from '../../../shared/services/relation-service/relation.service';
import { ADMIN_PATH } from '../../admin.const';
import {
	renderDateDetailRows,
	renderDetailRow,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { Color } from '../../shared/types';
import DepublishItemModal from '../components/DepublishItemModal/DepublishItemModal';
import { ItemsService } from '../items.service';

type CollectionColumnId = 'title' | 'author' | 'is_public' | 'organization' | 'actions';

/* eslint-disable @typescript-eslint/no-unused-vars */
const columnIdToCollectionPath: { [columnId in CollectionColumnId]: string } = {
	/* eslint-enable @typescript-eslint/no-unused-vars */
	title: 'title',
	author: 'profile.user.last_name',
	is_public: 'is_public',
	organization: 'profile.profile_organizations[0].organization_id',
	actions: '',
};

interface ItemDetailProps extends RouteComponentProps<{ id: string }> {}

const ItemDetail: FunctionComponent<ItemDetailProps> = ({ history, match }) => {
	// Hooks
	const [item, setItem] = useState<Avo.Item.Item | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isConfirmPublishModalOpen, setIsConfirmPublishModalOpen] = useState<boolean>(false);
	const [isDepublishItemModalOpen, setDepublishItemModalOpen] = useState<boolean>(false);
	const [collectionsContainingItem, setCollectionsContainingItem] = useState<
		Avo.Collection.Collection[] | undefined
	>(undefined);
	const [collectionSortColumn, setCollectionSortColumn] = useState<string>('title');
	const [collectionSortOrder, setCollectionSortOrder] = useState<Avo.Search.OrderDirection>(
		'asc'
	);
	const [noteEditorState, setNoteEditorState] = useState<RichEditorState>();

	const [t] = useTranslation();

	const fetchItemById = useCallback(async () => {
		try {
			const itemObj = await ItemsService.fetchItemByUuid(match.params.id);

			const replacedByUuid: string | undefined = get(itemObj, 'relations[0].object');
			if (replacedByUuid && itemObj.relations) {
				itemObj.relations[0].object_meta = await ItemsService.fetchItemByUuid(
					replacedByUuid
				);
			}

			setItem(itemObj);
		} catch (err) {
			console.error(new CustomError('Failed to get item by uuid', err));
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/items/views/item-detail___het-ophalen-van-de-item-info-is-mislukt'
				),
			});
		}
	}, [setItem, setLoadingInfo, t, match.params.id]);

	const fetchCollectionsByItemExternalId = useCallback(async () => {
		try {
			if (!item) {
				return;
			}
			const colls = await CollectionService.fetchCollectionsByFragmentId(item.external_id);
			setCollectionsContainingItem(colls);
		} catch (err) {
			console.error(
				new CustomError('Failed to get collections containing item', err, {
					item,
				})
			);
			ToastService.danger(
				t(
					'admin/items/views/item-detail___het-ophalen-van-de-collecties-die-dit-item-bevatten-is-mislukt'
				)
			);
		}
	}, [setCollectionsContainingItem, t, item]);

	useEffect(() => {
		fetchItemById();
	}, [fetchItemById]);

	useEffect(() => {
		if (item) {
			fetchCollectionsByItemExternalId();
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [item, setLoadingInfo, fetchCollectionsByItemExternalId]);

	const toggleItemPublishedState = async () => {
		try {
			if (!item) {
				throw new CustomError('The item has not been loaded yet', null, { item });
			}
			if (!item.is_published) {
				await ItemsService.setItemPublishedState(item.uid, !item.is_published);
				ToastService.success(t('admin/items/views/item-detail___het-item-is-gepubliceerd'));
				await RelationService.deleteRelationsBySubject('item', item.uid, 'IS_REPLACED_BY');
				await ItemsService.setItemDepublishReason(item.uid, null);

				fetchItemById();
			} else {
				setDepublishItemModalOpen(true);
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to toggle is_published state for item', err, { item })
			);
			ToastService.danger(
				t('admin/items/views/item-detail___het-de-publiceren-van-het-item-is-mislukt')
			);
		}
	};

	const navigateToItemDetail = () => {
		if (!item) {
			ToastService.danger(
				t('admin/items/views/item-detail___dit-item-heeft-geen-geldig-pid')
			);
			return;
		}
		const link = buildLink(APP_PATH.ITEM_DETAIL.route, { id: item.external_id });
		redirectToClientPage(link, history);
	};

	const navigateToCollectionDetail = (id: string) => {
		const link = buildLink(APP_PATH.COLLECTION_DETAIL.route, { id });
		redirectToClientPage(link, history);
	};

	const handleCollectionColumnClick = (columnId: CollectionColumnId) => {
		const sortOrder = collectionSortOrder === 'asc' ? 'desc' : 'asc'; // toggle
		setCollectionSortColumn(columnId);
		setCollectionSortOrder(sortOrder);
		setCollectionsContainingItem(
			orderBy(
				collectionsContainingItem,
				[(coll) => get(coll, columnIdToCollectionPath[columnId])],
				[sortOrder]
			)
		);
	};

	const saveNotes = async () => {
		try {
			if (!item) {
				return;
			}
			await ItemsService.setItemNotes(
				item.uid,
				sanitizeHtml(
					(noteEditorState ? noteEditorState.toHTML() : (item as any).note) || '',
					'link'
				) || null
			);
			ToastService.success(t('admin/items/views/item-detail___opmerkingen-opgeslagen'));
		} catch (err) {
			console.error(new CustomError('Failed to save item notes', err, { item }));
			ToastService.danger(
				t('admin/items/views/item-detail___het-opslaan-van-de-opmerkingen-is-mislukt')
			);
		}
	};

	const renderCollectionCell = (
		rowData: Partial<Avo.Collection.Collection>,
		columnId: CollectionColumnId
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
							'admin/items/views/item-detail___ga-naar-de-collectie-detail-pagina'
						)}
						ariaLabel={t(
							'admin/items/views/item-detail___ga-naar-de-collectie-detail-pagina'
						)}
						onClick={(evt) => {
							evt.stopPropagation();
							navigateToCollectionDetail(rowData.id as string);
						}}
					/>
				);

			default:
				return rowData[columnId];
		}
	};

	const renderItemDetail = () => {
		if (!item) {
			console.error(
				new CustomError(
					'Failed to load item because render function is called before item was fetched'
				)
			);
			return;
		}

		const replacementTitle = get(item, 'relations[0].object_meta.title');
		const replacementExternalId = get(item, 'relations[0].object_meta.external_id');
		const replacementUuid = get(item, 'relations[0].object_meta.uid');

		const subtitles = getSubtitles(item);

		return (
			<Container mode="vertical" size="small">
				<Container mode="horizontal">
					<Table horizontal variant="invisible" className="c-table_detail-page">
						<tbody>
							{renderSimpleDetailRows(item, [
								['uid', t('admin/items/views/item-detail___av-o-uuid')],
								['external_id', t('admin/items/views/item-detail___pid')],
								['is_published', t('admin/items/views/item-detail___pubiek')],
								['is_deleted', t('admin/items/views/item-detail___verwijderd')],
							])}
							{renderDateDetailRows(item, [
								['created_at', t('admin/items/views/item-detail___aangemaakt-op')],
								['updated_at', t('admin/items/views/item-detail___aangepast-op')],
								['issued', t('admin/items/views/item-detail___uitgegeven-op')],
								[
									'published_at',
									t('admin/items/views/item-detail___gepubliceert-op'),
								],
								[
									'publish_at',
									t('admin/items/views/item-detail___te-publiceren-op'),
								],
								[
									'depublish_at',
									t('admin/items/views/item-detail___te-depubliceren-op'),
								],
							])}
							{renderSimpleDetailRows(item, [
								[
									'depublish_reason',
									t('admin/items/views/item-detail___reden-tot-depubliceren'),
								],
							])}
							{renderDetailRow(
								!!replacementUuid ? (
									<Link
										to={buildLink(ADMIN_PATH.ITEM_DETAIL, {
											id: replacementUuid,
										})}
									>{`${replacementTitle} (${replacementExternalId})`}</Link>
								) : (
									'-'
								),
								t('admin/items/views/item-detail___vervangen-door')
							)}
							{renderSimpleDetailRows(item, [
								[
									'view_counts_aggregate.aggregate.sum.count',
									t('admin/items/views/item-detail___views'),
								],
							])}
							{renderDetailRow(
								subtitles
									? subtitles.map((subtitle) => (
											<a key={subtitle.id} href={subtitle.src}>
												{subtitle.label}
											</a>
									  ))
									: '-',
								t('admin/items/views/item-detail___ondertitels')
							)}
							{renderDetailRow(
								<>
									<Spacer margin="right-small">
										<Spacer margin={['top']}>
											<div style={{ backgroundColor: Color.White }}>
												<WYSIWYGWrapper
													id="note"
													controls={WYSIWYG_OPTIONS_FULL}
													fileType="ITEM_NOTE_IMAGE"
													initialHtml={item.note || undefined}
													state={noteEditorState}
													onChange={setNoteEditorState}
												/>
											</div>
										</Spacer>
										<Toolbar>
											<ToolbarRight>
												<Button
													label={t(
														'admin/items/views/item-detail___opmerkingen-opslaan'
													)}
													onClick={saveNotes}
												/>
											</ToolbarRight>
										</Toolbar>
									</Spacer>
								</>,
								t('admin/items/views/item-detail___opmerkingen')
							)}
						</tbody>
					</Table>
					<Spacer margin="top-extra-large">
						<BlockHeading type="h2">
							{t('admin/items/views/item-detail___collecties-die-dit-item-bevatten')}
						</BlockHeading>
					</Spacer>
					{!!collectionsContainingItem && !!collectionsContainingItem.length ? (
						<Table
							columns={[
								{
									label: t('admin/items/views/item-detail___titel'),
									id: 'title',
									sortable: true,
								},
								{
									label: t('admin/items/views/item-detail___auteur'),
									id: 'author',
									sortable: true,
								},
								{ label: 'Organisatie', id: 'organization', sortable: false },
								{
									label: t('admin/items/items___publiek'),
									id: 'is_public',
									sortable: true,
								},
								{
									tooltip: t('admin/items/views/item-detail___acties'),
									id: 'actions',
									sortable: false,
								},
							]}
							data={collectionsContainingItem}
							emptyStateMessage={t(
								'admin/items/views/item-detail___dit-item-is-in-geen-enkele-collectie-opgenomen'
							)}
							onColumnClick={handleCollectionColumnClick as any}
							onRowClick={(coll) => navigateToCollectionDetail(coll.id)}
							renderCell={renderCollectionCell as any}
							sortColumn={collectionSortColumn}
							sortOrder={collectionSortOrder}
							variant="bordered"
							rowKey="id"
						/>
					) : (
						t(
							'admin/items/views/item-detail___dit-item-is-in-geen-enkele-collectie-opgenomen'
						)
					)}
					<DeleteObjectModal
						title={
							item.is_published
								? t('admin/items/views/item-detail___depubliceren')
								: t('admin/items/views/item-detail___publiceren')
						}
						body={
							item.is_published
								? t(
										'admin/items/views/item-detail___weet-je-zeker-dat-je-dit-item-wil-depubliceren'
								  )
								: t(
										'admin/items/views/item-detail___weet-je-zeker-dat-je-dit-item-wil-publiceren'
								  )
						}
						confirmLabel={
							item.is_published
								? t('admin/items/views/item-detail___depubliceren')
								: 'Publiceren'
						}
						isOpen={isConfirmPublishModalOpen}
						onClose={() => setIsConfirmPublishModalOpen(false)}
						deleteObjectCallback={toggleItemPublishedState}
					/>
					<DepublishItemModal
						item={item}
						isOpen={isDepublishItemModalOpen}
						onClose={() => {
							setDepublishItemModalOpen(false);
							fetchItemById();
						}}
					/>
				</Container>
			</Container>
		);
	};

	const renderItemDetailPage = () => {
		if (!item) {
			return null;
		}
		return (
			<AdminLayout
				onClickBackButton={() => navigate(history, ADMIN_PATH.ITEMS_OVERVIEW)}
				pageTitle={`${t('admin/items/views/item-detail___item-details')}: ${item.title}`}
				size="large"
			>
				<AdminLayoutTopBarRight>
					{!!item && (
						<ButtonToolbar>
							<Button
								type={item.is_published ? 'danger' : 'primary'}
								label={
									item.is_published
										? t('admin/items/views/item-detail___depubliceren')
										: t('admin/items/views/item-detail___publiceren')
								}
								ariaLabel={
									item.is_published
										? t('admin/items/views/item-detail___depubliceer-dit-item')
										: t('admin/items/views/item-detail___publiceer-dit-item')
								}
								title={
									item.is_published
										? t('admin/items/views/item-detail___depubliceer-dit-item')
										: t('admin/items/views/item-detail___publiceer-dit-item')
								}
								onClick={() => {
									if (item.is_published) {
										setIsConfirmPublishModalOpen(true);
									} else {
										toggleItemPublishedState();
									}
								}}
							/>
							<Button
								label={t(
									'admin/items/views/item-detail___bekijk-item-in-de-website'
								)}
								onClick={navigateToItemDetail}
							/>
						</ButtonToolbar>
					)}
				</AdminLayoutTopBarRight>
				<AdminLayoutBody>{renderItemDetail()}</AdminLayoutBody>
			</AdminLayout>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						get(item, 'title'),
						t('admin/items/views/item-detail___item-beheer-detail-pagina-titel')
					)}
				</title>
				<meta name="description" content={get(item, 'description') || ''} />
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={item}
				render={renderItemDetailPage}
			/>
		</>
	);
};

export default ItemDetail;
