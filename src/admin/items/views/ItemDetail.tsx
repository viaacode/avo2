import { get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';

import { Button, ButtonToolbar, Container, Table, Thumbnail } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { APP_PATH } from '../../../constants';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import {
	renderDateDetailRows,
	renderMultiOptionDetailRows,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';

import { ItemsService } from '../items.service';

interface ItemDetailProps extends RouteComponentProps<{ id: string }> {}

const ItemDetail: FunctionComponent<ItemDetailProps> = ({ history, match }) => {
	// Hooks
	const [item, setItem] = useState<Avo.Item.Item | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isConfirmPublishModalOpen, setIsConfirmPublishModalOpen] = useState<boolean>(false);

	const [t] = useTranslation();

	const fetchItemById = useCallback(async () => {
		try {
			setItem(await ItemsService.fetchItem(match.params.id));
		} catch (err) {
			console.error(
				new CustomError('Failed to get item by id', err, {
					query: 'GET_ITEM_BY_ID',
					variables: {
						id: match.params.id,
					},
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/items/views/item-detail___het-ophalen-van-de-item-info-is-mislukt'
				),
			});
		}
	}, [setItem, setLoadingInfo, t, match.params.id]);

	useEffect(() => {
		fetchItemById();
	}, [fetchItemById]);

	useEffect(() => {
		if (item) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [item, setLoadingInfo]);

	const toggleItemPublishedState = async () => {
		try {
			if (!item) {
				throw new CustomError('The item has not been loaded yet', null, { item });
			}
			await ItemsService.setItemPublishedState(item.uid, !item.is_published);
			ToastService.success(
				item.is_published
					? t('admin/items/views/item-detail___het-item-is-gepubliceerd')
					: t('admin/items/views/item-detail___het-item-is-gedepubliceerd')
			);
			setItem({
				...item,
				is_published: !item.is_published,
			});
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
				t('admin/items/views/item-detail___dit-item-heeft-geen-geldig-pid'),
				false
			);
			return;
		}
		const link = buildLink(APP_PATH.ITEM_DETAIL.route, { id: item.external_id });
		redirectToClientPage(link, history);
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
		return (
			<Container mode="vertical" size="small">
				<Container mode="horizontal">
					<Table horizontal variant="invisible" className="c-table_detail-page">
						<tbody>
							<tr>
								<th>
									<Trans i18nKey="admin/items/views/item-detail___cover-afbeelding">
										Cover Afbeelding
									</Trans>
								</th>
								<td>
									<Container size="medium">
										<Thumbnail
											category={get(item, 'type.label', 'video')}
											src={item.thumbnail_path}
										/>
									</Container>
								</td>
							</tr>
							{renderSimpleDetailRows(item, [
								['uid', t('admin/items/views/item-detail___av-o-uuid')],
								['external_id', t('admin/items/views/item-detail___pid')],
								['title', t('admin/items/views/item-detail___titel')],
								['description', t('admin/items/views/item-detail___beschrijving')],
								['type.label', t('admin/items/views/item-detail___type')],
								['series', t('admin/items/views/item-detail___reeks')],
								['organisation.name', t('admin/items/views/item-detail___cp')],
								['duration', t('admin/items/views/item-detail___lengte')],
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
								[
									'expiry_date',
									t('admin/items/views/item-detail___expiratie-datum'),
								],
							])}
							{renderMultiOptionDetailRows(item, [
								['lom_classification', t('admin/items/views/item-detail___vakken')],
								[
									'lom_context',
									t('admin/items/views/item-detail___opleidingniveaus'),
								],
								[
									'lom_intendedenduserrole',
									t('admin/items/views/item-detail___bedoeld-voor'),
								],
								['lom_keywords', t('admin/items/views/item-detail___trefwoorden')],
								['lom_languages', t('admin/items/views/item-detail___talen')],
								[
									'lom_typicalagerange',
									t('admin/items/views/item-detail___leeftijdsgroepen'),
								],
							])}
							{renderSimpleDetailRows(item, [
								[
									'view_counts_aggregate.aggregate.count',
									t('admin/items/views/item-detail___views'),
								],
							])}
						</tbody>
					</Table>
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
				showBackButton
				pageTitle={`${t('admin/items/views/item-detail___item-details')}: ${item.title}`}
			>
				<AdminLayoutTopBarRight>
					{!!item && (
						<ButtonToolbar>
							<Button
								type="danger"
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
								onClick={() => setIsConfirmPublishModalOpen(true)}
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
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={item}
			render={renderItemDetailPage}
		/>
	);
};

export default ItemDetail;
