import classnames from 'classnames';
import { get, isNil } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Column,
	Container,
	EnglishContentType,
	Flex,
	Grid,
	Header,
	HeaderAvatar,
	HeaderButtons,
	HeaderContentType,
	Icon,
	IconName,
	MediaCard,
	MediaCardMetaData,
	MediaCardThumbnail,
	MetaData,
	MetaDataItem,
	Spacer,
	Table,
	TagList,
	Thumbnail,
	ToggleButton,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ItemsService } from '../../admin/items/items.service';
import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileName } from '../../authentication/helpers/get-profile-info';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import {
	ContentTypeNumber,
	ContentTypeString,
	toEnglishContentType,
} from '../../collection/collection.types';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import {
	InteractiveTour,
	LoadingErrorLoadedComponent,
	LoadingInfo,
	ShareThroughEmailModal,
} from '../../shared/components';
import { LANGUAGES } from '../../shared/constants';
import {
	buildLink,
	CustomError,
	generateAssignmentCreateLink,
	generateSearchLink,
	generateSearchLinks,
	generateSearchLinkString,
	isMobileWidth,
	reorderDate,
} from '../../shared/helpers';
import { generateRelatedItemLink } from '../../shared/helpers/handle-related-item-click';
import { BookmarksViewsPlaysService, ToastService } from '../../shared/services';
import { DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS } from '../../shared/services/bookmarks-views-plays-service';
import { BookmarkViewPlayCounts } from '../../shared/services/bookmarks-views-plays-service/bookmarks-views-plays-service.types';
import { trackEvents } from '../../shared/services/event-logging-service';
import { getRelatedItems } from '../../shared/services/related-items-service';
import { AddToCollectionModal, ItemVideoDescription } from '../components';
import ReportItemModal from '../components/modals/ReportItemModal';
import { RELATED_ITEMS_AMOUNT } from '../item.const';

import './ItemDetail.scss';

interface ItemDetailProps extends DefaultSecureRouteProps<{ id: string }> {}

const ItemDetail: FunctionComponent<ItemDetailProps> = ({ history, match, location, user }) => {
	const [t] = useTranslation();

	const [item, setItem] = useState<Avo.Item.Item | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isOpenAddToCollectionModal, setIsOpenAddToCollectionModal] = useState(false);
	const [isShareThroughEmailModalOpen, setIsShareThroughEmailModalOpen] = useState(false);
	const [isReportItemModalOpen, setIsReportItemModalOpen] = useState(false);
	const [relatedItems, setRelatedItems] = useState<Avo.Search.ResultItem[] | null>(null);
	const [bookmarkViewPlayCounts, setBookmarkViewPlayCounts] = useState<BookmarkViewPlayCounts>(
		DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS
	);

	useEffect(() => {
		if (item) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [item, setLoadingInfo]);

	/**
	 * Load item from database
	 */
	useEffect(() => {
		const retrieveRelatedItems = (currentItemId: string, limit: number) => {
			getRelatedItems(currentItemId, 'items', limit)
				.then(setRelatedItems)
				.catch((err) => {
					console.error('Failed to get related items', err, {
						currentItemId,
						limit,
						index: 'items',
					});
					ToastService.danger(
						t('item/views/item___het-ophalen-van-de-gerelateerde-items-is-mislukt')
					);
				});
		};

		const checkPermissionsAndGetItem = async () => {
			try {
				if (!PermissionService.hasPerm(user, PermissionName.VIEW_ANY_PUBLISHED_ITEMS)) {
					setLoadingInfo({
						state: 'error',
						message: t(
							'item/views/item___je-hebt-geen-rechten-om-dit-item-te-bekijken'
						),
						icon: 'lock',
					});
					return;
				}

				const itemObj:
					| (Avo.Item.Item & { replacement_for?: string })
					| null = await ItemsService.fetchItemByExternalId(match.params.id);
				if (!itemObj) {
					setLoadingInfo({
						state: 'error',
						message: t('item/views/item___dit-item-werd-niet-gevonden'),
						icon: 'search',
					});
					return;
				}

				if (itemObj.depublish_reason) {
					setLoadingInfo({
						state: 'error',
						message:
							t(
								'item/views/item-detail___dit-item-werdt-gedepubliceerd-met-volgende-reden'
							) + itemObj.depublish_reason,
						icon: 'camera-off',
					});
					return;
				}

				if (itemObj.replacement_for) {
					// Item was replaced by another item
					// We should reload the page, to update the url
					history.replace(
						buildLink(APP_PATH.ITEM_DETAIL.route, { id: itemObj.external_id })
					);
					return;
				}

				trackEvents(
					{
						object: match.params.id,
						object_type: 'item',
						message: `Gebruiker ${getProfileName(user)} heeft de pagina van fragment ${
							match.params.id
						} bezocht`,
						action: 'view',
					},
					user
				);

				BookmarksViewsPlaysService.action('view', 'item', itemObj.uid, user);

				retrieveRelatedItems(match.params.id, RELATED_ITEMS_AMOUNT);
				try {
					const counts = await BookmarksViewsPlaysService.getItemCounts(
						(itemObj as any).uid,
						user
					);
					setBookmarkViewPlayCounts(counts);
				} catch (err) {
					console.error(
						new CustomError('Failed to get getItemCounts', err, {
							uuid: (itemObj as any).uid,
						})
					);
					ToastService.danger(
						t(
							'item/views/item-detail___het-ophalen-van-het-aantal-keer-bekeken-gebookmarked-is-mislukt'
						)
					);
				}

				setItem(itemObj);
			} catch (err) {
				console.error(
					new CustomError('Failed to check permissions or get item from graphql', err, {
						user,
						itemId: match.params.id,
					})
				);
				setLoadingInfo({
					state: 'error',
					message: t('item/views/item-detail___het-ophalen-van-het-item-is-mislukt'),
				});
			}
		};

		checkPermissionsAndGetItem();
	}, [match.params.id, setItem, t, history, user]); // ensure only triggers once for user object

	const toggleBookmark = async () => {
		try {
			await BookmarksViewsPlaysService.toggleBookmark(
				(item as any).uid,
				user,
				'item',
				bookmarkViewPlayCounts.isBookmarked
			);

			setBookmarkViewPlayCounts({
				...bookmarkViewPlayCounts,
				isBookmarked: !bookmarkViewPlayCounts.isBookmarked,
			});
			ToastService.success(
				bookmarkViewPlayCounts.isBookmarked
					? t('collection/views/collection-detail___de-bladwijzer-is-verwijderd')
					: t('collection/views/collection-detail___de-bladwijzer-is-aangemaakt')
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to toggle bookmark', err, {
					user,
					itemId: (item as any).uid,
					type: 'item',
					isBookmarked: bookmarkViewPlayCounts.isBookmarked,
				})
			);
			ToastService.danger(
				bookmarkViewPlayCounts.isBookmarked
					? t('item/views/item-detail___het-verwijderen-van-de-bladwijzer-is-mislukt')
					: t('item/views/item-detail___het-aanmaken-van-de-bladwijzer-is-mislukt')
			);
		}
	};

	const goToSearchPage = (prop: Avo.Search.FilterProp, value: string) => {
		history.push(generateSearchLinkString(prop, value));
	};

	const trackOnPlay = () => {
		trackEvents(
			{
				object: get(item, 'external_id', ''),
				object_type: 'item',
				message: `${getProfileName(user)} heeft een item afgespeeld`,
				action: 'play',
			},
			user
		);
	};

	const renderRelatedItems = () => {
		if (relatedItems && relatedItems.length) {
			return relatedItems.map((relatedItem) => {
				const englishContentType: EnglishContentType =
					toEnglishContentType(relatedItem.administrative_type) ||
					ContentTypeString.video;

				return (
					<li key={`related-item-${relatedItem.id}`}>
						<Link
							to={generateRelatedItemLink(relatedItem)}
							className="a-link__no-styles"
						>
							<MediaCard
								category={englishContentType}
								orientation="horizontal"
								title={relatedItem.dc_title}
							>
								<MediaCardThumbnail>
									<Thumbnail
										category={englishContentType}
										src={relatedItem.thumbnail_path}
										showCategoryIcon
									/>
								</MediaCardThumbnail>
								<MediaCardMetaData>
									<MetaData category={englishContentType}>
										<MetaDataItem label={relatedItem.original_cp || ''} />
									</MetaData>
								</MediaCardMetaData>
							</MediaCard>
						</Link>
					</li>
				);
			});
		}
		return null;
	};

	const renderItem = () => {
		if (!item) {
			return null;
		}
		const englishContentType: EnglishContentType =
			toEnglishContentType(get(item, 'type.label')) || ContentTypeString.video;

		return (
			<>
				<Header
					title={item.title}
					category={toEnglishContentType(item.type.label)}
					showMetaData={true}
					className={classnames('c-item-detail__header', {
						'c-item-detail__header-mobile': isMobileWidth(),
					})}
				>
					<HeaderContentType
						category={toEnglishContentType(item.type.label)}
						label={item.type.label}
					>
						<Spacer margin="bottom">
							<div className="c-content-type c-content-type--video">
								<Icon
									name={
										(get(item, 'type.id') === ContentTypeNumber.audio
											? 'headphone'
											: get(item, 'type.label')) as IconName
									}
								/>
								<p>{get(item, 'type.label')}</p>
							</div>
						</Spacer>
					</HeaderContentType>
					<HeaderButtons>
						<ButtonToolbar>
							<MetaData category={englishContentType}>
								<MetaDataItem
									label={String(bookmarkViewPlayCounts.viewCount || 0)}
									icon="eye"
								/>
								<MetaDataItem
									label={String(bookmarkViewPlayCounts.bookmarkCount || 0)}
									icon="bookmark"
								/>
							</MetaData>
							<InteractiveTour showButton />
						</ButtonToolbar>
					</HeaderButtons>
					<HeaderAvatar>
						<MetaData category={toEnglishContentType(item.type.label)}>
							{!!get(item, 'organisation.name') && (
								<MetaDataItem>
									<p className="c-body-2 u-text-muted">
										{generateSearchLink('provider', item.organisation.name)}
									</p>
								</MetaDataItem>
							)}
							{!!item.issued && (
								<MetaDataItem>
									<p className="c-body-2 u-text-muted">
										{`${t(
											'item/views/item-detail___uitgezonden-op'
										)} ${reorderDate(item.issued || null, '/')}`}
									</p>
								</MetaDataItem>
							)}
							{!!item.series && (
								<MetaDataItem>
									<p className="c-body-2 u-text-muted">
										<span>{`${t('item/views/item-detail___reeks')} `}</span>
										{generateSearchLink('serie', item.series)}
									</p>
								</MetaDataItem>
							)}
						</MetaData>
					</HeaderAvatar>
				</Header>
				<Container className="c-item-view__main" mode="vertical">
					<Container mode="horizontal">
						<ItemVideoDescription
							itemMetaData={item}
							canPlay={
								!isOpenAddToCollectionModal &&
								!isShareThroughEmailModalOpen &&
								!isReportItemModalOpen
							}
							onPlay={trackOnPlay}
							verticalLayout={isMobileWidth()}
						/>
						<Grid>
							<Column size="2-7">
								<Spacer margin="top-large">
									<Flex justify="between" wrap>
										<Spacer margin="right-small">
											<ButtonToolbar>
												<Flex justify="between" wrap>
													<Button
														type="tertiary"
														icon="scissors"
														label={t(
															'item/views/item___voeg-fragment-toe-aan-collectie'
														)}
														title={t(
															'item/views/item-detail___knip-fragment-bij-en-of-voeg-toe-aan-een-collectie'
														)}
														ariaLabel={t(
															'item/views/item-detail___knip-fragment-bij-en-of-voeg-toe-aan-een-collectie'
														)}
														onClick={() =>
															setIsOpenAddToCollectionModal(true)
														}
													/>
													{PermissionService.hasPerm(
														user,
														PermissionName.CREATE_ASSIGNMENTS
													) && (
														<Button
															type="tertiary"
															icon="clipboard"
															label={t(
																'item/views/item___maak-opdracht'
															)}
															ariaLabel={t(
																'item/views/item-detail___neem-dit-item-op-in-een-opdracht'
															)}
															title={t(
																'item/views/item-detail___neem-dit-item-op-in-een-opdracht'
															)}
															onClick={() =>
																history.push(
																	generateAssignmentCreateLink(
																		'KIJK',
																		item.external_id,
																		'ITEM'
																	)
																)
															}
														/>
													)}
												</Flex>
											</ButtonToolbar>
										</Spacer>
										<ButtonToolbar>
											<ToggleButton
												type="tertiary"
												icon="bookmark"
												active={bookmarkViewPlayCounts.isBookmarked}
												ariaLabel={t('item/views/item___toggle-bladwijzer')}
												title={t('item/views/item___toggle-bladwijzer')}
												onClick={toggleBookmark}
											/>
											<Button
												type="tertiary"
												icon="share-2"
												ariaLabel={t('item/views/item___share-item')}
												title={t('item/views/item___share-item')}
												onClick={() =>
													setIsShareThroughEmailModalOpen(true)
												}
											/>
											<Button
												type="tertiary"
												icon="flag"
												ariaLabel={t('item/views/item___rapporteer-item')}
												title={t('item/views/item___rapporteer-item')}
												onClick={() => setIsReportItemModalOpen(true)}
											/>
										</ButtonToolbar>
									</Flex>
								</Spacer>
							</Column>
							<Column size="2-5">
								<></>
							</Column>
						</Grid>
						<Grid>
							<Column size="2-7">
								<Container mode="vertical" size="small">
									<BlockHeading type="h3">
										<Trans i18nKey="item/views/item___metadata">Metadata</Trans>
									</BlockHeading>
									<Table
										horizontal
										untable
										className={classnames('c-meta-data__table', {
											'c-meta-data__table-mobile': isMobileWidth(),
										})}
									>
										<Grid tag="tbody">
											{!!item.issued && (
												<Column size="2-5" tag="tr">
													<th scope="row">
														<Trans i18nKey="item/views/item___publicatiedatum">
															Publicatiedatum
														</Trans>
													</th>
													<td>{reorderDate(item.issued, '/')}</td>
												</Column>
											)}
											{!!item.published_at && (
												<Column size="2-5" tag="tr">
													<th scope="row">
														<Trans i18nKey="item/views/item___toegevoegd-op">
															Toegevoegd op
														</Trans>
													</th>
													<td>{reorderDate(item.published_at, '/')}</td>
												</Column>
											)}
										</Grid>
										<Grid tag="tbody">
											{!!get(item, 'organisation.name') && (
												<Column size="2-5" tag="tr">
													<th scope="row">
														<Trans i18nKey="item/views/item___aanbieder">
															Aanbieder
														</Trans>
													</th>
													<td>
														{generateSearchLink(
															'provider',
															item.organisation.name
														)}
													</td>
												</Column>
											)}
											{!!item.duration && (
												<Column size="2-5" tag="tr">
													<th scope="row">
														<Trans i18nKey="item/views/item___speelduur">
															Speelduur
														</Trans>
													</th>
													<td>{item.duration}</td>
												</Column>
											)}
										</Grid>
										<Grid tag="tbody">
											{!!item.series && (
												<Column size="2-5" tag="tr">
													<th scope="row">
														<Trans i18nKey="item/views/item___reeks">
															Reeks
														</Trans>
													</th>
													<td>
														{generateSearchLink('serie', item.series)}
													</td>
												</Column>
											)}
											{!!item.lom_languages && !!item.lom_languages.length && (
												<Column size="2-5" tag="tr">
													<th scope="row">
														<Trans i18nKey="item/views/item___taal">
															Taal
														</Trans>
													</th>
													<td>
														{item.lom_languages
															.map(
																(languageCode) =>
																	LANGUAGES.nl[languageCode]
															)
															.join(', ')}
													</td>
												</Column>
											)}
										</Grid>
									</Table>
									<div className="c-hr" />
									<Table
										horizontal
										untable
										className={classnames('c-meta-data__table', {
											'c-meta-data__table-mobile': isMobileWidth(),
										})}
									>
										<tbody>
											{!!item.external_id && !!item.lom_context && (
												<tr>
													<th scope="row">
														<Trans i18nKey="item/views/item___geschikt-voor">
															Geschikt voor
														</Trans>
													</th>
													<td>
														{generateSearchLinks(
															item.external_id,
															'educationLevel',
															item.lom_context
														)}
													</td>
												</tr>
											)}
											{!!item.external_id && !!item.lom_classification && (
												<tr>
													<th scope="row">
														<Trans i18nKey="item/views/item___vakken">
															Vakken
														</Trans>
													</th>
													<td>
														{generateSearchLinks(
															item.external_id,
															'subject',
															item.lom_classification
														)}
													</td>
												</tr>
											)}
										</tbody>
									</Table>
									<div className="c-hr" />
									<Table
										horizontal
										untable
										className={classnames('c-meta-data__table', {
											'c-meta-data__table-mobile': isMobileWidth(),
										})}
									>
										<tbody>
											{!!item.lom_keywords && !!item.lom_keywords.length && (
												<tr>
													<th scope="row">
														<Trans i18nKey="item/views/item___trefwoorden">
															Trefwoorden
														</Trans>
													</th>
													<td>
														<TagList
															tags={item.lom_keywords.map(
																(keyword) => ({
																	label: keyword,
																	id: keyword,
																})
															)}
															swatches={false}
															onTagClicked={(
																tagId: string | number
															) =>
																goToSearchPage(
																	'keyword',
																	tagId as string
																)
															}
														/>
													</td>
												</tr>
											)}
											{/*<tr>*/}
											{/*<th scope="row"><Trans i18nKey="item/views/item___klascement">Klascement</Trans></th>*/}
											{/*<td>*/}
											{/*<a href={'http://www.klascement.be/link_item'}>*/}
											{/*www.klascement.be/link_item*/}
											{/*</a>*/}
											{/*</td>*/}
											{/*</tr>*/}
										</tbody>
									</Table>
								</Container>
							</Column>
							<Column size="2-5">
								<Container size="small" mode="vertical">
									<BlockHeading type="h3">
										<Trans i18nKey="item/views/item___bekijk-ook">
											Bekijk ook
										</Trans>
									</BlockHeading>
									<ul className="c-media-card-list">{renderRelatedItems()}</ul>
								</Container>
							</Column>
						</Grid>
					</Container>
				</Container>
				{!isNil(match.params.id) && isOpenAddToCollectionModal && (
					<AddToCollectionModal
						history={history}
						location={location}
						match={match}
						user={user}
						itemMetaData={item}
						externalId={match.params.id as string}
						isOpen={isOpenAddToCollectionModal}
						onClose={() => setIsOpenAddToCollectionModal(false)}
					/>
				)}
				<ShareThroughEmailModal
					modalTitle={t('item/views/item-detail___deel-dit-item')}
					type="item"
					emailLinkHref={window.location.href}
					emailLinkTitle={item.title}
					isOpen={isShareThroughEmailModalOpen}
					onClose={() => setIsShareThroughEmailModalOpen(false)}
				/>
				<ReportItemModal
					externalId={match.params.id}
					isOpen={isReportItemModalOpen}
					onClose={() => setIsReportItemModalOpen(false)}
					user={user}
				/>
			</>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						get(
							item,
							'title',
							t('item/views/item-detail___item-detail-pagina-titel-fallback')
						)
					)}
				</title>
				<meta name="description" content={get(item, 'description', '')} />
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={item}
				render={renderItem}
				notFoundError={t('item/views/item___dit-item-werd-niet-gevonden')}
			/>
		</>
	);
};

export default ItemDetail;
