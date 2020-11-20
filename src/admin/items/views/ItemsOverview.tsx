import { get, isNil, truncate } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import { Button, ButtonToolbar } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import {
	PermissionName,
	PermissionService,
} from '../../../authentication/helpers/permission-service';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import { ErrorView } from '../../../error/views';
import {
	CheckboxOption,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError, formatDate } from '../../../shared/helpers';
import { truncateTableValue } from '../../../shared/helpers/truncate';
import { useCompanies } from '../../../shared/hooks/useCompanies';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import FilterTable, { getFilters } from '../../shared/components/FilterTable/FilterTable';
import {
	getBooleanFilters,
	getDateRangeFilters,
	getMultiOptionFilters,
	getQueryFilter,
} from '../../shared/helpers/filters';
import { AdminLayout, AdminLayoutBody } from '../../shared/layouts';
import { GET_ITEM_OVERVIEW_TABLE_COLS, ITEMS_PER_PAGE } from '../items.const';
import { ItemsService } from '../items.service';
import { ItemsOverviewTableCols, ItemsTableState } from '../items.types';

interface ItemsOverviewProps extends DefaultSecureRouteProps {}

const ItemsOverview: FunctionComponent<ItemsOverviewProps> = ({ user }) => {
	const [t] = useTranslation();

	const [items, setItems] = useState<Avo.Item.Item[] | null>(null);
	const [itemCount, setItemCount] = useState<number>(0);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [tableState, setTableState] = useState<Partial<ItemsTableState>>({});
	const [seriesOptions, setSeriesOptions] = useState<CheckboxOption[] | null>(null);
	const [companies] = useCompanies(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// methods
	const fetchItems = useCallback(async () => {
		setIsLoading(true);
		const generateWhereObject = (filters: Partial<ItemsTableState>) => {
			const andFilters: any[] = [];
			andFilters.push(
				...getQueryFilter(filters.query, (queryWildcard: string, query: string) => [
					{ external_id: { _eq: query } },
					{ title: { _ilike: queryWildcard } },
					{ description: { _ilike: queryWildcard } },
					{ lom_keywords: { _contains: query } },
				])
			);
			andFilters.push(...getBooleanFilters(filters, ['is_deleted']));
			if (filters.is_published) {
				const orFilters = [];
				if (filters.is_published.includes('published')) {
					orFilters.push({ is_published: { _eq: true } });
				}
				if (filters.is_published.includes('unpublished')) {
					orFilters.push({
						is_published: { _eq: false },
						depublish_reason: { _is_null: true },
						_not: { relations: { predicate: { _eq: 'IS_REPLACED_BY' } } },
					});
				}
				if (filters.is_published.includes('unpublished-with-reason')) {
					orFilters.push({
						is_published: { _eq: false },
						depublish_reason: { _is_null: false },
					});
				}
				if (filters.is_published.includes('unpublished-with-merge')) {
					orFilters.push({
						is_published: { _eq: false },
						relations: { predicate: { _eq: 'IS_REPLACED_BY' } },
					});
				}

				if (orFilters.length) {
					andFilters.push({ _or: orFilters });
				}
			}
			andFilters.push(
				...getMultiOptionFilters(filters, ['series', 'organisation'], ['series', 'org_id'])
			);
			andFilters.push(
				...getDateRangeFilters(filters, [
					'updated_at',
					'issued',
					'expiry_date',
					'publish_at',
					'depublish_at',
					'published_at',
				])
			);

			// Only show published/unpublished items based on permissions
			if (!PermissionService.hasPerm(user, PermissionName.VIEW_ANY_PUBLISHED_ITEMS)) {
				andFilters.push({ is_published: { _eq: false } });
			}
			if (!PermissionService.hasPerm(user, PermissionName.VIEW_ANY_UNPUBLISHED_ITEMS)) {
				andFilters.push({ is_published: { _eq: true } });
			}

			if (filters.type && filters.type.length) {
				andFilters.push({ type: { label: { _in: filters.type } } });
			}
			return { _and: andFilters };
		};

		try {
			const [itemsTemp, collectionsCountTemp] = await ItemsService.fetchItemsWithFilters(
				tableState.page || 0,
				(tableState.sort_column || 'created_at') as ItemsOverviewTableCols,
				tableState.sort_order || 'desc',
				generateWhereObject(getFilters(tableState))
			);
			setItems(itemsTemp);
			setItemCount(collectionsCountTemp);
		} catch (err) {
			console.error(
				new CustomError('Failed to get items from the database', err, { tableState })
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/items/views/items-overview___het-ophalen-van-de-items-is-mislukt'
				),
			});
		}
		setIsLoading(false);
	}, [setLoadingInfo, setItems, setItemCount, tableState, user, t]);

	const fetchAllSeries = useCallback(async () => {
		try {
			setSeriesOptions(
				((await ItemsService.fetchAllSeries()) || []).map(
					(serie: string): CheckboxOption => ({ id: serie, label: serie, checked: false })
				)
			);
		} catch (err) {
			console.error(new CustomError('Failed to load all item series from the database', err));
			ToastService.danger(
				t('admin/items/views/items-overview___het-ophalen-van-de-reeks-opties-is-mislukt')
			);
		}
	}, [setSeriesOptions, t]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	useEffect(() => {
		fetchAllSeries();
	}, [fetchAllSeries]);

	useEffect(() => {
		if (items) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [setLoadingInfo, items]);

	const getItemDetailLink = (externalId: string | undefined) => {
		return buildLink(APP_PATH.ITEM_DETAIL.route, { id: externalId });
	};

	const getItemAdminDetailLink = (uuid: string | undefined) => {
		return buildLink(ADMIN_PATH.ITEM_DETAIL, { id: uuid });
	};

	const renderTableCell = (rowData: Partial<Avo.Item.Item>, columnId: ItemsOverviewTableCols) => {
		switch (columnId) {
			case 'external_id':
				return (
					<Link to={buildLink(ADMIN_PATH.ITEM_DETAIL, { id: rowData.uid })}>
						{truncate((rowData as any)[columnId] || '-', { length: 60 })}
					</Link>
				);

			case 'updated_at':
			case 'depublish_at':
			case 'expiry_date':
			case 'issued':
			case 'publish_at':
			case 'published_at':
				return !isNil(rowData[columnId]) ? formatDate(rowData[columnId] as any) : '-';

			case 'organisation':
				return truncateTableValue(get(rowData, 'organisation.name'));

			case 'type':
				return get(rowData, 'type.label', '-');

			case 'views':
				return get(rowData, 'item_counts.views') || '0';

			case 'in_collection':
				return get(rowData, 'item_counts.in_collection') || '0';

			case 'bookmarks':
				return get(rowData, 'item_counts.bookmarks') || '0';

			case 'in_assignment':
				return get(rowData, 'item_counts.in_assignment') || '0';

			case 'is_deleted':
				return rowData[columnId] ? 'Ja' : 'Nee';

			case 'is_published':
				if (rowData.is_published) {
					return t('admin/items/views/items-overview___gepubliceerd');
				}
				if (rowData.depublish_reason) {
					return t('admin/items/views/items-overview___gedepubliceerd-pancarte');
				}
				if (get(rowData, 'relations[0]')) {
					return t('admin/items/views/items-overview___gedepubliceerd-merge');
				}
				return t('admin/items/views/items-overview___gedepubliceerd');

			case 'actions':
				return (
					<ButtonToolbar>
						<Link to={getItemDetailLink(rowData.external_id)}>
							<Button
								type="secondary"
								icon="eye"
								title={t(
									'admin/items/views/items-overview___bekijk-item-in-de-website'
								)}
								ariaLabel={t(
									'admin/items/views/items-overview___bekijk-item-in-de-website'
								)}
							/>
						</Link>
						<Link to={getItemAdminDetailLink(rowData.uid)}>
							<Button
								type="secondary"
								icon="edit"
								title={t(
									'admin/items/views/items-overview___bekijk-item-details-in-het-beheer'
								)}
								ariaLabel={t(
									'admin/items/views/items-overview___bekijk-item-details-in-het-beheer'
								)}
							/>
						</Link>
					</ButtonToolbar>
				);

			default:
				return truncate((rowData as any)[columnId] || '-', { length: 60 });
		}
	};

	const renderNoResults = () => {
		return (
			<ErrorView message={t('admin/items/views/items-overview___er-bestaan-nog-geen-items')}>
				<p>
					<Trans i18nKey="admin/items/views/items-overview___beschrijving-wanneer-er-nog-geen-items-zijn">
						Beschrijving wanneer er nog geen items zijn
					</Trans>
				</p>
			</ErrorView>
		);
	};

	const companyOptions = companies.map(
		(option: Partial<Avo.Organization.Organization>): CheckboxOption => ({
			id: option.or_id as string,
			label: option.name as string,
			checked: get(tableState, 'organisation', [] as string[]).includes(String(option.or_id)),
		})
	);

	const renderItemsOverview = () => {
		if (!items) {
			return null;
		}
		return (
			<>
				<FilterTable
					columns={GET_ITEM_OVERVIEW_TABLE_COLS(
						seriesOptions || [],
						companyOptions || []
					)}
					data={items}
					dataCount={itemCount}
					renderCell={(rowData: Partial<Avo.Item.Item>, columnId: string) =>
						renderTableCell(rowData, columnId as ItemsOverviewTableCols)
					}
					searchTextPlaceholder={t(
						'admin/items/views/items-overview___zoek-op-pid-titel-beschrijving-organisatie'
					)}
					noContentMatchingFiltersMessage={t(
						'admin/items/views/items-overview___er-zijn-geen-items-doe-voldoen-aan-de-opgegeven-filters'
					)}
					itemsPerPage={ITEMS_PER_PAGE}
					onTableStateChanged={setTableState}
					renderNoResults={renderNoResults}
					rowKey="uid"
					isLoading={isLoading}
				/>
			</>
		);
	};

	return (
		<AdminLayout pageTitle={t('admin/items/views/items-overview___items')} size="full-width">
			<AdminLayoutBody>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							t(
								'admin/items/views/items-overview___item-beheer-overview-pagina-titel'
							)
						)}
					</title>
					<meta
						name="description"
						content={t(
							'admin/items/views/items-overview___item-beheer-overview-pagina-beschrijving'
						)}
					/>
				</MetaTags>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={items}
					render={renderItemsOverview}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default ItemsOverview;
