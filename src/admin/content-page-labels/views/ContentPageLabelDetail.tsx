import { get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import { Button, ButtonToolbar, Table } from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { GENERATE_SITE_TITLE } from '../../../constants';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../shared/components';
import { buildLink, CustomError, navigate, navigateToContentType } from '../../../shared/helpers';
import { dataService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { GET_CONTENT_TYPE_LABELS } from '../../shared/components/ContentPicker/ContentPicker.const';
import {
	renderDateDetailRows,
	renderDetailRow,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { CONTENT_PAGE_LABEL_PATH } from '../content-page-label.const';
import { GET_CONTENT_PAGE_LABEL_BY_ID } from '../content-page-label.gql';
import { ContentPageLabel } from '../content-page-label.types';

interface ContentPageLabelEditProps extends DefaultSecureRouteProps<{ id: string }> {}

const ContentPageLabelEdit: FunctionComponent<ContentPageLabelEditProps> = ({ history, match }) => {
	const [t] = useTranslation();

	// Hooks
	const [contentPageLabelInfo, setContentPageLabelInfo] = useState<ContentPageLabel | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });

	const initOrFetchContentPageLabel = useCallback(async () => {
		try {
			const response = await dataService.query({
				query: GET_CONTENT_PAGE_LABEL_BY_ID,
				variables: { id: match.params.id },
			});

			const contentPageLabelObj = get(response, 'data.app_content_labels[0]');

			if (!contentPageLabelObj) {
				setLoadingInfo({
					state: 'error',
					icon: 'search',
					message: t(
						'admin/content-page-labels/views/content-page-label-detail___deze-content-pagina-label-werd-niet-gevonden'
					),
				});
				return;
			}

			const contentLabel = {
				id: contentPageLabelObj.id,
				label: contentPageLabelObj.label,
				content_type: contentPageLabelObj.content_type,
				link_to: contentPageLabelObj.link_to,
				created_at: contentPageLabelObj.created_at,
				updated_at: contentPageLabelObj.updated_at,
			};
			setContentPageLabelInfo(contentLabel);
		} catch (err) {
			console.error(
				new CustomError('Failed to get content page label by id', err, {
					query: 'GET_CONTENT_PAGE_LABEL_BY_ID',
					variables: { id: match.params.id },
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/content-page-labels/views/content-page-label-detail___het-ophalen-van-de-content-pagina-label-is-mislukt'
				),
			});
		}
	}, [setLoadingInfo, setContentPageLabelInfo, t, match.params.id]);

	useEffect(() => {
		initOrFetchContentPageLabel();
	}, [initOrFetchContentPageLabel]);

	useEffect(() => {
		if (contentPageLabelInfo) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [contentPageLabelInfo, setLoadingInfo]);

	const handleEditClick = () => {
		redirectToClientPage(
			buildLink(CONTENT_PAGE_LABEL_PATH.CONTENT_PAGE_LABEL_EDIT, {
				id: match.params.id,
			}),
			history
		);
	};

	const renderDetailPage = () => {
		if (!contentPageLabelInfo) {
			return;
		}

		const linkTo = contentPageLabelInfo.link_to;
		const labels = GET_CONTENT_TYPE_LABELS();

		return (
			<>
				<Table horizontal variant="invisible" className="c-table_detail-page">
					<tbody>
						{renderSimpleDetailRows(contentPageLabelInfo, [
							[
								'label',
								t(
									'admin/content-page-labels/views/content-page-label-detail___label'
								),
							],
							[
								'content_type',
								t(
									'admin/content-page-labels/views/content-page-label-detail___type'
								),
							],
						])}
						{renderDetailRow(
							linkTo ? (
								<Button
									type="inline-link"
									onClick={() => navigateToContentType(linkTo, history)}
								>{`${labels[linkTo.type]} - ${linkTo.label}`}</Button>
							) : (
								'-'
							),
							t('admin/content-page-labels/views/content-page-label-detail___link')
						)}
						{renderDateDetailRows(contentPageLabelInfo, [
							[
								'created_at',
								t(
									'admin/content-page-labels/views/content-page-label-detail___aangemaakt-op'
								),
							],
							[
								'updated_at',
								t(
									'admin/content-page-labels/views/content-page-label-detail___aangepast-op'
								),
							],
						])}
					</tbody>
				</Table>
			</>
		);
	};

	// Render
	const renderPage = () => {
		if (!contentPageLabelInfo) {
			return null;
		}
		return (
			<AdminLayout
				onClickBackButton={() => navigate(history, ADMIN_PATH.CONTENT_PAGE_LABEL_OVERVIEW)}
				pageTitle={t(
					'admin/content-page-labels/views/content-page-label-detail___content-pagina-label-details'
				)}
				size="large"
			>
				<AdminLayoutTopBarRight>
					<ButtonToolbar>
						<Button
							type="primary"
							label={t(
								'admin/content-page-labels/views/content-page-label-detail___bewerken'
							)}
							title={t(
								'admin/content-page-labels/views/content-page-label-detail___bewerk-deze-content-pagina-label'
							)}
							ariaLabel={t(
								'admin/content-page-labels/views/content-page-label-detail___bewerk-deze-content-pagina-label'
							)}
							onClick={handleEditClick}
						/>
					</ButtonToolbar>
				</AdminLayoutTopBarRight>
				<AdminLayoutBody>{renderDetailPage()}</AdminLayoutBody>
			</AdminLayout>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						t(
							'admin/content-page-labels/views/content-page-label-detail___content-page-label-beheer-detail-pagina-titel'
						)
					)}
				</title>
				<meta
					name="description"
					content={t(
						'admin/content-page-labels/views/content-page-label-detail___content-page-label-beheer-detail-pagina-beschrijving'
					)}
				/>
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={contentPageLabelInfo}
				render={renderPage}
			/>
		</>
	);
};

export default ContentPageLabelEdit;
