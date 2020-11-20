import classnames from 'classnames';
import { get, isEmpty, isNil } from 'lodash-es';
import React, { FunctionComponent, ReactText, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import {
	BlockHeading,
	Button,
	ButtonToolbar,
	Column,
	Container,
	Grid,
	Header,
	HeaderAvatar,
	HeaderButtons,
	MediaCard,
	MediaCardMetaData,
	MediaCardThumbnail,
	MetaData,
	MetaDataItem,
	Spacer,
	Thumbnail,
	ToggleButton,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileName } from '../../authentication/helpers/get-profile-info';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { redirectToClientPage } from '../../authentication/helpers/redirects';
import RegisterOrRegisterOrLogin from '../../authentication/views/RegisterOrLogin';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import {
	InteractiveTour,
	LoadingErrorLoadedComponent,
	LoadingInfo,
	ShareThroughEmailModal,
} from '../../shared/components';
import JsonLd from '../../shared/components/JsonLd/JsonLd';
import MoreOptionsDropdown from '../../shared/components/MoreOptionsDropdown/MoreOptionsDropdown';
import { ROUTE_PARTS } from '../../shared/constants';
import {
	buildLink,
	createDropdownMenuItem,
	CustomError,
	formatDate,
	generateAssignmentCreateLink,
	generateContentLinkString,
	generateSearchLinks,
	getFullName,
	isMobileWidth,
	renderAvatar,
} from '../../shared/helpers';
import { generateRelatedItemLink } from '../../shared/helpers/handle-related-item-click';
import { isUuid } from '../../shared/helpers/uuid';
import { BookmarksViewsPlaysService, ToastService } from '../../shared/services';
import { DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS } from '../../shared/services/bookmarks-views-plays-service';
import { BookmarkViewPlayCounts } from '../../shared/services/bookmarks-views-plays-service/bookmarks-views-plays-service.types';
import { trackEvents } from '../../shared/services/event-logging-service';
import { getRelatedItems } from '../../shared/services/related-items-service';
import { CollectionService } from '../collection.service';
import { ContentTypeString, Relation, toEnglishContentType } from '../collection.types';
import { FragmentList, PublishCollectionModal } from '../components';
import AddToBundleModal from '../components/modals/AddToBundleModal';
import DeleteCollectionModal from '../components/modals/DeleteCollectionModal';

import './CollectionDetail.scss';

export const COLLECTION_COPY = 'Kopie %index%: ';
export const COLLECTION_COPY_REGEX = /^Kopie [0-9]+: /gi;

interface CollectionDetailProps extends DefaultSecureRouteProps<{ id: string }> {}

const CollectionDetail: FunctionComponent<CollectionDetailProps> = ({
	history,
	location,
	match,
	user,
}) => {
	const [t] = useTranslation();

	// State
	const [collectionId, setCollectionId] = useState(match.params.id);
	const [collection, setCollection] = useState<Avo.Collection.Collection | null>(null);
	const [publishedBundles, setPublishedBundles] = useState<Avo.Collection.Collection[]>([]);
	const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
	const [isShareThroughEmailModalOpen, setIsShareThroughEmailModalOpen] = useState(false);
	const [isAddToBundleModalOpen, setIsAddToBundleModalOpen] = useState<boolean>(false);
	const [isFirstRender, setIsFirstRender] = useState<boolean>(false);
	const [relatedCollections, setRelatedCollections] = useState<Avo.Search.ResultItem[] | null>(
		null
	);
	const [permissions, setPermissions] = useState<
		Partial<{
			canViewCollections: boolean;
			canEditCollection: boolean;
			canPublishCollection: boolean;
			canDeleteCollection: boolean;
			canCreateCollections: boolean;
			canViewItems: boolean;
		}>
	>({});
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [bookmarkViewPlayCounts, setBookmarkViewPlayCounts] = useState<BookmarkViewPlayCounts>(
		DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS
	);
	const [showLoginPopup, setShowLoginPopup] = useState<boolean | null>(null);

	const getRelatedCollections = useCallback(async () => {
		try {
			setRelatedCollections(await getRelatedItems(collectionId, 'collections', 4));
		} catch (err) {
			console.error('Failed to get related items', err, {
				collectionId,
				index: 'collections',
				limit: 4,
			});

			ToastService.danger(
				t(
					'collection/views/collection-detail___het-ophalen-van-de-gerelateerde-collecties-is-mislukt'
				)
			);
		}
	}, [setRelatedCollections, t, collectionId]);

	useEffect(() => {
		setCollectionId(match.params.id);
	}, [match.params.id]);

	useEffect(() => {
		if (!isFirstRender && collection) {
			setIsFirstRender(true);
		}
	}, [collection, isFirstRender, setIsFirstRender]);

	const checkPermissionsAndGetCollection = useCallback(async () => {
		try {
			const uuid = isUuid(collectionId)
				? collectionId
				: await CollectionService.fetchUuidByAvo1Id(collectionId);

			if (!uuid) {
				setLoadingInfo({
					state: 'error',
					message: t(
						'collection/views/collection-detail___de-collectie-kon-niet-worden-gevonden'
					),
					icon: 'alert-triangle',
				});

				return;
			}

			if (collectionId !== uuid) {
				// Redirect to new url that uses the collection uuid instead of the collection avo1 id
				// and continue loading the collection
				redirectToClientPage(
					buildLink(APP_PATH.COLLECTION_DETAIL.route, { id: uuid }),
					history
				);

				return;
			}

			const rawPermissions = await Promise.all([
				PermissionService.hasPermissions(
					{ name: PermissionName.VIEW_OWN_COLLECTIONS, obj: collectionId },
					user
				),
				PermissionService.hasPermissions(
					[
						{
							name: PermissionName.VIEW_ANY_PUBLISHED_COLLECTIONS,
						},
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{
							name: PermissionName.VIEW_ANY_UNPUBLISHED_COLLECTIONS,
						},
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{ name: PermissionName.EDIT_OWN_COLLECTIONS, obj: collectionId },
						{ name: PermissionName.EDIT_ANY_COLLECTIONS },
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{ name: PermissionName.PUBLISH_OWN_COLLECTIONS, obj: collectionId },
						{ name: PermissionName.PUBLISH_ALL_COLLECTIONS },
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{ name: PermissionName.DELETE_OWN_COLLECTIONS, obj: collectionId },
						{ name: PermissionName.DELETE_ANY_COLLECTIONS },
					],
					user
				),
				PermissionService.hasPermissions(
					[{ name: PermissionName.CREATE_COLLECTIONS }],
					user
				),
				PermissionService.hasPermissions(
					[{ name: PermissionName.VIEW_ANY_PUBLISHED_ITEMS }],
					user
				),
			]);

			const permissionObj = {
				canViewCollection: rawPermissions[0],
				canViewPublishedCollections: rawPermissions[1],
				canViewUnpublishedCollections: rawPermissions[2],
				canEditCollection: rawPermissions[3],
				canPublishCollection: rawPermissions[4],
				canDeleteCollection: rawPermissions[5],
				canCreateCollections: rawPermissions[6],
				canViewItems: rawPermissions[7],
			};

			let showPopup = false;

			if (
				!permissionObj.canViewCollection &&
				!permissionObj.canViewPublishedCollections &&
				!permissionObj.canViewUnpublishedCollections
			) {
				showPopup = true;
			}

			const collectionObj = await CollectionService.fetchCollectionOrBundleWithItemsById(
				uuid,
				'collection',
				undefined
			);

			if (!collectionObj) {
				setLoadingInfo({
					state: 'error',
					message: t(
						'collection/views/collection-detail___de-collectie-kon-niet-worden-gevonden'
					),
					icon: 'search',
				});
				return;
			}

			if (
				(!permissionObj.canViewCollection &&
					collectionObj.is_public &&
					!permissionObj.canViewPublishedCollections) ||
				(!permissionObj.canViewCollection &&
					!collectionObj.is_public &&
					!permissionObj.canViewUnpublishedCollections)
			) {
				showPopup = true;
			}

			// Do not trigger events when a search engine loads this page
			if (!showPopup) {
				trackEvents(
					{
						object: collectionId,
						object_type: 'collection',
						message: `Gebruiker ${getProfileName(
							user
						)} heeft de pagina voor collectie ${collectionId} bekeken`,
						action: 'view',
					},
					user
				);

				getRelatedCollections();

				BookmarksViewsPlaysService.action('view', 'collection', collectionObj.id, user);
				try {
					setBookmarkViewPlayCounts(
						await BookmarksViewsPlaysService.getCollectionCounts(collectionObj.id, user)
					);
				} catch (err) {
					console.error(
						new CustomError('Failed to get getCollectionCounts', err, {
							uuid: collectionObj.id,
						})
					);
					ToastService.danger(
						t(
							'collection/views/collection-detail___het-ophalen-van-het-aantal-keer-bekeken-gebookmarked-is-mislukt'
						)
					);
				}

				// Get published bundles that contain this collection
				setPublishedBundles(
					await CollectionService.getPublishedBundlesContainingCollection(
						collectionObj.id
					)
				);
			}

			setShowLoginPopup(showPopup);
			setCollectionId(uuid);
			setPermissions(permissionObj);
			setCollection(collectionObj || null);
		} catch (err) {
			console.error(
				new CustomError(
					'Failed to check permissions or get collection from the database',
					err,
					{
						collectionId,
					}
				)
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'collection/views/collection-detail___er-ging-iets-mis-tijdens-het-ophalen-van-de-collectie'
				),
				icon: 'alert-triangle',
			});
		}
		// Ensure callback only runs once even if user object is set twice // TODO investigate why user object is set twice
	}, [collectionId, getRelatedCollections, setShowLoginPopup, t, user, history]);

	useEffect(() => {
		checkPermissionsAndGetCollection();
	}, [checkPermissionsAndGetCollection]);

	useEffect(() => {
		if (!isEmpty(permissions) && collection && !isNil(showLoginPopup)) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [permissions, collection, setLoadingInfo, showLoginPopup]);

	// Listeners
	const onEditCollection = () => {
		history.push(
			`${generateContentLinkString(ContentTypeString.collection, `${collectionId}`)}/${
				ROUTE_PARTS.edit
			}`
		);
	};

	const executeAction = async (item: ReactText) => {
		setIsOptionsMenuOpen(false);
		switch (item) {
			case 'duplicate':
				try {
					if (!collection) {
						ToastService.danger(
							t(
								'collection/views/collection-detail___de-collectie-kan-niet-gekopieerd-worden-omdat-deze-nog-niet-is-opgehaald-van-de-database'
							)
						);
						return;
					}
					const duplicateCollection = await CollectionService.duplicateCollection(
						collection,
						user,
						COLLECTION_COPY,
						COLLECTION_COPY_REGEX
					);

					trackEvents(
						{
							object: collection.id,
							object_type: 'collection',
							message: `${getProfileName(user)} heeft een collectie gedupliceerd`,
							action: 'copy',
						},
						user
					);

					redirectToClientPage(
						buildLink(APP_PATH.COLLECTION_DETAIL.route, { id: duplicateCollection.id }),
						history
					);
					setCollectionId(duplicateCollection.id);
					ToastService.success(
						t(
							'collection/views/collection-detail___de-collectie-is-gekopieerd-u-kijkt-nu-naar-de-kopie'
						)
					);
				} catch (err) {
					console.error('Failed to copy collection', err, {
						originalCollection: collection,
					});
					ToastService.danger(
						t(
							'collection/views/collection-detail___het-kopieren-van-de-collectie-is-mislukt'
						)
					);
				}
				break;

			case 'addToBundle':
				setIsAddToBundleModalOpen(true);
				break;

			case 'delete':
				setIsDeleteModalOpen(true);
				break;

			case 'openShareThroughEmail':
				setIsShareThroughEmailModalOpen(true);
				break;

			case 'openPublishCollectionModal':
				setIsPublishModalOpen(!isPublishModalOpen);
				break;

			case 'toggleBookmark':
				await toggleBookmark();
				break;

			case 'createAssignment':
				createAssignment();
				break;

			case 'editCollection':
				onEditCollection();
				break;

			default:
				return null;
		}
	};

	const toggleBookmark = async () => {
		try {
			await BookmarksViewsPlaysService.toggleBookmark(
				collectionId,
				user,
				'collection',
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
					collectionId,
					user,
					type: 'collection',
					isBookmarked: bookmarkViewPlayCounts.isBookmarked,
				})
			);
			ToastService.danger(
				bookmarkViewPlayCounts.isBookmarked
					? t(
							'collection/views/collection-detail___het-verwijderen-van-de-bladwijzer-is-mislukt'
					  )
					: t(
							'collection/views/collection-detail___het-aanmaken-van-de-bladwijzer-is-mislukt'
					  )
			);
		}
	};

	const createAssignment = (): void => {
		redirectToClientPage(
			generateAssignmentCreateLink('KIJK', `${collectionId}`, 'COLLECTIE'),
			history
		);
	};

	const onDeleteCollection = async (): Promise<void> => {
		try {
			await CollectionService.deleteCollection(collectionId);

			trackEvents(
				{
					object: collectionId,
					object_type: 'collection',
					message: `${getProfileName(user)} heeft een collectie verwijderd`,
					action: 'delete',
				},
				user
			);

			history.push(APP_PATH.WORKSPACE.route);
			ToastService.success(
				t('collection/views/collection-detail___de-collectie-werd-succesvol-verwijderd')
			);
		} catch (err) {
			ToastService.danger(
				t(
					'collection/views/collection-detail___het-verwijderen-van-de-collectie-is-mislukt'
				)
			);
		}
	};

	// Render functions
	const renderRelatedContent = () => {
		return (relatedCollections || []).map((relatedItem: Avo.Search.ResultItem) => {
			const { id, dc_title, thumbnail_path = undefined, original_cp = '' } = relatedItem;
			const category = toEnglishContentType(relatedItem.administrative_type);

			return (
				<Column size="2-6" key={`related-item-${id}`}>
					<Link to={generateRelatedItemLink(relatedItem)} className="a-link__no-styles">
						<MediaCard category={category} orientation="horizontal" title={dc_title}>
							<MediaCardThumbnail>
								<Thumbnail
									category={category}
									src={thumbnail_path}
									showCategoryIcon
								/>
							</MediaCardThumbnail>
							<MediaCardMetaData>
								<MetaData category={category}>
									<MetaDataItem label={original_cp || undefined} />
								</MetaData>
							</MediaCardMetaData>
						</MediaCard>
					</Link>
				</Column>
			);
		});
	};

	const renderHeaderButtons = () => {
		const COLLECTION_DROPDOWN_ITEMS = [
			// TODO: DISABLED_FEATURE - createDropdownMenuItem("play", 'Alle items afspelen')
			...(PermissionService.hasPerm(user, PermissionName.CREATE_BUNDLES)
				? [
						createDropdownMenuItem(
							'addToBundle',
							t('collection/views/collection-detail___voeg-toe-aan-bundel'),
							'plus'
						),
				  ]
				: []),
			...(permissions.canCreateCollections
				? [
						createDropdownMenuItem(
							'duplicate',
							t('collection/views/collection-detail___dupliceer'),
							'copy'
						),
				  ]
				: []),
			...(permissions.canDeleteCollection
				? [
						createDropdownMenuItem(
							'delete',
							t('collection/views/collection-detail___verwijder')
						),
				  ]
				: []),
		];
		const isPublic = !!collection && collection.is_public;
		return (
			<ButtonToolbar>
				{PermissionService.hasPerm(user, PermissionName.CREATE_ASSIGNMENTS) && (
					<Button
						label={t('collection/views/collection-detail___maak-opdracht')}
						type="secondary"
						icon="clipboard"
						ariaLabel={t('collection/views/collection-detail___maak-opdracht')}
						title={t(
							'collection/views/collection-detail___neem-deze-collectie-op-in-een-opdracht'
						)}
						onClick={() => executeAction('createAssignment')}
					/>
				)}
				{permissions.canPublishCollection && (
					<Button
						type="secondary"
						title={
							isPublic
								? t(
										'collection/views/collection-detail___maak-deze-collectie-prive'
								  )
								: t(
										'collection/views/collection-detail___maak-deze-collectie-openbaar'
								  )
						}
						ariaLabel={
							isPublic
								? t(
										'collection/views/collection-detail___maak-deze-collectie-prive'
								  )
								: t(
										'collection/views/collection-detail___maak-deze-collectie-openbaar'
								  )
						}
						icon={isPublic ? 'unlock-3' : 'lock'}
						onClick={() => executeAction('openPublishCollectionModal')}
					/>
				)}
				<ToggleButton
					title={t('collection/views/collection-detail___bladwijzer')}
					type="secondary"
					icon="bookmark"
					active={bookmarkViewPlayCounts.isBookmarked}
					ariaLabel={t('collection/views/collection-detail___bladwijzer')}
					onClick={() => executeAction('toggleBookmark')}
				/>
				{isPublic && (
					<Button
						title={t('collection/views/collection-detail___deel')}
						type="secondary"
						icon="share-2"
						ariaLabel={t('collection/views/collection-detail___deel')}
						onClick={() => executeAction('openShareThroughEmail')}
					/>
				)}
				<MoreOptionsDropdown
					isOpen={isOptionsMenuOpen}
					onOpen={() => setIsOptionsMenuOpen(true)}
					onClose={() => setIsOptionsMenuOpen(false)}
					menuItems={COLLECTION_DROPDOWN_ITEMS}
					onOptionClicked={executeAction}
				/>
				{permissions.canEditCollection && (
					<Spacer margin="left-small">
						<Button
							type="primary"
							icon="edit"
							label={t('collection/views/collection-detail___bewerken')}
							title={t('collection/views/collection-detail___pas-deze-collectie-aan')}
							onClick={() => executeAction('editCollection')}
						/>
					</Spacer>
				)}
				<InteractiveTour showButton />
			</ButtonToolbar>
		);
	};

	const renderHeaderButtonsMobile = () => {
		const COLLECTION_DROPDOWN_ITEMS = [
			// TODO: DISABLED_FEATURE - createDropdownMenuItem("play", 'Alle items afspelen')
			...(permissions.canEditCollection
				? [
						createDropdownMenuItem(
							'editCollection',
							t('collection/views/collection-detail___bewerken'),
							'edit'
						),
				  ]
				: []),
			...(PermissionService.hasPerm(user, PermissionName.CREATE_ASSIGNMENTS)
				? [
						createDropdownMenuItem(
							'createAssignment',
							t('collection/views/collection-detail___maak-opdracht'),
							'clipboard'
						),
				  ]
				: []),
			...(permissions.canPublishCollection
				? [
						createDropdownMenuItem(
							'openPublishCollectionModal',
							t('collection/views/collection-detail___delen'),
							'plus'
						),
				  ]
				: []),
			createDropdownMenuItem(
				'toggleBookmark',
				bookmarkViewPlayCounts.isBookmarked
					? t('collection/views/collection-detail___verwijder-bladwijzer')
					: t('collection/views/collection-detail___maak-bladwijzer'),
				bookmarkViewPlayCounts.isBookmarked ? 'bookmark-filled' : 'bookmark'
			),
			...(!!collection && collection.is_public
				? [
						createDropdownMenuItem(
							'openShareThroughEmail',
							t('collection/views/collection-detail___deel'),
							'share-2'
						),
				  ]
				: []),
			...(PermissionService.hasPerm(user, PermissionName.CREATE_BUNDLES)
				? [
						createDropdownMenuItem(
							'addToBundle',
							t('collection/views/collection-detail___voeg-toe-aan-bundel'),
							'plus'
						),
				  ]
				: []),
			...(permissions.canCreateCollections
				? [
						createDropdownMenuItem(
							'duplicate',
							t('collection/views/collection-detail___dupliceer'),
							'copy'
						),
				  ]
				: []),
			...(permissions.canDeleteCollection
				? [
						createDropdownMenuItem(
							'delete',
							t('collection/views/collection-detail___verwijder')
						),
				  ]
				: []),
		];
		return (
			<ButtonToolbar>
				<MoreOptionsDropdown
					isOpen={isOptionsMenuOpen}
					onOpen={() => setIsOptionsMenuOpen(true)}
					onClose={() => setIsOptionsMenuOpen(false)}
					menuItems={COLLECTION_DROPDOWN_ITEMS}
					onOptionClicked={executeAction}
				/>
			</ButtonToolbar>
		);
	};

	const renderCollection = () => {
		const {
			id,
			profile,
			collection_fragments,
			lom_context,
			created_at,
			updated_at,
			title,
			lom_classification,
		} = collection as Avo.Collection.Collection;
		const hasCopies = (get(collection, 'relations') || []).length > 0;
		const hasParentBundles = !!publishedBundles.length;

		return (
			<>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							get(
								collection,
								'title',
								t(
									'collection/views/collection-detail___collectie-detail-titel-fallback'
								)
							)
						)}
					</title>
					<meta name="description" content={get(collection, 'description') || ''} />
				</MetaTags>
				<JsonLd
					url={window.location.href}
					title={get(collection, 'title', '')}
					description={get(collection, 'description')}
					image={get(collection, 'thumbnail_path')}
					isOrganisation={!!get(collection, 'profile.organisation')}
					author={getFullName(get(collection, 'profile'), true, false)}
					publishedAt={get(collection, 'published_at')}
					updatedAt={get(collection, 'updated_at')}
					keywords={[
						...(get(collection, 'lom_classification') || []),
						...(get(collection, 'lom_context') || []),
					]}
				/>
				<div
					className={classnames(
						'm-collection-detail',
						showLoginPopup ? 'hide-behind-login-popup' : ''
					)}
				>
					<Header
						title={title}
						category="collection"
						showMetaData
						bookmarks={String(bookmarkViewPlayCounts.bookmarkCount || 0)}
						views={String(bookmarkViewPlayCounts.viewCount || 0)}
					>
						{!showLoginPopup && (
							<HeaderButtons>
								{isMobileWidth()
									? renderHeaderButtonsMobile()
									: renderHeaderButtons()}
							</HeaderButtons>
						)}
						<HeaderAvatar>
							{profile && renderAvatar(profile, { dark: true })}
						</HeaderAvatar>
					</Header>
					<Container mode="vertical">
						<Container mode="horizontal">
							{!!collection && (
								<FragmentList
									collectionFragments={collection_fragments}
									showDescription
									linkToItems={permissions.canViewItems || false}
									canPlay={
										!isAddToBundleModalOpen &&
										!isDeleteModalOpen &&
										!isPublishModalOpen &&
										!isShareThroughEmailModalOpen
									}
									history={history}
									location={location}
									match={match}
									user={user}
									collection={collection}
								/>
							)}
						</Container>
					</Container>
					<Container mode="vertical">
						<Container mode="horizontal">
							<h3 className="c-h3">
								<Trans i18nKey="collection/views/collection-detail___info-over-deze-collectie">
									Info over deze collectie
								</Trans>
							</h3>
							<Grid>
								<Column size="3-3">
									<Spacer margin="top-large">
										<p className="u-text-bold">
											<Trans i18nKey="collection/views/collection-detail___onderwijsniveau">
												Onderwijsniveau
											</Trans>
										</p>
										<p className="c-body-1">
											{lom_context && lom_context.length ? (
												generateSearchLinks(
													id,
													'educationLevel',
													lom_context
												)
											) : (
												<span className="u-d-block">-</span>
											)}
										</p>
									</Spacer>
									<Spacer margin="top-large">
										<p className="u-text-bold">
											<Trans i18nKey="collection/views/collection-detail___vakken">
												Vakken
											</Trans>
										</p>
										<p className="c-body-1">
											{lom_classification && lom_classification.length ? (
												generateSearchLinks(
													id,
													'subject',
													lom_classification
												)
											) : (
												<span className="u-d-block">-</span>
											)}
										</p>
									</Spacer>
								</Column>
								<Column size="3-3">
									<Spacer margin="top-large">
										<p className="u-text-bold">
											{t(
												'collection/views/collection-detail___aangemaakt-op'
											)}
										</p>
										<p className="c-body-1">{formatDate(created_at)}</p>
									</Spacer>
									<Spacer margin="top-large">
										<p className="u-text-bold">
											{t(
												'collection/views/collection-detail___laatst-aangepast'
											)}
										</p>
										<p className="c-body-1">{formatDate(updated_at)}</p>
									</Spacer>
								</Column>
								{(hasCopies || hasParentBundles) && (
									<Column size="3-6">
										<Spacer margin="top-large">
											<p className="u-text-bold">
												<Trans i18nKey="collection/views/collection-detail___ordering">
													Ordering
												</Trans>
											</p>
											{hasCopies && (
												<p className="c-body-1">
													{`${t(
														'collection/views/collection-detail___deze-collectie-is-een-kopie-van'
													)} `}
													{(get(
														collection,
														'relations',
														[]
													) as Relation[]).map((relation: Relation) => (
														<Link
															key={`copy-of-link-${relation.object_meta.id}`}
															to={buildLink(
																APP_PATH.COLLECTION_DETAIL.route,
																{ id: relation.object_meta.id }
															)}
														>
															{relation.object_meta.title}
														</Link>
													))}
												</p>
											)}
											{hasParentBundles && (
												<p className="c-body-1">
													{`${t(
														'collection/views/collection-detail___deze-collectie-is-deel-van-een-map'
													)} `}
													{publishedBundles.map((bundle, index) => (
														<>
															{index !== 0 &&
																!!publishedBundles.length &&
																', '}
															<Link
																to={buildLink(
																	APP_PATH.BUNDLE_DETAIL.route,
																	{
																		id: bundle.id,
																	}
																)}
															>
																{bundle.title}
															</Link>
														</>
													))}
												</p>
											)}
										</Spacer>
									</Column>
								)}
							</Grid>
							{!!relatedCollections && !!relatedCollections.length && (
								<>
									<hr className="c-hr" />
									<BlockHeading type="h3">
										<Trans i18nKey="collection/views/collection-detail___bekijk-ook">
											Bekijk ook
										</Trans>
									</BlockHeading>
									<Grid className="c-media-card-list">
										{renderRelatedContent()}
									</Grid>
								</>
							)}
						</Container>
					</Container>
				</div>
				{!showLoginPopup && (
					<>
						{!!collection && (
							<PublishCollectionModal
								collection={collection}
								isOpen={isPublishModalOpen}
								onClose={(newCollection: Avo.Collection.Collection | undefined) => {
									setIsPublishModalOpen(false);

									if (newCollection) {
										setCollection(newCollection);
									}
								}}
								history={history}
								location={location}
								match={match}
								user={user}
							/>
						)}
						{collectionId !== undefined && (
							<AddToBundleModal
								history={history}
								location={location}
								match={match}
								user={user}
								collection={collection as Avo.Collection.Collection}
								collectionId={collectionId as string}
								isOpen={isAddToBundleModalOpen}
								onClose={() => setIsAddToBundleModalOpen(false)}
							/>
						)}
						<DeleteCollectionModal
							collectionId={(collection as Avo.Collection.Collection).id}
							isOpen={isDeleteModalOpen}
							onClose={() => setIsDeleteModalOpen(false)}
							deleteObjectCallback={onDeleteCollection}
						/>
						<ShareThroughEmailModal
							modalTitle={t(
								'collection/views/collection-detail___deel-deze-collectie'
							)}
							type="collection"
							emailLinkHref={window.location.href}
							emailLinkTitle={(collection as Avo.Collection.Collection).title}
							isOpen={isShareThroughEmailModalOpen}
							onClose={() => setIsShareThroughEmailModalOpen(false)}
						/>
					</>
				)}
				{showLoginPopup && <RegisterOrRegisterOrLogin />}
			</>
		);
	};

	return (
		<>
			<LoadingErrorLoadedComponent
				render={renderCollection}
				dataObject={permissions}
				loadingInfo={loadingInfo}
			/>
		</>
	);
};

export default withRouter(CollectionDetail);
