import { get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps } from 'react-router';

import {
	Button,
	ButtonToolbar,
	Container,
	HeaderButtons,
	Spacer,
	Table,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { buildLink, CustomError, navigate } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import {
	renderDateDetailRows,
	renderDetailRow,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { INTERACTIVE_TOUR_PATH } from '../interactive-tour.const';
import { InteractiveTourService } from '../interactive-tour.service';

interface UserDetailProps extends RouteComponentProps<{ id: string }> {}

const InteractiveTourDetail: FunctionComponent<UserDetailProps> = ({ history, match }) => {
	// Hooks
	const [
		interactiveTour,
		setInteractiveTour,
	] = useState<Avo.InteractiveTour.InteractiveTour | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

	const [t] = useTranslation();

	const fetchInteractiveTourById = useCallback(async () => {
		try {
			setInteractiveTour(await InteractiveTourService.fetchInteractiveTour(match.params.id));
		} catch (err) {
			console.error(
				new CustomError('Failed to get interactive tour by id', err, {
					query: 'GET_INTERACTIVE_TOUR_BY_ID',
					variables: {
						id: match.params.id,
					},
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/interactive-tour/views/interactive-tour-detail___het-ophalen-van-de-interactive-tour-is-mislukt'
				),
			});
		}
	}, [setInteractiveTour, setLoadingInfo, t, match.params.id]);

	useEffect(() => {
		fetchInteractiveTourById();
	}, [fetchInteractiveTourById]);

	useEffect(() => {
		if (interactiveTour) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [interactiveTour, setLoadingInfo]);

	const handleDelete = async () => {
		try {
			if (!interactiveTour || !interactiveTour.id) {
				console.error(
					new CustomError(
						'Failed to delete interactive tour because the tour or its id is not set',
						null,
						{ interactiveTour }
					)
				);
				ToastService.danger(
					t(
						'admin/interactive-tour/views/interactive-tour-detail___het-verwijderen-van-de-interactive-tour-is-mislukt'
					)
				);
				return;
			}
			await InteractiveTourService.deleteInteractiveTour(interactiveTour.id);
			ToastService.success(
				t(
					'admin/interactive-tour/views/interactive-tour-detail___de-interactive-tour-is-verwijdert'
				)
			);
			redirectToClientPage(ADMIN_PATH.INTERACTIVE_TOUR_OVERVIEW, history);
		} catch (err) {
			console.error(
				new CustomError('Failed to delete interactive tour', err, { interactiveTour })
			);
			ToastService.danger(
				t(
					'admin/interactive-tour/views/interactive-tour-detail___het-verwijderen-van-de-interactive-tour-is-mislukt'
				)
			);
		}
	};

	const renderInteractiveTourDetail = () => {
		if (!interactiveTour) {
			console.error(
				new CustomError(
					'Failed to render interactive tour detail because render function is called before interactive tour was fetched'
				)
			);
			return;
		}
		return (
			<Container mode="vertical" size="small">
				<Container mode="horizontal">
					<Spacer margin="bottom-extra-large">
						<Table horizontal variant="invisible" className="c-table_detail-page">
							<tbody>
								{renderSimpleDetailRows(interactiveTour, [
									[
										'name',
										t(
											'admin/interactive-tour/views/interactive-tour-detail___naam'
										),
									],
								])}
								{renderDetailRow(
									get(APP_PATH, [interactiveTour.page_id, 'route'], '-'),
									t(
										'admin/interactive-tour/views/interactive-tour-detail___pagina'
									)
								)}
								{renderDateDetailRows(interactiveTour, [
									[
										'created_at',
										t(
											'admin/interactive-tour/views/interactive-tour-detail___aangemaakt-op'
										),
									],
									[
										'updated_at',
										t(
											'admin/interactive-tour/views/interactive-tour-detail___aangepast-op'
										),
									],
								])}
							</tbody>
						</Table>
					</Spacer>
				</Container>
			</Container>
		);
	};

	const renderUserDetailPage = () => (
		<AdminLayout
			onClickBackButton={() => navigate(history, ADMIN_PATH.INTERACTIVE_TOUR_OVERVIEW)}
			pageTitle={t(
				'admin/interactive-tour/views/interactive-tour-detail___interactive-tour-details'
			)}
			size="large"
		>
			<AdminLayoutTopBarRight>
				<HeaderButtons>
					<ButtonToolbar>
						<Button
							type="primary"
							label={t(
								'admin/interactive-tour/views/interactive-tour-detail___bewerk'
							)}
							title={t(
								'admin/interactive-tour/views/interactive-tour-detail___bewerk-deze-rondleiding'
							)}
							ariaLabel={t(
								'admin/interactive-tour/views/interactive-tour-detail___bewerk-deze-rondleiding'
							)}
							onClick={() => {
								redirectToClientPage(
									buildLink(INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_EDIT, {
										id: match.params.id,
									}),
									history
								);
							}}
						/>
						<Button
							type="danger"
							label={t(
								'admin/interactive-tour/views/interactive-tour-detail___verwijderen'
							)}
							title={t(
								'admin/interactive-tour/views/interactive-tour-detail___verwijder-deze-rondleiding'
							)}
							ariaLabel={t(
								'admin/interactive-tour/views/interactive-tour-detail___verwijder-deze-rondleiding'
							)}
							onClick={() => setIsConfirmModalOpen(true)}
						/>
					</ButtonToolbar>
				</HeaderButtons>
			</AdminLayoutTopBarRight>
			<AdminLayoutBody>
				{renderInteractiveTourDetail()}
				<DeleteObjectModal
					deleteObjectCallback={handleDelete}
					isOpen={isConfirmModalOpen}
					onClose={() => setIsConfirmModalOpen(false)}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						get(interactiveTour, 'name'),
						t(
							'admin/interactive-tour/views/interactive-tour-detail___interactieve-rondleiding-beheer-detail-pagina-titel'
						)
					)}
				</title>
				<meta
					name="description"
					content={t(
						'admin/interactive-tour/views/interactive-tour-detail___interactieve-rondleiding-beheer-detail-pagina-beschrijving'
					)}
				/>
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={interactiveTour}
				render={renderUserDetailPage}
			/>
		</>
	);
};

export default InteractiveTourDetail;
