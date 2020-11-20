import classnames from 'classnames';
import { get, isEmpty, isNil } from 'lodash-es';
import React, { FunctionComponent, ReactText, useEffect, useState } from 'react';
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
	Flex,
	FlexItem,
	Grid,
	HeaderContentType,
	MediaCard,
	MediaCardMetaData,
	MediaCardThumbnail,
	MetaData,
	MetaDataItem,
	Spacer,
	Thumbnail,
	ToggleButton,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { getProfileName } from '../../authentication/helpers/get-profile-info';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { redirectToClientPage } from '../../authentication/helpers/redirects';
import RegisterOrRegisterOrLogin from '../../authentication/views/RegisterOrLogin';
import { CollectionService } from '../../collection/collection.service';
import { toEnglishContentType } from '../../collection/collection.types';
import { PublishCollectionModal } from '../../collection/components';
import { COLLECTION_COPY, COLLECTION_COPY_REGEX } from '../../collection/views/CollectionDetail';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import {
	DeleteObjectModal,
	InteractiveTour,
	LoadingErrorLoadedComponent,
	LoadingInfo,
	ShareThroughEmailModal,
} from '../../shared/components';
import Html from '../../shared/components/Html/Html';
import JsonLd from '../../shared/components/JsonLd/JsonLd';
import MoreOptionsDropdown from '../../shared/components/MoreOptionsDropdown/MoreOptionsDropdown';
import {
	buildLink,
	createDropdownMenuItem,
	CustomError,
	formatDate,
	fromNow,
	generateSearchLinks,
	getFullName,
	isMobileWidth,
	renderAvatar,
} from '../../shared/helpers';
import { generateRelatedItemLink } from '../../shared/helpers/handle-related-item-click';
import { BookmarksViewsPlaysService, ToastService } from '../../shared/services';
import { DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS } from '../../shared/services/bookmarks-views-plays-service';
import { BookmarkViewPlayCounts } from '../../shared/services/bookmarks-views-plays-service/bookmarks-views-plays-service.types';
import { trackEvents } from '../../shared/services/event-logging-service';
import { getRelatedItems } from '../../shared/services/related-items-service';

import './BundleDetail.scss';

interface BundleDetailProps extends DefaultSecureRouteProps<{ id: string }> {}

const BundleDetail: FunctionComponent<BundleDetailProps> = ({ history, location, match, user }) => {
	const [t] = useTranslation();

	// State
	const [bundleId, setBundleId] = useState(match.params.id);
	const [bundle, setBundle] = useState<Avo.Collection.Collection | null>(null);
	const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
	const [isShareThroughEmailModalOpen, setIsShareThroughEmailModalOpen] = useState(false);
	const [isFirstRender, setIsFirstRender] = useState<boolean>(false);
	const [relatedItems, setRelatedBundles] = useState<Avo.Search.ResultItem[] | null>(null);
	const [permissions, setPermissions] = useState<
		Partial<{
			canViewBundle: boolean;
			canViewPublishedBundles: boolean;
			canViewUnpublishedBundles: boolean;
			canEditBundle: boolean;
			canPublishBundle: boolean;
			canDeleteBundle: boolean;
			canCreateBundles: boolean;
			canViewItems: boolean;
		}>
	>({});
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [viewCountsById, setViewCountsById] = useState<{ [id: string]: number }>({});
	const [bookmarkViewPlayCounts, setBookmarkViewPlayCounts] = useState<BookmarkViewPlayCounts>(
		DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS
	);
	const [showLoginPopup, setShowLoginPopup] = useState<boolean | null>(null);

	useEffect(() => {
		const checkPermissionsAndGetBundle = async () => {
			const rawPermissions = await Promise.all([
				PermissionService.hasPermissions(
					[{ name: PermissionName.VIEW_OWN_BUNDLES, obj: bundleId }],
					user
				),
				PermissionService.hasPermissions(
					[
						{
							name: PermissionName.VIEW_ANY_PUBLISHED_BUNDLES,
						},
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{
							name: PermissionName.VIEW_ANY_UNPUBLISHED_BUNDLES,
						},
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{ name: PermissionName.EDIT_OWN_BUNDLES, obj: bundleId },
						{ name: PermissionName.EDIT_ANY_BUNDLES },
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{ name: PermissionName.PUBLISH_OWN_BUNDLES, obj: bundleId },
						{ name: PermissionName.PUBLISH_ALL_BUNDLES },
					],
					user
				),
				PermissionService.hasPermissions(
					[
						{ name: PermissionName.DELETE_OWN_BUNDLES, obj: bundleId },
						{ name: PermissionName.DELETE_ANY_BUNDLES },
					],
					user
				),
				PermissionService.hasPermissions([{ name: PermissionName.CREATE_BUNDLES }], user),
				PermissionService.hasPermissions(
					[{ name: PermissionName.VIEW_ANY_PUBLISHED_ITEMS }],
					user
				),
			]);
			const permissionObj = {
				canViewBundle: rawPermissions[0],
				canViewPublishedBundles: rawPermissions[1],
				canViewUnpublishedBundles: rawPermissions[2],
				canEditBundle: rawPermissions[3],
				canPublishBundle: rawPermissions[4],
				canDeleteBundle: rawPermissions[5],
				canCreateBundles: rawPermissions[6],
				canViewItems: rawPermissions[7],
			};

			let showPopup = false;
			if (
				!permissionObj.canViewBundle &&
				!permissionObj.canViewPublishedBundles &&
				!permissionObj.canViewUnpublishedBundles
			) {
				showPopup = true;
			}

			const bundleObj = await CollectionService.fetchCollectionOrBundleWithItemsById(
				bundleId,
				'bundle',
				undefined
			);

			if (!bundleObj) {
				setLoadingInfo({
					state: 'error',
					message: t('bundle/views/bundle-detail___de-bundel-kon-niet-worden-gevonden'),
					icon: 'search',
				});
				return;
			}

			if (
				(!permissionObj.canViewBundle &&
					bundleObj.is_public &&
					!permissionObj.canViewPublishedBundles) ||
				(!permissionObj.canViewBundle &&
					!bundleObj.is_public &&
					!permissionObj.canViewUnpublishedBundles)
			) {
				showPopup = true;
			}

			// Do not trigger events when a search engine loads this page
			if (!showPopup) {
				trackEvents(
					{
						object: bundleId,
						object_type: 'bundle',
						message: `Gebruiker ${getProfileName(
							user
						)} heeft de pagina voor collectie ${bundleId} bekeken`,
						action: 'view',
					},
					user
				);

				BookmarksViewsPlaysService.action('view', 'bundle', bundleObj.id, user);

				// Get view counts for each fragment
				try {
					setViewCountsById(
						await BookmarksViewsPlaysService.getMultipleViewCounts(
							bundleObj.collection_fragments.map((fragment) => fragment.external_id),
							'collection'
						)
					);
				} catch (err) {
					console.error(
						new CustomError('Failed to get counts for bundle fragments', err, {})
					);
				}

				try {
					setBookmarkViewPlayCounts(
						await BookmarksViewsPlaysService.getCollectionCounts(bundleId, user)
					);
				} catch (err) {
					console.error(
						new CustomError('Failed to get getCollectionCounts for bundle', err, {
							uuid: bundleId,
						})
					);
					ToastService.danger(
						t(
							'bundle/views/bundle-detail___het-ophalen-van-het-aantal-keer-bekeken-gebookmarked-is-mislukt'
						)
					);
				}

				getRelatedItems(bundleId, 'bundles', 4)
					.then((relatedItems) => {
						setRelatedBundles(relatedItems);
					})
					.catch((err) => {
						console.error('Failed to get related items', err, {
							bundleId,
							type: 'bundles',
							limit: 4,
						});
						ToastService.danger(
							t(
								'bundle/views/bundle-detail___het-ophalen-van-de-gerelateerde-bundels-is-mislukt'
							)
						);
					});
			}

			setShowLoginPopup(showPopup);
			setPermissions(permissionObj);
			setBundle(bundleObj || null);
		};

		checkPermissionsAndGetBundle().catch((err) => {
			console.error(
				new CustomError(
					'Failed to check permissions or get bundle from the database',
					err,
					{
						bundleId,
					}
				)
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'bundle/views/bundle-detail___er-ging-iets-mis-tijdens-het-ophalen-van-de-bundel'
				),
				icon: 'alert-triangle',
			});
		});
	}, [user, bundleId, setLoadingInfo, setShowLoginPopup, t]);

	useEffect(() => {
		if (!isEmpty(permissions) && bundle && !isNil(showLoginPopup)) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [permissions, bundle, setLoadingInfo, showLoginPopup]);

	// Listeners
	const onEditBundle = () => {
		redirectToClientPage(buildLink(APP_PATH.BUNDLE_EDIT.route, { id: bundleId }), history);
	};

	const onDeleteBundle = async () => {
		try {
			await CollectionService.deleteCollection(bundleId);

			trackEvents(
				{
					object: bundleId,
					object_type: 'collection',
					message: `${getProfileName(user)} heeft een bundel verwijderd`,
					action: 'delete',
				},
				user
			);

			history.push(APP_PATH.WORKSPACE.route);
			ToastService.success(
				t('bundle/views/bundle-detail___de-bundel-werd-succesvol-verwijderd')
			);
		} catch (err) {
			console.error(err);
			ToastService.danger(
				t('bundle/views/bundle-detail___het-verwijderen-van-de-bundel-is-mislukt')
			);
		}
	};

	const onDuplicateBundle = async () => {
		try {
			if (!bundle) {
				ToastService.danger(
					t(
						'bundle/views/bundle-detail___de-bundel-kan-niet-gekopieerd-worden-omdat-deze-nog-niet-is-opgehaald-van-de-database'
					)
				);
				return;
			}
			const duplicateBundle = await CollectionService.duplicateCollection(
				bundle,
				user,
				COLLECTION_COPY,
				COLLECTION_COPY_REGEX
			);

			trackEvents(
				{
					object: String(bundle.id),
					object_type: 'bundle',
					message: `Gebruiker ${getProfileName(user)} heeft een bundel geducpliceerd`,
					action: 'copy',
				},
				user
			);

			redirectToClientPage(
				buildLink(APP_PATH.BUNDLE_DETAIL.route, { id: duplicateBundle.id }),
				history
			);
			setBundleId(duplicateBundle.id);
			ToastService.success(
				t('bundle/views/bundle-detail___de-bundel-is-gekopieerd-u-kijkt-nu-naar-de-kopie')
			);
		} catch (err) {
			console.error('Failed to copy bundle', err, { originalBundle: bundle });
			ToastService.danger(
				t('bundle/views/bundle-detail___het-kopieren-van-de-bundel-is-mislukt')
			);
		}
	};

	const executeAction = async (item: ReactText) => {
		setIsOptionsMenuOpen(false);

		switch (item) {
			case 'delete':
				setIsDeleteModalOpen(true);
				break;

			case 'duplicate':
				await onDuplicateBundle();
				break;

			case 'openPublishModal':
				setIsPublishModalOpen(true);
				break;

			case 'edit':
				onEditBundle();
				break;

			case 'toggleBookmark':
				await toggleBookmark();
				break;

			case 'openShareThroughEmailModal':
				setIsShareThroughEmailModalOpen(true);
				break;

			default:
				return null;
		}
	};

	const toggleBookmark = async () => {
		try {
			await BookmarksViewsPlaysService.toggleBookmark(
				bundleId,
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
					? t('bundle/views/bundle-detail___de-beladwijzer-is-verwijderd')
					: t('bundle/views/bundle-detail___de-bladwijzer-is-aangemaakt')
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to toggle bookmark', err, {
					bundleId,
					user,
					type: 'bundle',
					isBookmarked: bookmarkViewPlayCounts.isBookmarked,
				})
			);
			ToastService.danger(
				bookmarkViewPlayCounts.isBookmarked
					? t('bundle/views/bundle-detail___het-verwijderen-van-de-bladwijzer-is-mislukt')
					: t('bundle/views/bundle-detail___het-aanmaken-van-de-bladwijzer-is-mislukt')
			);
		}
	};

	// Render functions
	const renderRelatedContent = () => {
		return (relatedItems || []).map((relatedItem: Avo.Search.ResultItem) => {
			const contentType = toEnglishContentType(relatedItem.administrative_type);
			return (
				<Column size="2-6" key={`related-bundle-${relatedItem.id}`}>
					<Link to={generateRelatedItemLink(relatedItem)} className="a-link__no-styles">
						<MediaCard
							className="u-clickable"
							category={contentType}
							orientation="horizontal"
							title={relatedItem.dc_title}
						>
							<MediaCardThumbnail>
								<Thumbnail
									category={contentType}
									src={relatedItem.thumbnail_path}
									showCategoryIcon
								/>
							</MediaCardThumbnail>
							<MediaCardMetaData>
								<MetaData category={contentType}>
									<MetaDataItem
										label={String(relatedItem.views_count || 0)}
										icon="eye"
									/>
									<MetaDataItem label={fromNow(relatedItem.dcterms_issued)} />
								</MetaData>
							</MediaCardMetaData>
						</MediaCard>
					</Link>
				</Column>
			);
		});
	};

	function renderCollectionFragments() {
		if (!bundle) {
			return null;
		}
		return (bundle.collection_fragments || []).map((fragment: Avo.Collection.Fragment) => {
			const collection = fragment.item_meta as Avo.Collection.Collection;
			if (!collection) {
				return null;
			}
			return (
				<Column size="3-4" key={`bundle-fragment-${fragment.id}`}>
					<Link
						to={buildLink(APP_PATH.COLLECTION_DETAIL.route, { id: collection.id })}
						className="a-link__no-styles"
					>
						<MediaCard
							className="u-clickable"
							category="bundle"
							orientation="vertical"
							title={
								fragment.use_custom_fields
									? fragment.custom_title || ''
									: collection.title
							}
						>
							<MediaCardThumbnail>
								<Thumbnail
									category="collection"
									src={collection.thumbnail_path || undefined}
									meta={`${get(
										collection,
										'collection_fragments_aggregate.aggregate.count',
										0
									)} items`}
									label="collectie"
								/>
							</MediaCardThumbnail>
							<MediaCardMetaData>
								<MetaData category="collection">
									<MetaDataItem
										label={String(viewCountsById[fragment.external_id] || 0)}
										icon="eye"
									/>
									<MetaDataItem label={formatDate(collection.updated_at)} />
								</MetaData>
							</MediaCardMetaData>
						</MediaCard>
					</Link>
				</Column>
			);
		});
	}

	const renderActionDropdown = () => {
		const BUNDLE_DROPDOWN_ITEMS = [
			...(permissions.canCreateBundles
				? [
						createDropdownMenuItem(
							'duplicate',
							t('bundle/views/bundle-detail___dupliceer'),
							'copy'
						),
				  ]
				: []),
			...(permissions.canDeleteBundle
				? [createDropdownMenuItem('delete', t('bundle/views/bundle-detail___verwijder'))]
				: []),
		];

		return (
			<MoreOptionsDropdown
				isOpen={isOptionsMenuOpen}
				onOpen={() => setIsOptionsMenuOpen(true)}
				onClose={() => setIsOptionsMenuOpen(false)}
				menuItems={BUNDLE_DROPDOWN_ITEMS}
				onOptionClicked={executeAction}
			/>
		);
	};

	const renderActions = () => {
		if (isMobileWidth()) {
			const BUNDLE_DROPDOWN_ITEMS = [
				...(permissions.canEditBundle
					? [
							createDropdownMenuItem(
								'edit',
								t('bundle/views/bundle-detail___bewerken'),
								'edit'
							),
					  ]
					: []),
				...(permissions.canPublishBundle
					? [
							createDropdownMenuItem(
								'openPublishModal',
								t('bundle/views/bundle-detail___delen'),
								'lock'
							),
					  ]
					: []),
				createDropdownMenuItem(
					'toggleBookmark',
					bookmarkViewPlayCounts.isBookmarked
						? t('bundle/views/bundle-detail___verwijder-bladwijzer')
						: t('bundle/views/bundle-detail___maak-bladwijzer'),
					bookmarkViewPlayCounts.isBookmarked ? 'bookmark-filled' : 'bookmark'
				),
				...(!!bundle && bundle.is_public
					? [
							createDropdownMenuItem(
								'openShareThroughEmailModal',
								t('bundle/views/bundle-detail___share-bundel'),
								'share-2'
							),
					  ]
					: []),
				...(permissions.canCreateBundles
					? [
							createDropdownMenuItem(
								'duplicate',
								t('bundle/views/bundle-detail___dupliceer'),
								'copy'
							),
					  ]
					: []),
				...(permissions.canDeleteBundle
					? [
							createDropdownMenuItem(
								'delete',
								t('bundle/views/bundle-detail___verwijder')
							),
					  ]
					: []),
			];
			return (
				<MoreOptionsDropdown
					isOpen={isOptionsMenuOpen}
					onOpen={() => setIsOptionsMenuOpen(true)}
					onClose={() => setIsOptionsMenuOpen(false)}
					menuItems={BUNDLE_DROPDOWN_ITEMS}
					onOptionClicked={executeAction}
				/>
			);
		}
		const isPublic = bundle && bundle.is_public;
		return (
			<ButtonToolbar>
				{permissions.canPublishBundle && (
					<Button
						title={
							isPublic
								? t('bundle/views/bundle-detail___maak-deze-bundel-prive')
								: t('bundle/views/bundle-detail___maak-deze-bundel-openbaar')
						}
						ariaLabel={
							isPublic
								? t('bundle/views/bundle-detail___maak-deze-bundel-prive')
								: t('bundle/views/bundle-detail___maak-deze-bundel-openbaar')
						}
						icon={isPublic ? 'unlock-3' : 'lock'}
						onClick={() => executeAction('openPublishModal')}
						type="secondary"
					/>
				)}
				{permissions.canEditBundle && (
					<Button
						label={t('bundle/views/bundle-detail___bewerken')}
						title={t('bundle/views/bundle-detail___pas-de-bundel-aan')}
						onClick={() => executeAction('edit')}
						type="primary"
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
						title={t('bundle/views/bundle-detail___share-bundel')}
						type="secondary"
						icon="share-2"
						ariaLabel={t('bundle/views/bundle-detail___share-bundel')}
						onClick={() => executeAction('openShareThroughEmailModal')}
					/>
				)}
				{renderActionDropdown()}
				<InteractiveTour showButton />
			</ButtonToolbar>
		);
	};

	const renderMetaDataAndRelated = () => {
		if (!bundle) {
			return null;
		}
		const {
			id,
			lom_context,
			created_at,
			updated_at,
			lom_classification,
		} = bundle as Avo.Collection.Collection;
		return (
			<Container mode="vertical">
				<Container mode="horizontal">
					<BlockHeading type="h3">
						{t('bundle/views/bundle-detail___over-deze-bundel')}
					</BlockHeading>
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
										generateSearchLinks(id, 'educationLevel', lom_context)
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
										generateSearchLinks(id, 'subject', lom_classification)
									) : (
										<span className="u-d-block">-</span>
									)}
								</p>
							</Spacer>
						</Column>
						<Column size="3-3">
							<Spacer margin="top-large">
								<p className="u-text-bold">
									{t('bundle/views/bundle-detail___aangemaakt-op')}
								</p>
								<p className="c-body-1">{formatDate(created_at)}</p>
							</Spacer>
							<Spacer margin="top-large">
								<p className="u-text-bold">
									{t('collection/views/collection-detail___laatst-aangepast')}
								</p>
								<p className="c-body-1">{formatDate(updated_at)}</p>
							</Spacer>
						</Column>
					</Grid>
					<hr className="c-hr" />
					{!!relatedItems && !!relatedItems.length && (
						<>
							<BlockHeading type="h3">
								<Trans i18nKey="bundle/views/bundle-detail___bekijk-ook">
									Bekijk ook
								</Trans>
							</BlockHeading>
							<div className="c-media-card-list">
								<Grid>{renderRelatedContent()}</Grid>
							</div>
						</>
					)}
				</Container>
			</Container>
		);
	};

	const renderBundle = () => {
		const {
			is_public,
			thumbnail_path,
			title,
			description_long,
		} = bundle as Avo.Collection.Collection;

		if (!isFirstRender) {
			setIsFirstRender(true);
		}

		return (
			<>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							get(
								bundle,
								'title',
								t('bundle/views/bundle-detail___bundel-detail-titel-fallback')
							)
						)}
					</title>
					<meta name="description" content={get(bundle, 'description') || ''} />
				</MetaTags>
				<JsonLd
					url={window.location.href}
					title={get(bundle, 'title')}
					description={get(bundle, 'description')}
					image={get(bundle, 'thumbnail_path')}
					isOrganisation={!!get(bundle, 'profile.organisation')}
					author={getFullName(get(bundle, 'profile'), true, false)}
					publishedAt={get(bundle, 'published_at')}
					updatedAt={get(bundle, 'updated_at')}
					keywords={[
						...(get(bundle, 'lom_classification') || []),
						...(get(bundle, 'lom_context') || []),
					]}
				/>
				<div
					className={classnames(
						'm-bundle-detail',
						showLoginPopup ? 'hide-behind-login-popup' : ''
					)}
				>
					<Container mode="vertical" background="alt" className="m-bundle-detail-header">
						<Container mode="horizontal">
							<Grid>
								<Column size="3-2">
									<Spacer margin={isMobileWidth() ? [] : ['right-large']}>
										<Thumbnail
											category="bundle"
											src={thumbnail_path || undefined}
										/>
									</Spacer>
								</Column>
								<Column size="3-10">
									<Toolbar
										autoHeight
										className={
											isMobileWidth() ? 'c-bundle-toolbar__mobile' : ''
										}
									>
										<ToolbarLeft>
											<ToolbarItem>
												<MetaData spaced={true} category="bundle">
													<MetaDataItem>
														<HeaderContentType
															category="bundle"
															label={
																is_public
																	? t(
																			'bundle/views/bundle-detail___openbare-bundel'
																	  )
																	: t(
																			'bundle/views/bundle-detail___prive-bundel'
																	  )
															}
														/>
													</MetaDataItem>
													<MetaDataItem
														icon="eye"
														label={String(
															bookmarkViewPlayCounts.viewCount || 0
														)}
													/>
													<MetaDataItem
														icon="bookmark"
														label={String(
															bookmarkViewPlayCounts.bookmarkCount ||
																0
														)}
													/>
												</MetaData>
												<Spacer margin="top-small">
													<BlockHeading type="h1">{title}</BlockHeading>
												</Spacer>
											</ToolbarItem>
										</ToolbarLeft>
										{!showLoginPopup && (
											<ToolbarRight>
												<ToolbarItem>{renderActions()}</ToolbarItem>
											</ToolbarRight>
										)}
									</Toolbar>
									<Html
										className="c-body-1 c-content"
										content={description_long || ''}
									/>
									<Flex spaced="regular" wrap>
										<FlexItem className="c-avatar-and-text">
											{!!bundle &&
												!!bundle.profile &&
												renderAvatar(bundle.profile, { dark: true })}
										</FlexItem>
									</Flex>
								</Column>
							</Grid>
						</Container>
						<Container mode="vertical">
							<Container mode="horizontal">
								<div className="c-media-card-list">
									<Grid>{renderCollectionFragments()}</Grid>
								</div>
							</Container>
						</Container>
						{renderMetaDataAndRelated()}
						{!!bundle && (
							<PublishCollectionModal
								collection={bundle}
								isOpen={isPublishModalOpen}
								onClose={(newBundle: Avo.Collection.Collection | undefined) => {
									setIsPublishModalOpen(false);
									if (newBundle) {
										setBundle(newBundle);
									}
								}}
								history={history}
								location={location}
								match={match}
								user={user}
							/>
						)}
					</Container>
				</div>
				{!showLoginPopup && (
					<>
						<DeleteObjectModal
							title={t(
								'bundle/views/bundle-detail___ben-je-zeker-dat-je-deze-bundel-wil-verwijderen'
							)}
							body={t(
								'bundle/views/bundle-detail___deze-actie-kan-niet-ongedaan-gemaakt-worden'
							)}
							isOpen={isDeleteModalOpen}
							onClose={() => setIsDeleteModalOpen(false)}
							deleteObjectCallback={onDeleteBundle}
						/>
						<ShareThroughEmailModal
							modalTitle={t('bundle/views/bundle-detail___deel-deze-bundel')}
							type="bundle"
							emailLinkHref={window.location.href}
							emailLinkTitle={(bundle as Avo.Collection.Collection).title}
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
				render={renderBundle}
				dataObject={permissions}
				loadingInfo={loadingInfo}
				showSpinner={true}
			/>
		</>
	);
};

export default withRouter(BundleDetail);
