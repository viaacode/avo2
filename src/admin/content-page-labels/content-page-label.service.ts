import { get, isNil } from 'lodash-es';

import { LabelObj } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../shared/helpers';
import { ApolloCacheManager, dataService, ToastService } from '../../shared/services';
import i18n from '../../shared/translations/i18n';

import { ITEMS_PER_PAGE } from './content-page-label.const';
import {
	DELETE_CONTENT_PAGE_LABEL,
	GET_CONTENT_PAGE_LABELS,
	GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_ID,
	GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_LABEL,
	GET_CONTENT_PAGE_LABEL_BY_ID,
	INSERT_CONTENT_PAGE_LABEL,
	UPDATE_CONTENT_PAGE_LABEL,
} from './content-page-label.gql';
import { ContentPageLabel, ContentPageLabelOverviewTableCols } from './content-page-label.types';

export class ContentPageLabelService {
	public static async fetchContentPageLabels(
		page: number,
		sortColumn: ContentPageLabelOverviewTableCols,
		sortOrder: Avo.Search.OrderDirection,
		where: any,
		itemsPerPage: number = ITEMS_PER_PAGE
	): Promise<[ContentPageLabel[], number]> {
		let variables: any;
		try {
			variables = {
				where,
				offset: itemsPerPage * page,
				limit: itemsPerPage,
				orderBy: [{ [sortColumn]: sortOrder }],
			};
			const response = await dataService.query({
				variables,
				query: GET_CONTENT_PAGE_LABELS,
			});
			const contentPageLabel = get(response, 'data.app_content_labels');
			const contentPageLabelCount = get(
				response,
				'data.app_content_labels_aggregate.aggregate.count'
			);

			if (!contentPageLabel) {
				throw new CustomError('Response does not contain any content page labels', null, {
					response,
				});
			}

			return [contentPageLabel, contentPageLabelCount];
		} catch (err) {
			throw new CustomError('Failed to get content page labels from the database', err, {
				variables,
				query: 'GET_CONTENT_PAGE_LABELS',
			});
		}
	}

	public static async fetchContentPageLabel(id: string): Promise<ContentPageLabel> {
		try {
			const response = await dataService.query({
				query: GET_CONTENT_PAGE_LABEL_BY_ID,
				variables: { id },
			});

			const contentPageLabelObj = get(response, 'data.app_content_labels[0]');

			if (!contentPageLabelObj) {
				throw new CustomError('Failed to find content page label by id', null, {
					response,
				});
			}

			return {
				id: contentPageLabelObj.id,
				label: contentPageLabelObj.label,
				content_type: contentPageLabelObj.content_type,
				link_to: contentPageLabelObj.link_to,
				created_at: contentPageLabelObj.created_at,
				updated_at: contentPageLabelObj.updated_at,
			};
		} catch (err) {
			throw new CustomError('Failed to get content page label by id', err, {
				query: 'GET_CONTENT_PAGE_LABEL_BY_ID',
				variables: { id },
			});
		}
	}

	public static async insertContentPageLabel(
		contentPageLabel: ContentPageLabel
	): Promise<number> {
		try {
			const response = await dataService.mutate({
				mutation: INSERT_CONTENT_PAGE_LABEL,
				variables: {
					contentPageLabel: {
						label: contentPageLabel.label,
						content_type: contentPageLabel.content_type,
					} as Partial<ContentPageLabel>,
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed to insert content page label in the database', null, {
					response,
					errors: response.errors,
				});
			}
			const contentPageLabelId = get(
				response,
				'data.insert_app_content_labels.returning[0].id'
			);
			if (isNil(contentPageLabelId)) {
				throw new CustomError(
					'Response from database does not contain the id of the inserted content page label',
					null,
					{ response }
				);
			}
			return contentPageLabelId;
		} catch (err) {
			throw new CustomError('Failed to insert content page label in the database', err, {
				contentPageLabel,
				query: 'INSERT_CONTENT_PAGE_LABEL',
			});
		}
	}

	static async updateContentPageLabel(contentPageLabelInfo: ContentPageLabel) {
		try {
			const response = await dataService.mutate({
				mutation: UPDATE_CONTENT_PAGE_LABEL,
				variables: {
					contentPageLabel: {
						label: contentPageLabelInfo.label,
						content_type: contentPageLabelInfo.content_type,
						link_to: contentPageLabelInfo.link_to,
					} as Partial<ContentPageLabel>,
					contentPageLabelId: contentPageLabelInfo.id,
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError('Failed to update content page label in the database', null, {
					response,
					errors: response.errors,
				});
			}
		} catch (err) {
			throw new CustomError('Failed to update content page label in the database', err, {
				contentPageLabel: contentPageLabelInfo,
				query: 'UPDATE_CONTENT_PAGE_LABEL',
			});
		}
	}

	public static async deleteContentPageLabel(contentPageLabelId: number | null | undefined) {
		try {
			if (isNil(contentPageLabelId)) {
				throw new CustomError(
					'Failed to delete content page label since the id is nil',
					null,
					{
						contentPageLabelId,
					}
				);
			}
			const response = await dataService.mutate({
				mutation: DELETE_CONTENT_PAGE_LABEL,
				variables: {
					id: contentPageLabelId,
				},
				update: ApolloCacheManager.clearPermissionCache,
			});
			if (response.errors) {
				throw new CustomError(
					'Failed to delete content page label from the database',
					null,
					{
						response,
						errors: response.errors,
					}
				);
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to delete content page label from the database', err, {
					contentPageLabelId,
					query: 'DELETE_CONTENT_PAGE_LABEL',
				})
			);
			ToastService.danger(
				i18n.t(
					'admin/content-page-labels/content-page-label___het-verwijderen-van-de-content-pagina-label-is-mislukt'
				)
			);
		}
	}

	static async getContentPageLabelsByTypeAndLabels(
		contentType: Avo.ContentPage.Type,
		labels: string[]
	): Promise<LabelObj[]> {
		try {
			const response = await dataService.query({
				query: GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_LABEL,
				variables: { contentType, labels },
			});

			if (response.errors) {
				throw new CustomError('graphql response contains errors', null, { response });
			}

			return get(response, 'data.app_content_labels') || [];
		} catch (err) {
			throw new CustomError(
				'Failed to get content page label objects by type and label',
				err,
				{
					query: 'GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_LABEL',
					variables: { contentType, labels },
				}
			);
		}
	}

	static async getContentPageLabelsByTypeAndIds(
		contentType: Avo.ContentPage.Type,
		labelIds: number[]
	): Promise<LabelObj[]> {
		try {
			const response = await dataService.query({
				query: GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_ID,
				variables: { contentType, labelIds },
			});

			if (response.errors) {
				throw new CustomError('graphql response contains errors', null, { response });
			}

			return get(response, 'data.app_content_labels') || [];
		} catch (err) {
			throw new CustomError(
				'Failed to get content page label objects by type and label',
				err,
				{
					query: 'GET_CONTENT_PAGE_LABELS_BY_TYPE_AND_ID',
					variables: { contentType, labelIds },
				}
			);
		}
	}
}
