import { compact, get, isNil, truncate, without } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import {
	Button,
	ButtonToolbar,
	IconName,
	TagInfo,
	TagList,
	TagOption,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { getProfileId } from '../../../authentication/helpers/get-profile-id';
import { getUserGroupLabel } from '../../../authentication/helpers/get-profile-info';
import {
	PermissionName,
	PermissionService,
} from '../../../authentication/helpers/permission-service';
import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { CollectionService } from '../../../collection/collection.service';
import { ContentTypeNumber, QualityLabel } from '../../../collection/collection.types';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import { ErrorView } from '../../../error/views';
import {
	CheckboxDropdownModalProps,
	CheckboxOption,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError, formatDate, getFullName } from '../../../shared/helpers';
import { truncateTableValue } from '../../../shared/helpers/truncate';
import { ToastService } from '../../../shared/services';
import i18n from '../../../shared/translations/i18n';
import { ITEMS_PER_PAGE } from '../../content/content.const';
import AddOrRemoveLinkedElementsModal, {
	AddOrRemove,
} from '../../shared/components/AddOrRemoveLinkedElementsModal/AddOrRemoveLinkedElementsModal';
import ChangeAuthorModal from '../../shared/components/ChangeAuthorModal/ChangeAuthorModal';
import FilterTable, {
	FilterableColumn,
	getFilters,
} from '../../shared/components/FilterTable/FilterTable';
import {
	getBooleanFilters,
	getDateRangeFilters,
	getMultiOptionFilters,
	getQueryFilter,
} from '../../shared/helpers/filters';
import { AdminLayout, AdminLayoutBody } from '../../shared/layouts';
import { PickerItem } from '../../shared/types';
import { useUserGroups } from '../../user-groups/hooks';
import {
	COLLECTIONS_OR_BUNDLES_PATH,
	GET_COLLECTION_BULK_ACTIONS,
} from '../collections-or-bundles.const';
import { CollectionsOrBundlesService } from '../collections-or-bundles.service';
import {
	CollectionBulkAction,
	CollectionsOrBundlesOverviewTableCols,
	CollectionsOrBundlesTableState,
} from '../collections-or-bundles.types';

interface CollectionsOrBundlesOverviewProps extends DefaultSecureRouteProps {}

const CollectionsOrBundlesOverview: FunctionComponent<CollectionsOrBundlesOverviewProps> = ({
	history,
	location,
	user,
}) => {
	const [t] = useTranslation();

	const [collections, setCollections] = useState<Avo.Collection.Collection[] | null>(null);
	const [collectionCount, setCollectionCount] = useState<number>(0);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [tableState, setTableState] = useState<Partial<CollectionsOrBundlesTableState>>({});
	const [collectionLabels, setCollectionLabels] = useState<QualityLabel[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

	const [changeAuthorModalOpen, setChangeAuthorModalOpen] = useState<boolean>(false);

	const [changeLabelsModalOpen, setAddLabelModalOpen] = useState<boolean>(false);

	const [userGroups] = useUserGroups(false);

	// computed
	const isCollection = location.pathname === COLLECTIONS_OR_BUNDLES_PATH.COLLECTIONS_OVERVIEW;

	// methods
	const generateWhereObject = useCallback(
		(filters: Partial<CollectionsOrBundlesTableState>) => {
			const andFilters: any[] = [];
			andFilters.push(
				...getQueryFilter(filters.query, (queryWildcard: string) => [
					{ title: { _ilike: queryWildcard } },
					{ description: { _ilike: queryWildcard } },
					{
						profile: {
							usersByuserId: { full_name: { _ilike: queryWildcard } },
						},
					},
				])
			);
			andFilters.push(...getDateRangeFilters(filters, ['created_at', 'updated_at']));
			andFilters.push(...getMultiOptionFilters(filters, ['owner_profile_id']));
			andFilters.push(
				...getMultiOptionFilters(
					filters,
					['author_user_group'],
					['profile.profile_user_groups.group.id']
				)
			);
			if (filters.collection_labels && filters.collection_labels.length) {
				andFilters.push({
					_or: [
						...getMultiOptionFilters(
							{
								collection_labels: without(filters.collection_labels, 'NO_LABEL'),
							},
							['collection_labels'],
							['collection_labels.label']
						),
						...(filters.collection_labels.includes('NO_LABEL')
							? [{ _not: { collection_labels: {} } }]
							: []),
					],
				});
			}
			andFilters.push(...getBooleanFilters(filters, ['is_public']));
			andFilters.push({ is_deleted: { _eq: false } });

			// Only show published/unpublished collections/bundles based on permissions
			if (
				(isCollection &&
					!PermissionService.hasPerm(
						user,
						PermissionName.VIEW_ANY_PUBLISHED_COLLECTIONS
					)) ||
				(!isCollection &&
					!PermissionService.hasPerm(user, PermissionName.VIEW_ANY_PUBLISHED_BUNDLES))
			) {
				andFilters.push({ is_public: { _eq: false } });
			}
			if (
				(isCollection &&
					!PermissionService.hasPerm(
						user,
						PermissionName.VIEW_ANY_UNPUBLISHED_COLLECTIONS
					)) ||
				(!isCollection &&
					!PermissionService.hasPerm(user, PermissionName.VIEW_ANY_UNPUBLISHED_BUNDLES))
			) {
				andFilters.push({ is_public: { _eq: true } });
			}

			andFilters.push({
				type_id: {
					_eq: isCollection ? ContentTypeNumber.collection : ContentTypeNumber.bundle,
				},
			});

			if (!isNil(filters.is_copy)) {
				if (filters.is_copy) {
					andFilters.push({
						relations: { predicate: { _eq: 'IS_COPY_OF' } },
					});
				} else {
					andFilters.push({
						relations: { _not: { predicate: { _eq: 'IS_COPY_OF' } } },
					});
				}
			}

			return { _and: andFilters };
		},
		[isCollection, user]
	);

	const fetchCollectionsOrBundles = useCallback(async () => {
		setIsLoading(true);

		try {
			const [
				collectionsTemp,
				collectionsCountTemp,
			] = await CollectionsOrBundlesService.getCollections(
				tableState.page || 0,
				(tableState.sort_column || 'created_at') as CollectionsOrBundlesOverviewTableCols,
				tableState.sort_order || 'desc',
				generateWhereObject(getFilters(tableState))
			);
			setCollections(collectionsTemp);
			setCollectionCount(collectionsCountTemp);
		} catch (err) {
			console.error(
				new CustomError('Failed to get collections from the database', err, { tableState })
			);
			setLoadingInfo({
				state: 'error',
				message: isCollection
					? t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___het-ophalen-van-de-collecties-is-mislukt'
					  )
					: t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___het-ophalen-van-de-bundels-is-mislukt'
					  ),
			});
		}
		setIsLoading(false);
	}, [
		setLoadingInfo,
		setCollections,
		setCollectionCount,
		tableState,
		isCollection,
		t,
		generateWhereObject,
	]);

	const fetchCollectionLabels = useCallback(async () => {
		try {
			setCollectionLabels(await CollectionService.fetchQualityLabels());
		} catch (err) {
			console.error(new CustomError('Failed to get quality labels from the database', err));
			ToastService.danger(
				t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___het-ophalen-van-de-labels-is-mislukt'
				)
			);
		}
	}, [setCollectionLabels, t]);

	useEffect(() => {
		fetchCollectionsOrBundles();
		fetchCollectionLabels();
	}, [fetchCollectionsOrBundles, fetchCollectionLabels]);

	useEffect(() => {
		if (collections) {
			setLoadingInfo({
				state: 'loaded',
			});
		}

		// Update selected rows to always be a subset of the collections array
		// In other words, you cannot have something selected that isn't part of the current filtered/paginated results
		const collectionIds: string[] = (collections || []).map((coll) => coll.id);
		setSelectedCollectionIds((currentSelectedCollectionIds) => {
			return (currentSelectedCollectionIds || []).filter(
				(collId) => collId && collectionIds.includes(collId)
			);
		});
	}, [setLoadingInfo, collections, setSelectedCollectionIds]);

	const setAllCollectionsAsSelected = async () => {
		setIsLoading(true);
		try {
			const collectionIds = await CollectionsOrBundlesService.getCollectionIds(
				generateWhereObject(getFilters(tableState))
			);
			ToastService.info(
				t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___je-hebt-num-of-selected-collections-collecties-geselecteerd',
					{
						numOfSelectedCollections: collectionIds.length,
					}
				)
			);
			setSelectedCollectionIds(collectionIds);
		} catch (err) {
			console.error(
				new CustomError(
					'Failed to get all collection ids that match the selected filter',
					err,
					{ tableState }
				)
			);
			ToastService.danger('Het ophalen van de collectie ids is mislukt');
		}
		setIsLoading(false);
	};

	const userGroupOptions = userGroups.map(
		(option): CheckboxOption => ({
			id: String(option.id),
			label: option.label as string,
			checked: get(tableState, 'author.user_groups', [] as string[]).includes(
				String(option.id)
			),
		})
	);

	const collectionLabelOptions = [
		{
			id: 'NO_LABEL',
			label: t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___geen-label'
			),
			checked: get(tableState, 'collection_labels', [] as string[]).includes('NO_LABEL'),
		},
		...collectionLabels.map(
			(option): CheckboxOption => ({
				id: String(option.value),
				label: option.description,
				checked: get(tableState, 'collection_labels', [] as string[]).includes(
					String(option.value)
				),
			})
		),
	];

	const getUserOverviewTableCols = (): FilterableColumn[] => [
		{
			id: 'title',
			label: i18n.t('admin/collections-or-bundles/collections-or-bundles___title'),
			sortable: true,
			visibleByDefault: true,
		},
		{
			id: 'owner_profile_id',
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___auteur'
			),
			sortable: true,
			visibleByDefault: true,
			filterType: 'MultiUserSelectDropdown',
		},
		{
			id: 'author_user_group',
			label: i18n.t('admin/collections-or-bundles/collections-or-bundles___auteur-rol'),
			sortable: true,
			visibleByDefault: true,
			filterType: 'CheckboxDropdownModal',
			filterProps: {
				options: userGroupOptions,
			} as CheckboxDropdownModalProps,
		},
		{
			id: 'last_updated_by_profile',
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___laatste-bewerkt-door'
			),
			sortable: true,
			visibleByDefault: true,
		},
		{
			id: 'created_at',
			label: i18n.t('admin/collections-or-bundles/collections-or-bundles___aangemaakt-op'),
			sortable: true,
			visibleByDefault: true,
			filterType: 'DateRangeDropdown',
			filterProps: {},
		},
		{
			id: 'updated_at',
			label: i18n.t('admin/collections-or-bundles/collections-or-bundles___aangepast-op'),
			sortable: true,
			visibleByDefault: true,
			filterType: 'DateRangeDropdown',
			filterProps: {},
		},
		{
			id: 'is_public',
			label: i18n.t('admin/collections-or-bundles/collections-or-bundles___publiek'),
			sortable: true,
			visibleByDefault: true,
			filterType: 'BooleanCheckboxDropdown',
		},
		{
			id: 'collection_labels',
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___labels'
			),
			sortable: false,
			visibleByDefault: true,
			filterType: 'CheckboxDropdownModal',
			filterProps: {
				options: collectionLabelOptions,
			} as CheckboxDropdownModalProps,
		},
		{
			id: 'is_copy',
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___kopie'
			),
			sortable: false,
			visibleByDefault: false,
			filterType: 'BooleanCheckboxDropdown',
		},
		{
			id: 'views',
			tooltip: i18n.t('admin/collections-or-bundles/collections-or-bundles___bekeken'),
			icon: 'eye',
			sortable: true,
			visibleByDefault: true,
		},
		{
			id: 'bookmarks',
			tooltip: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___aantal-keer-opgenomen-in-een-bladwijzer'
			),
			icon: 'bookmark',
			sortable: true,
			visibleByDefault: true,
		},
		{
			id: 'copies',
			tooltip: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___aantal-keer-gekopieerd'
			),
			icon: 'copy',
			sortable: true,
			visibleByDefault: true,
		},
		...(isCollection
			? [
					{
						id: 'in_bundle',
						tooltip: i18n.t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___aantal-keer-opgenomen-in-een-bundel'
						),
						icon: 'folder' as IconName,
						sortable: true,
						visibleByDefault: true,
					},
			  ]
			: []),
		...(isCollection
			? [
					{
						id: 'in_assignment',
						tooltip: i18n.t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___aantal-keer-opgenomen-in-een-opdracht'
						),
						icon: 'clipboard' as IconName,
						sortable: true,
						visibleByDefault: true,
					},
			  ]
			: []),
		{
			id: 'actions',
			tooltip: t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___acties'
			),
			visibleByDefault: true,
		},
	];

	const navigateToCollectionDetail = (id: string | undefined) => {
		if (!id) {
			ToastService.danger(
				isCollection
					? t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___deze-collectie-heeft-geen-geldig-id'
					  )
					: t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___deze-bundel-heeft-geen-geldig-id'
					  )
			);
			return;
		}
		const detailRoute = isCollection
			? APP_PATH.COLLECTION_DETAIL.route
			: APP_PATH.BUNDLE_DETAIL.route;
		redirectToClientPage(buildLink(detailRoute, { id }), history);
	};

	const handleBulkActionSelect = async (action: CollectionBulkAction): Promise<void> => {
		if (!selectedCollectionIds || !selectedCollectionIds.length) {
			return;
		}
		switch (action) {
			case 'publish':
				await bulkChangePublishStateForSelectedCollections(true);
				return;

			case 'depublish':
				await bulkChangePublishStateForSelectedCollections(false);
				return;

			case 'delete':
				await bulkDeleteSelectedCollections();
				return;

			case 'change_author':
				setChangeAuthorModalOpen(true);
				return;

			case 'change_labels':
				setAddLabelModalOpen(true);
				return;
		}
	};

	const bulkChangePublishStateForSelectedCollections = async (isPublic: boolean) => {
		try {
			if (!selectedCollectionIds || !selectedCollectionIds.length) {
				return;
			}
			await CollectionsOrBundlesService.bulkChangePublicStateForCollections(
				isPublic,
				compact(selectedCollectionIds),
				getProfileId(user)
			);
			ToastService.success(
				isPublic
					? t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___de-gegeselecterde-collecties-zijn-gepubliceerd'
					  )
					: t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___de-gegeselecterde-collecties-zijn-gedepubliceerd'
					  )
			);
			fetchCollectionsOrBundles();
		} catch (err) {
			console.error(
				new CustomError('Failed to toggle publish state for collections', err, {
					selectedRows: selectedCollectionIds,
					isPublic,
				})
			);
			ToastService.danger(
				isPublic
					? t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___het-publiceren-van-de-collecties-is-mislukt'
					  )
					: t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___het-depubliceren-van-de-collecties-is-mislukt'
					  )
			);
		}
	};

	const bulkDeleteSelectedCollections = async () => {
		try {
			if (!selectedCollectionIds || !selectedCollectionIds.length) {
				return;
			}
			await CollectionsOrBundlesService.bulkDeleteCollections(
				compact(selectedCollectionIds),
				getProfileId(user)
			);
			ToastService.success(
				t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___de-gegeselecterde-collecties-zijn-verwijderd'
				)
			);
			fetchCollectionsOrBundles();
		} catch (err) {
			console.error(
				new CustomError('Failed to bulk delete collections', err, {
					selectedRows: selectedCollectionIds,
				})
			);
			ToastService.danger(
				t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___het-verwijderen-van-de-collecties-is-mislukt'
				)
			);
		}
	};

	const bulkChangeAuthor = async (authorProfileId: string) => {
		try {
			if (!selectedCollectionIds || !selectedCollectionIds.length) {
				return;
			}
			await CollectionsOrBundlesService.bulkUpdateAuthorForCollections(
				authorProfileId,
				compact(selectedCollectionIds),
				getProfileId(user)
			);
			ToastService.success(
				t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___de-auteurs-zijn-aangepast-voor-de-geselecterde-collecties'
				)
			);
			fetchCollectionsOrBundles();
		} catch (err) {
			console.error(
				new CustomError('Failed to bulk update author for collections', err, {
					authorProfileId,
				})
			);
			ToastService.danger(
				t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___het-aanpassen-van-de-auteurs-is-mislukt'
				)
			);
		}
	};

	const bulkChangeLabels = async (addOrRemove: AddOrRemove, labels: string[]) => {
		try {
			if (!selectedCollectionIds || !selectedCollectionIds.length) {
				return;
			}
			if (addOrRemove === 'add') {
				await CollectionsOrBundlesService.bulkAddLabelsToCollections(
					labels,
					compact(selectedCollectionIds),
					getProfileId(user)
				);
				ToastService.success(
					t(
						'admin/collections-or-bundles/views/collections-or-bundles-overview___de-labels-zijn-toegevoegd-aan-de-geslecteerde-collecties'
					)
				);
			} else {
				// remove
				await CollectionsOrBundlesService.bulkRemoveLabelsFromCollections(
					labels,
					compact(selectedCollectionIds),
					getProfileId(user)
				);
				ToastService.success(
					t(
						'admin/collections-or-bundles/views/collections-or-bundles-overview___de-labels-zijn-verwijderd-van-de-geslecteerde-collecties'
					)
				);
			}
			fetchCollectionsOrBundles();
		} catch (err) {
			console.error(
				new CustomError('Failed to bulk update labels of collections', err, {
					addOrRemove,
					labels,
				})
			);
			ToastService.danger(
				t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___het-aanpassen-van-de-labels-is-mislukt'
				)
			);
		}
	};

	const navigateToCollectionEdit = (id: string | undefined) => {
		if (!id) {
			ToastService.danger(
				isCollection
					? t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___deze-collectie-heeft-geen-geldig-id'
					  )
					: t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___deze-bundel-heeft-geen-geldig-id'
					  )
			);
			return;
		}
		const detailRoute = isCollection
			? APP_PATH.COLLECTION_EDIT.route
			: APP_PATH.BUNDLE_EDIT.route;
		const link = buildLink(detailRoute, { id });
		redirectToClientPage(link, history);
	};

	const renderTableCell = (
		rowData: Partial<Avo.Collection.Collection>,
		columnId: CollectionsOrBundlesOverviewTableCols
	) => {
		switch (columnId) {
			case 'title':
				const title = truncate((rowData as any)[columnId] || '-', { length: 50 });
				return (
					<Link
						to={buildLink(
							isCollection
								? APP_PATH.COLLECTION_EDIT.route
								: APP_PATH.BUNDLE_EDIT.route,
							{ id: rowData.id }
						)}
					>
						<span>{title}</span>
						{!!get(rowData, 'relations[0].object') && (
							<a
								href={buildLink(APP_PATH.COLLECTION_DETAIL.route, {
									id: get(rowData, 'relations[0].object'),
								})}
							>
								<TagList
									tags={[
										{ id: get(rowData, 'relations[0].object'), label: 'Kopie' },
									]}
									swatches={false}
								/>
							</a>
						)}
					</Link>
				);

			case 'owner_profile_id':
				const user: Avo.User.User | undefined = get(rowData, 'profile.user');
				return user ? truncateTableValue((user as any).full_name) : '-';

			case 'author_user_group':
				return getUserGroupLabel(get(rowData, 'profile')) || '-';

			case 'last_updated_by_profile':
				const lastEditUser: Avo.User.User | undefined = get(rowData, 'updated_by.user');
				return lastEditUser ? lastEditUser.full_name : '-';

			case 'is_public':
				return rowData[columnId]
					? t('admin/collections-or-bundles/views/collections-or-bundles-overview___ja')
					: t('admin/collections-or-bundles/views/collections-or-bundles-overview___nee');

			case 'views':
				return get(rowData, 'counts.views') || '0';

			case 'bookmarks':
				return get(rowData, 'counts.bookmarks') || '0';

			case 'copies':
				return get(rowData, 'counts.copies') || '0';

			case 'in_bundle':
				return get(rowData, 'counts.in_collection') || '0';

			case 'in_assignment':
				return get(rowData, 'counts.in_assignment') || '0';

			case 'created_at':
			case 'updated_at':
				return formatDate(rowData[columnId]) || '-';

			case 'collection_labels':
				const labels: { id: number; label: string }[] =
					get(rowData, 'collection_labels') || [];
				const tags: TagOption[] = compact(
					labels.map((labelObj: any): TagOption | null => {
						const prettyLabel = collectionLabels.find(
							(collectionLabel) => collectionLabel.value === labelObj.label
						);
						if (!prettyLabel) {
							return null;
						}
						return { label: prettyLabel.description, id: labelObj.id };
					})
				);
				if (tags.length) {
					return <TagList tags={tags} swatches={false} />;
				}

				return '-';

			case 'actions':
				return (
					<ButtonToolbar>
						<Button
							type="secondary"
							icon="eye"
							onClick={() => navigateToCollectionDetail(rowData.id)}
							ariaLabel={
								isCollection
									? t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bekijk-de-collectie'
									  )
									: t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bekijk-de-bundel'
									  )
							}
							title={
								isCollection
									? t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bekijk-de-collectie'
									  )
									: t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bekijk-de-bundel'
									  )
							}
						/>
						<Button
							type="secondary"
							icon="edit"
							onClick={() => navigateToCollectionEdit(rowData.id)}
							ariaLabel={
								isCollection
									? t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bewerk-de-collectie'
									  )
									: t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bewerk-de-bundel'
									  )
							}
							title={
								isCollection
									? t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bewerk-de-collectie'
									  )
									: t(
											'admin/collections-or-bundles/views/collections-or-bundles-overview___bewerk-de-bundel'
									  )
							}
						/>
					</ButtonToolbar>
				);

			default:
				return truncate((rowData as any)[columnId] || '-', { length: 50 });
		}
	};

	const renderNoResults = () => {
		return (
			<ErrorView
				message={t(
					'admin/collections-or-bundles/views/collections-or-bundles-overview___er-bestaan-nog-geen-collecties'
				)}
			>
				<p>
					<Trans i18nKey="admin/collections-or-bundles/views/collections-or-bundles-overview___beschrijving-wanneer-er-nog-geen-collecties-zijn">
						Beschrijving wanneer er nog geen collecties zijn
					</Trans>
				</p>
			</ErrorView>
		);
	};

	const renderCollectionsOrBundlesOverview = () => {
		if (!collections) {
			return null;
		}
		return (
			<>
				<FilterTable
					columns={getUserOverviewTableCols()}
					data={collections}
					dataCount={collectionCount}
					renderCell={renderTableCell as any}
					searchTextPlaceholder={t(
						'admin/collections-or-bundles/views/collections-or-bundles-overview___zoek-op-titel-auteur-rol'
					)}
					noContentMatchingFiltersMessage={
						isCollection
							? t(
									'admin/collections-or-bundles/views/collections-or-bundles-overview___er-zijn-geen-collecties-doe-voldoen-aan-de-opgegeven-filters'
							  )
							: t(
									'admin/collections-or-bundles/views/collections-or-bundles-overview___er-zijn-geen-bundels-doe-voldoen-aan-de-opgegeven-filters'
							  )
					}
					itemsPerPage={ITEMS_PER_PAGE}
					onTableStateChanged={setTableState}
					renderNoResults={renderNoResults}
					rowKey="id"
					bulkActions={GET_COLLECTION_BULK_ACTIONS()}
					onSelectBulkAction={handleBulkActionSelect as any}
					selectedItems={selectedCollectionIds}
					onSelectionChanged={setSelectedCollectionIds}
					onSelectAll={setAllCollectionsAsSelected}
					isLoading={isLoading}
				/>
				<ChangeAuthorModal
					isOpen={changeAuthorModalOpen}
					onClose={() => setChangeAuthorModalOpen(false)}
					callback={(newAuthor: PickerItem) => bulkChangeAuthor(newAuthor.value)}
					initialAuthor={{
						label: getFullName(
							user as { profile: Avo.User.Profile },
							true,
							false
						) as string,
						value: getProfileId(user),
						type: 'PROFILE',
					}}
				/>
				<AddOrRemoveLinkedElementsModal
					title={t(
						'admin/collections-or-bundles/views/collections-or-bundles-overview___labels-aanpassen'
					)}
					addOrRemoveLabel={t(
						'admin/collections-or-bundles/views/collections-or-bundles-overview___labels-toevoegen-of-verwijderen'
					)}
					contentLabel={t(
						'admin/collections-or-bundles/views/collections-or-bundles-overview___labels'
					)}
					isOpen={changeLabelsModalOpen}
					onClose={() => setAddLabelModalOpen(false)}
					labels={collectionLabels.map((labelObj) => ({
						label: labelObj.description,
						value: labelObj.value,
					}))}
					callback={(addOrRemove: AddOrRemove, labels: TagInfo[]) =>
						bulkChangeLabels(
							addOrRemove,
							labels.map((labelObj) => labelObj.value.toString())
						)
					}
				/>
			</>
		);
	};

	return (
		<AdminLayout
			pageTitle={
				isCollection
					? t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___collecties'
					  )
					: t(
							'admin/collections-or-bundles/views/collections-or-bundles-overview___bundels'
					  )
			}
			size="full-width"
		>
			<AdminLayoutBody>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							isCollection
								? t(
										'admin/collections-or-bundles/views/collections-or-bundles-overview___collectie-beheer-overview-pagina-titel'
								  )
								: t(
										'admin/collections-or-bundles/views/collections-or-bundles-overview___bundel-beheer-overview-pagina-titel'
								  )
						)}
					</title>
					<meta
						name="description"
						content={
							isCollection
								? t(
										'admin/collections-or-bundles/views/collections-or-bundles-overview___collectie-beheer-overview-pagina-beschrijving'
								  )
								: t(
										'admin/collections-or-bundles/views/collections-or-bundles-overview___bundel-beheer-overview-pagina-beschrijving'
								  )
						}
					/>
				</MetaTags>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={collections}
					render={renderCollectionsOrBundlesOverview}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default CollectionsOrBundlesOverview;
