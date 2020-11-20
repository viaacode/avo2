import { get, isNil } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import { Button, ButtonToolbar, Spacer } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import { ErrorView } from '../../../error/views';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError, formatDate, navigate } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import FilterTable from '../../shared/components/FilterTable/FilterTable';
import { getDateRangeFilters, getQueryFilter } from '../../shared/helpers/filters';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import {
	GET_INTERACTIVE_TOUR_OVERVIEW_TABLE_COLS,
	INTERACTIVE_TOUR_PATH,
	ITEMS_PER_PAGE,
} from '../interactive-tour.const';
import { InteractiveTourService } from '../interactive-tour.service';
import {
	InteractiveTourOverviewTableCols,
	InteractiveTourTableState,
} from '../interactive-tour.types';

interface InteractiveTourOverviewProps extends DefaultSecureRouteProps {}

const InteractiveTourGroupOverview: FunctionComponent<InteractiveTourOverviewProps> = ({
	history,
}) => {
	const [t] = useTranslation();

	const [interactiveTourIdToDelete, setInteractiveTourIdToDelete] = useState<number | null>(null);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
	const [interactiveTours, setInteractiveTours] = useState<
		Avo.InteractiveTour.InteractiveTour[] | null
	>(null);
	const [interactiveTourCount, setInteractiveTourCount] = useState<number>(0);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [tableState, setTableState] = useState<Partial<InteractiveTourTableState>>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const fetchInteractiveTours = useCallback(async () => {
		setIsLoading(true);
		const generateWhereObject = (filters: Partial<InteractiveTourTableState>) => {
			const andFilters: any[] = [];
			andFilters.push(
				...getQueryFilter(filters.query, (queryWildcard: string) => [
					{ name: { _ilike: queryWildcard } },
					{ page: { _ilike: queryWildcard } },
				])
			);
			andFilters.push(...getDateRangeFilters(filters, ['created_at', 'updated_at']));
			return { _and: andFilters };
		};

		try {
			const [
				interactiveToursTemp,
				interactiveTourCountTemp,
			] = await InteractiveTourService.fetchInteractiveTours(
				tableState.page || 0,
				// We need to substitute page with page_id, because the filter table state already contains a prop "page" for pagination
				(tableState.sort_column || 'created_at').replace('page_id', 'page') as any,
				tableState.sort_order || 'desc',
				generateWhereObject(tableState)
			);
			setInteractiveTours(interactiveToursTemp);
			setInteractiveTourCount(interactiveTourCountTemp);
		} catch (err) {
			console.error(
				new CustomError('Failed to fetch interactive tours from graphql', err, {
					tableState,
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/interactive-tour/views/interactive-tour-overview___het-ophalen-van-de-interactive-tours-is-mislukt'
				),
			});
		}
		setIsLoading(false);
	}, [setInteractiveTours, setLoadingInfo, t, tableState]);

	useEffect(() => {
		fetchInteractiveTours();
	}, [fetchInteractiveTours]);

	useEffect(() => {
		if (interactiveTours && !isNil(interactiveTourCount)) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [interactiveTours, interactiveTourCount]);

	const handleDelete = async () => {
		try {
			if (!interactiveTourIdToDelete) {
				ToastService.danger(
					t(
						'admin/interactive-tour/views/interactive-tour-overview___het-verwijderen-van-de-interactieve-tour-is-mislukt-probeer-de-pagina-te-herladen'
					)
				);
				return;
			}

			await InteractiveTourService.deleteInteractiveTour(interactiveTourIdToDelete);
			await fetchInteractiveTours();
			ToastService.success(
				t(
					'admin/interactive-tour/views/interactive-tour-overview___de-interactieve-tour-is-verwijdert'
				)
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to delete user group', err, {
					interactiveTourIdToDelete,
					query: 'DELETE_INTERACTIVE_TOUR',
				})
			);
			ToastService.danger(
				t(
					'admin/interactive-tour/views/interactive-tour-overview___het-verwijderen-van-de-interactieve-tour-is-mislukt'
				)
			);
		}
	};

	const openModal = (interactiveTourId: number | undefined): void => {
		if (isNil(interactiveTourId)) {
			ToastService.danger(
				t(
					'admin/interactive-tour/views/interactive-tour-overview___de-interactieve-tour-kon-niet-worden-verwijdert-probeer-de-pagina-te-herladen'
				)
			);
			return;
		}
		setInteractiveTourIdToDelete(interactiveTourId);
		setIsConfirmModalOpen(true);
	};

	const renderTableCell = (
		rowData: Avo.InteractiveTour.InteractiveTour,
		columnId: InteractiveTourOverviewTableCols
	) => {
		switch (columnId) {
			case 'name':
				return (
					<Link to={buildLink(ADMIN_PATH.INTERACTIVE_TOUR_DETAIL, { id: rowData.id })}>
						{isNil(rowData.name) ? '-' : rowData.name}
					</Link>
				);

			case 'page_id':
				return (
					<div>
						<span>{rowData.page_id}</span>
						<br />
						<span className="u-text-muted">
							{get(APP_PATH, [rowData.page_id, 'route'], '-')}
						</span>
					</div>
				);

			case 'created_at':
			case 'updated_at':
				return formatDate(rowData[columnId]) || '-';

			case 'actions':
				return (
					<ButtonToolbar>
						<Button
							type="secondary"
							icon="eye"
							onClick={() =>
								navigate(history, INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_DETAIL, {
									id: rowData.id,
								})
							}
							title={t(
								'admin/interactive-tour/views/interactive-tour-overview___bekijk-de-rondleiding-detail-pagina'
							)}
							ariaLabel={t(
								'admin/interactive-tour/views/interactive-tour-overview___bekijk-de-rondleiding-detail-pagina'
							)}
						/>
						<Button
							icon="edit"
							onClick={() =>
								navigate(history, INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_EDIT, {
									id: rowData.id,
								})
							}
							size="small"
							title={t(
								'admin/interactive-tour/views/interactive-tour-overview___bewerk-de-rondleiding'
							)}
							ariaLabel={t(
								'admin/interactive-tour/views/interactive-tour-overview___bewerk-de-rondleiding'
							)}
							type="secondary"
						/>
						<Button
							icon="delete"
							onClick={() => openModal(rowData.id)}
							size="small"
							title={t(
								'admin/interactive-tour/views/interactive-tour-overview___verwijder-de-rondleiding'
							)}
							ariaLabel={t(
								'admin/interactive-tour/views/interactive-tour-overview___verwijder-de-rondleiding'
							)}
							type="danger-hover"
						/>
					</ButtonToolbar>
				);

			default:
				return isNil(rowData[columnId]) ? '-' : rowData[columnId];
		}
	};

	const renderNoResults = () => {
		return (
			<ErrorView
				message={t(
					'admin/interactive-tour/views/interactive-tour-overview___er-zijn-nog-geen-interactieve-tours-aangemaakt'
				)}
			>
				<p>
					<Trans i18nKey="admin/interactive-tour/views/interactive-tour-overview___beschrijving-hoe-interactieve-tours-toe-voegen">
						Beschrijving hoe interactieve tours toe voegen
					</Trans>
				</p>
				<Spacer margin="top">
					<Button
						icon="plus"
						label={t(
							'admin/interactive-tour/views/interactive-tour-overview___interactieve-tour-aanmaken'
						)}
						onClick={() => history.push(INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_CREATE)}
					/>
				</Spacer>
			</ErrorView>
		);
	};

	const renderInteractiveTourPageBody = () => {
		if (!interactiveTours) {
			return null;
		}
		return (
			<>
				<FilterTable
					columns={GET_INTERACTIVE_TOUR_OVERVIEW_TABLE_COLS()}
					data={interactiveTours || []}
					dataCount={interactiveTourCount}
					renderCell={(rowData: Avo.InteractiveTour.InteractiveTour, columnId: string) =>
						renderTableCell(rowData, columnId as InteractiveTourOverviewTableCols)
					}
					searchTextPlaceholder={t(
						'admin/interactive-tour/views/interactive-tour-overview___zoek-op-label-beschrijving'
					)}
					renderNoResults={renderNoResults}
					onTableStateChanged={setTableState}
					itemsPerPage={ITEMS_PER_PAGE}
					noContentMatchingFiltersMessage={t(
						'admin/interactive-tour/views/interactive-tour-overview___er-zijn-geen-interactieve-tours-die-voldoen-aan-de-filters'
					)}
					isLoading={isLoading}
				/>
				<DeleteObjectModal
					deleteObjectCallback={handleDelete}
					isOpen={isConfirmModalOpen}
					onClose={() => setIsConfirmModalOpen(false)}
				/>
			</>
		);
	};

	return (
		<AdminLayout
			pageTitle={t(
				'admin/interactive-tour/views/interactive-tour-overview___interactieve-tours'
			)}
			size="full-width"
		>
			<AdminLayoutTopBarRight>
				<Button
					label={t(
						'admin/interactive-tour/views/interactive-tour-overview___interactieve-tour-toevoegen'
					)}
					onClick={() => {
						redirectToClientPage(
							INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_CREATE,
							history
						);
					}}
				/>
			</AdminLayoutTopBarRight>
			<AdminLayoutBody>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							t(
								'admin/interactive-tour/views/interactive-tour-overview___interactieve-rondleiding-beheer-overview-pagina-titel'
							)
						)}
					</title>
					<meta
						name="description"
						content={t(
							'admin/interactive-tour/views/interactive-tour-overview___interactieve-rondleiding-beheer-overview-pagina-beschrijving'
						)}
					/>
				</MetaTags>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={interactiveTours}
					render={renderInteractiveTourPageBody}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default InteractiveTourGroupOverview;
