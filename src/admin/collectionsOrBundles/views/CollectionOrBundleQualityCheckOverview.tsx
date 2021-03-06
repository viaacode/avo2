import { get, truncate } from 'lodash-es';
import React, { FunctionComponent, ReactText, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import { Button, ButtonToolbar, TagList } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import { ErrorView } from '../../../error/views';
import {
	CheckboxOption,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError } from '../../../shared/helpers';
import { useEducationLevels, useSubjects } from '../../../shared/hooks';
import { useCollectionQualityLabels } from '../../../shared/hooks/useCollectionQualityLabels';
import { ToastService } from '../../../shared/services';
import { ITEMS_PER_PAGE } from '../../content/content.const';
import FilterTable, { getFilters } from '../../shared/components/FilterTable/FilterTable';
import { NULL_FILTER } from '../../shared/helpers/filters';
import { AdminLayout, AdminLayoutBody } from '../../shared/layouts';
import { useUserGroups } from '../../user-groups/hooks';
import {
	COLLECTIONS_OR_BUNDLES_PATH,
	GET_COLLECTION_QUALITY_CHECK_COLUMNS,
} from '../collections-or-bundles.const';
import { CollectionsOrBundlesService } from '../collections-or-bundles.service';
import {
	CollectionOrBundleQualityCheckOverviewTableCols,
	CollectionOrBundleQualityCheckTableState,
} from '../collections-or-bundles.types';
import { generateCollectionWhereObject } from '../helpers/collection-filters';
import { renderCollectionOverviewColumns } from '../helpers/render-collection-columns';

interface CollectionOrBundleQualityCheckOverviewProps extends DefaultSecureRouteProps {}

const CollectionOrBundleQualityCheckOverview: FunctionComponent<CollectionOrBundleQualityCheckOverviewProps> = ({
	location,
	user,
}) => {
	const [t] = useTranslation();

	const [collections, setCollections] = useState<Avo.Collection.Collection[] | null>(null);
	const [collectionCount, setCollectionCount] = useState<number>(0);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [tableState, setTableState] = useState<Partial<CollectionOrBundleQualityCheckTableState>>(
		{}
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

	const [userGroups] = useUserGroups(false);
	const [subjects] = useSubjects();
	const [educationLevels] = useEducationLevels();
	const [collectionLabels] = useCollectionQualityLabels();

	// computed
	const isCollection =
		location.pathname === COLLECTIONS_OR_BUNDLES_PATH.COLLECTION_QUALITYCHECK_OVERVIEW;

	// methods
	const generateWhereObject = useCallback(
		(filters: Partial<CollectionOrBundleQualityCheckTableState>) => {
			const andFilters: any[] = generateCollectionWhereObject(
				filters,
				user,
				isCollection,
				true,
				false,
				'view'
			);

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
			] = await CollectionsOrBundlesService.getCollectionEditorial(
				tableState.page || 0,
				(tableState.sort_column ||
					'updated_at') as CollectionOrBundleQualityCheckOverviewTableCols,
				tableState.sort_order || 'desc',
				generateWhereObject(getFilters(tableState)),
				'quality_check'
			);
			setCollections(collectionsTemp);
			setCollectionCount(collectionsCountTemp);
		} catch (err) {
			console.error(
				new CustomError('Failed to get collection actualisations from the database', err, {
					tableState,
				})
			);
			setLoadingInfo({
				state: 'error',
				message: isCollection
					? t(
							'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___het-ophalen-van-de-collectie-actualisaties-is-mislukt'
					  )
					: t(
							'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___het-ophalen-van-de-bundel-actualisaties-is-mislukt'
					  ),
			});
		}
		setIsLoading(false);
	}, [
		generateWhereObject,
		setLoadingInfo,
		setCollections,
		setCollectionCount,
		tableState,
		isCollection,
		t,
	]);

	useEffect(() => {
		fetchCollectionsOrBundles();
	}, [fetchCollectionsOrBundles]);

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
			id: NULL_FILTER,
			label: t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___geen-label'
			),
			checked: get(tableState, 'collection_labels', [] as string[]).includes(NULL_FILTER),
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

	const renderTableCell = (
		rowData: Partial<Avo.Collection.Collection>,
		columnId: CollectionOrBundleQualityCheckOverviewTableCols
	) => {
		const editLink = buildLink(
			isCollection ? APP_PATH.COLLECTION_EDIT_TAB.route : APP_PATH.BUNDLE_EDIT_TAB.route,
			{ id: rowData.id, tabId: 'quality_check' }
		);
		switch (columnId) {
			case 'title':
				const title = truncate((rowData as any)[columnId] || '-', { length: 50 });
				return (
					<Link to={editLink}>
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

			case 'actions':
				return (
					<ButtonToolbar>
						<Link to={editLink}>
							<Button
								type="secondary"
								icon="edit"
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
						</Link>
					</ButtonToolbar>
				);

			default:
				return renderCollectionOverviewColumns(rowData, columnId, collectionLabels);
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

	const renderCollectionOrBundleQualityCheckOverview = () => {
		if (!collections) {
			return null;
		}
		return (
			<>
				<FilterTable
					columns={GET_COLLECTION_QUALITY_CHECK_COLUMNS(
						userGroupOptions,
						collectionLabelOptions,
						subjects,
						educationLevels
					)}
					data={collections}
					dataCount={collectionCount}
					renderCell={renderTableCell as any}
					searchTextPlaceholder={t(
						'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___zoek-op-titel-beschrijving-auteur'
					)}
					noContentMatchingFiltersMessage={
						isCollection
							? t(
									'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___er-zijn-geen-collectie-kwaliteitscontrole-items-die-voldoen-aan-de-opgegeven-filters'
							  )
							: t(
									'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___er-zijn-geen-bundel-kwaliteitscontrole-items-die-voldoen-aan-de-opgegeven-filters'
							  )
					}
					itemsPerPage={ITEMS_PER_PAGE}
					onTableStateChanged={setTableState}
					renderNoResults={renderNoResults}
					rowKey="id"
					selectedItemIds={selectedCollectionIds}
					onSelectionChanged={setSelectedCollectionIds as (ids: ReactText[]) => void}
					onSelectAll={setAllCollectionsAsSelected}
					isLoading={isLoading}
				/>
			</>
		);
	};

	return (
		<AdminLayout
			pageTitle={
				isCollection
					? t(
							'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___collecties-kwaliteitscontrole'
					  )
					: t(
							'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___bundels-kwaliteitscontrole'
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
										'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___collectie-kwaliteitscontrole-beheer-overview-pagina-titel'
								  )
								: t(
										'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___bundel-kwaliteitscontrole-beheer-overview-pagina-titel'
								  )
						)}
					</title>
					<meta
						name="description"
						content={
							isCollection
								? t(
										'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___collectie-kwaliteitscontrole-beheer-overview-pagina-beschrijving'
								  )
								: t(
										'admin/collections-or-bundles/views/collection-or-bundle-quality-check-overview___bundel-kwaliteitscontrole-beheer-overview-pagina-beschrijving'
								  )
						}
					/>
				</MetaTags>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={collections}
					render={renderCollectionOrBundleQualityCheckOverview}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default CollectionOrBundleQualityCheckOverview;
