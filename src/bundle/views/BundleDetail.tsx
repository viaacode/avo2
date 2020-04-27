import { get, isEmpty } from 'lodash-es';
import React, { FunctionComponent, ReactText, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { withRouter } from 'react-router';

import {
	Avatar,
	BlockHeading,
	Button,
	ButtonToolbar,
	Column,
	Container,
	DropdownButton,
	DropdownContent,
	Flex,
	FlexItem,
	Grid,
	MediaCard,
	MediaCardMetaData,
	MediaCardThumbnail,
	MenuContent,
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
import { CollectionService } from '../../collection/collection.service';
import { toEnglishContentType } from '../../collection/collection.types';
import { ShareCollectionModal } from '../../collection/components';
import { COLLECTION_COPY, COLLECTION_COPY_REGEX } from '../../collection/views/CollectionDetail';
import { APP_PATH } from '../../constants';
import {
	ControlledDropdown,
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
	ShareThroughEmailModal,
} from '../../shared/components';
import InteractiveTour from '../../shared/components/InteractiveTour/InteractiveTour';
import {
	buildLink,
	createDropdownMenuItem,
	CustomError,
	formatDate,
	fromNow,
	generateContentLinkString,
	generateSearchLinks,
	isMobileWidth,
} from '../../shared/helpers';
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
	const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
	const [isShareThroughEmailModalOpen, setIsShareThroughEmailModalOpen] = useState(false);
	const [isFirstRender, setIsFirstRender] = useState<boolean>(false);
	const [isPublic, setIsPublic] = useState<boolean | null>(null);
	const [relatedItems, setRelatedBundles] = useState<Avo.Search.ResultItem[] | null>(null);
	const [permissions, setPermissions] = useState<
		Partial<{
			canViewBundles: boolean;
			canEditBundles: boolean;
			canDeleteBundles: boolean;
			canCreateBundles: boolean;
			canViewItems: boolean;
		}>
	>({});
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [viewCountsById, setViewCountsById] = useState<{ [id: string]: number }>({});
	const [bookmarkViewPlayCounts, setBookmarkViewPlayCounts] = useState<BookmarkViewPlayCounts>(
		DEFAULT_BOOKMARK_VIEW_PLAY_COUNTS
	);

	useEffect(() => {
		trackEvents(
			{
				object: bundleId,
				object_type: 'bundels',
				message: `Gebruiker ${getProfileName(
					user
				)} heeft de pagina voor collectie ${bundleId} bekeken`,
				action: 'view',
			},
			user
		);
	}, [bundleId, relatedItems, t, user]);

	useEffect(() => {
		const checkPermissionsAndGetBundle = async () => {
			const rawPermissions = await Promise.all([
				PermissionService.hasPermissions([{ name: PermissionName.VIEW_BUNDLES }], user),
				PermissionService.hasPermissions(
					[
						{ name: PermissionName.EDIT_OWN_BUNDLES, obj: bundleId },
						{ name: PermissionName.EDIT_ANY_BUNDLES },
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
				PermissionService.hasPermissions([{ name: PermissionName.VIEW_ITEMS }], user),
			]);
			const permissionObj = {
				canViewBundles: rawPermissions[0],
				canEditBundles: rawPermissions[1],
				canDeleteBundles: rawPermissions[2],
				canCreateBundles: rawPermissions[3],
				canViewItems: rawPermissions[4],
			};
			const bundleObj = await CollectionService.fetchCollectionsOrBundlesWithItemsById(
				bundleId,
				'bundle'
			);

			if (!bundleObj) {
				setLoadingInfo({
					state: 'error',
					message: t('bundle/views/bundle-detail___de-bundel-kon-niet-worden-gevonden'),
					icon: 'search',
				});
				return;
			}

			BookmarksViewsPlaysService.action('view', 'bundle', bundleObj.id, user);

			// Get view counts for each fragment
			try {
				setViewCountsById(
					await BookmarksViewsPlaysService.getMultipleViewCounts(
						bundleObj.collection_fragments.map(fragment => fragment.external_id),
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

			setPermissions(permissionObj);
			setBundle(bundleObj || null);
		};

		checkPermissionsAndGetBundle().catch(err => {
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
	}, [user, bundleId, setLoadingInfo, t]);

	useEffect(() => {
		if (!isEmpty(permissions) && bundle) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [permissions, bundle, setLoadingInfo]);

	useEffect(() => {
		getRelatedItems(bundleId, 'bundles', 4)
			.then(relatedItems => {
				setRelatedBundles(relatedItems);
			})
			.catch(err => {
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
	}, [setRelatedBundles, t, bundleId]);

	// Listeners
	const onEditBundle = () => {
		redirectToClientPage(buildLink(APP_PATH.BUNDLE_EDIT.route, { id: bundleId }), history);
	};

	const onDeleteBundle = async () => {
		try {
			await CollectionService.deleteCollection(bundleId);
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
			const duplicateCollection = await CollectionService.duplicateCollection(
				bundle,
				user,
				COLLECTION_COPY,
				COLLECTION_COPY_REGEX
			);
			redirectToClientPage(
				buildLink(APP_PATH.BUNDLE_DETAIL.route, { id: duplicateCollection.id }),
				history
			);
			setBundle(duplicateCollection);
			setBundleId(duplicateCollection.id);
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

			case 'openShareModal':
				setIsShareModalOpen(true);
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
					<MediaCard
						className="u-clickable"
						category={contentType}
						onClick={() =>
							redirectToClientPage(
								generateContentLinkString(
									relatedItem.administrative_type,
									relatedItem.id
								),
								history
							)
						}
						orientation="horizontal"
						title={relatedItem.dc_title}
					>
						<MediaCardThumbnail>
							<Thumbnail category={contentType} src={relatedItem.thumbnail_path} />
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
					<MediaCard
						className="u-clickable"
						category="bundle"
						onClick={() =>
							redirectToClientPage(
								buildLink(APP_PATH.COLLECTION_DETAIL.route, { id: collection.id }),
								history
							)
						}
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
							/>
						</MediaCardThumbnail>
						<MediaCardMetaData>
							<MetaData category="collection">
								<MetaDataItem
									label={String(viewCountsById[fragment.external_id] || 0)}
									icon="eye"
								/>
								<MetaDataItem label={fromNow(collection.updated_at)} />
							</MetaData>
						</MediaCardMetaData>
					</MediaCard>
				</Column>
			);
		});
	}

	const renderActions = () => {
		if (isMobileWidth()) {
			const BUNDLE_DROPDOWN_ITEMS = [
				createDropdownMenuItem('edit', t('bundle/views/bundle-detail___bewerken'), 'edit'),
				createDropdownMenuItem(
					'openShareModal',
					t('bundle/views/bundle-detail___delen'),
					'lock'
				),
				createDropdownMenuItem(
					'toggleBookmark',
					bookmarkViewPlayCounts.isBookmarked
						? t('bundle/views/bundle-detail___verwijder-bladwijzer')
						: t('bundle/views/bundle-detail___maak-bladwijzer'),
					bookmarkViewPlayCounts.isBookmarked ? 'bookmark-filled' : 'bookmark'
				),
				createDropdownMenuItem(
					'openShareThroughEmailModal',
					t('bundle/views/bundle-detail___share-bundel'),
					'share-2'
				),
				...(permissions.canCreateBundles
					? [
							createDropdownMenuItem(
								'duplicate',
								t('bundle/views/bundle-detail___dupliceer'),
								'copy'
							),
					  ]
					: []),
				...(permissions.canDeleteBundles
					? [
							createDropdownMenuItem(
								'delete',
								t('bundle/views/bundle-detail___verwijder')
							),
					  ]
					: []),
			];
			return (
				<ControlledDropdown
					isOpen={isOptionsMenuOpen}
					menuWidth="fit-content"
					onOpen={() => setIsOptionsMenuOpen(true)}
					onClose={() => setIsOptionsMenuOpen(false)}
					placement="bottom-end"
				>
					<DropdownButton>
						<Button
							type="secondary"
							icon="more-horizontal"
							ariaLabel={t('collection/views/collection-detail___meer-opties')}
							title={t('collection/views/collection-detail___meer-opties')}
						/>
					</DropdownButton>
					<DropdownContent>
						<MenuContent menuItems={BUNDLE_DROPDOWN_ITEMS} onClick={executeAction} />
					</DropdownContent>
				</ControlledDropdown>
			);
		}
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
			...(permissions.canDeleteBundles
				? [createDropdownMenuItem('delete', t('bundle/views/bundle-detail___verwijder'))]
				: []),
		];

		return (
			<ButtonToolbar>
				<Button
					label={t('bundle/views/bundle-detail___delen')}
					title={t('bundle/views/bundle-detail___maak-de-bundel-publiek-niet-publiek')}
					onClick={() => executeAction('openShareModal')}
					type="secondary"
				/>
				<Button
					label={t('bundle/views/bundle-detail___bewerken')}
					title={t('bundle/views/bundle-detail___pas-de-bundel-aan')}
					onClick={() => executeAction('edit')}
					type="primary"
				/>
				<ToggleButton
					title={t('collection/views/collection-detail___bladwijzer')}
					type="secondary"
					icon="bookmark"
					active={bookmarkViewPlayCounts.isBookmarked}
					ariaLabel={t('collection/views/collection-detail___bladwijzer')}
					onClick={() => executeAction('toggleBookmark')}
				/>
				<Button
					title={t('bundle/views/bundle-detail___share-bundel')}
					type="secondary"
					icon="share-2"
					ariaLabel={t('bundle/views/bundle-detail___share-bundel')}
					onClick={() => executeAction('openShareThroughEmailModal')}
				/>
				<ControlledDropdown
					isOpen={isOptionsMenuOpen}
					menuWidth="fit-content"
					onOpen={() => setIsOptionsMenuOpen(true)}
					onClose={() => setIsOptionsMenuOpen(false)}
					placement="bottom-end"
				>
					<DropdownButton>
						<Button
							type="secondary"
							icon="more-horizontal"
							ariaLabel={t('collection/views/collection-detail___meer-opties')}
							title={t('collection/views/collection-detail___meer-opties')}
						/>
					</DropdownButton>
					<DropdownContent>
						<MenuContent menuItems={BUNDLE_DROPDOWN_ITEMS} onClick={executeAction} />
					</DropdownContent>
				</ControlledDropdown>
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
			updated_at,
			lom_classification,
		} = bundle as Avo.Collection.Collection;
		return (
			<Container mode="vertical">
				<Container mode="horizontal">
					<h3 className="c-h3">
						<Trans i18nKey="bundle/views/bundle-detail___over-deze-bundel">
							Over deze bundel
						</Trans>
					</h3>
					<Grid>
						<Column size="3-3">
							<Spacer margin="top">
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
						</Column>
						<Column size="3-3">
							<Spacer margin="top">
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
							<Spacer margin="top">
								<p className="u-text-bold">
									<Trans i18nKey="collection/views/collection-detail___laatst-aangepast">
										Laatst aangepast
									</Trans>
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
			description,
		} = bundle as Avo.Collection.Collection;

		if (!isFirstRender) {
			setIsPublic(is_public);
			setIsFirstRender(true);
		}

		const organisationName = get(
			bundle,
			'organisation.name',
			t('bundle/views/bundle-detail___onbekende-uitgever')
		);
		const organisationLogo = get(bundle, 'organisation.logo_url', null);

		return (
			<>
				<Container mode="vertical" background="alt" className="m-bundle-detail-header">
					<Container mode="horizontal">
						<Grid>
							<Column size="3-2">
								<Spacer margin={isMobileWidth() ? 'none' : 'right-large'}>
									<Thumbnail
										category="bundle"
										src={thumbnail_path || undefined}
									/>
								</Spacer>
							</Column>
							<Column size="3-10">
								<Toolbar autoHeight>
									<ToolbarLeft>
										<ToolbarItem>
											<span className="c-overline u-text-muted">
												{is_public
													? t(
															'bundle/views/bundle-detail___openbare-bundel'
													  )
													: t(
															'bundle/views/bundle-detail___prive-bundel'
													  )}
											</span>
											<Spacer margin="top-small">
												<h1 className="c-h1 u-m-0">{title}</h1>
											</Spacer>
										</ToolbarItem>
									</ToolbarLeft>
									<ToolbarRight>
										<ToolbarItem>{renderActions()}</ToolbarItem>
									</ToolbarRight>
								</Toolbar>
								<p className="c-body-1">{description}</p>
								<Flex spaced="regular" wrap>
									<FlexItem className="c-avatar-and-text">
										<Avatar
											image={organisationLogo}
											title={organisationName}
											dark
										/>
									</FlexItem>
								</Flex>
							</Column>
						</Grid>
					</Container>
				</Container>
				<Container mode="vertical">
					<Container mode="horizontal">
						<div className="c-media-card-list">
							<Grid>{renderCollectionFragments()}</Grid>
						</div>
					</Container>
				</Container>
				{renderMetaDataAndRelated()}
				{isPublic !== null && (
					<ShareCollectionModal
						collection={{
							...(bundle as Avo.Collection.Collection),
							is_public: isPublic,
						}}
						isOpen={isShareModalOpen}
						onClose={() => setIsShareModalOpen(false)}
						setIsPublic={setIsPublic}
						history={history}
						location={location}
						match={match}
						user={user}
					/>
				)}
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
		);
	};

	return (
		<LoadingErrorLoadedComponent
			render={renderBundle}
			dataObject={permissions}
			loadingInfo={loadingInfo}
			showSpinner={true}
		/>
	);
};

export default withRouter(BundleDetail);
