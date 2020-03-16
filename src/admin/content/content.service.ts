import { MutationFunction } from '@apollo/react-common';
import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError, performQuery } from '../../shared/helpers';
import { ApolloCacheManager, dataService, ToastService } from '../../shared/services';
import i18n from '../../shared/translations/i18n';
import {
	insertContentBlocks,
	updateContentBlocks,
} from '../content-block/services/content-block.service';
import { ContentBlockConfig } from '../shared/types';

import {
	CONTENT_RESULT_PATH,
	CONTENT_TYPES_LOOKUP_PATH,
	ITEMS_PER_PAGE,
	TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT,
} from './content.const';
import {
	DELETE_CONTENT_LABEL_LINKS,
	GET_CONTENT_BY_ID,
	GET_CONTENT_LABELS_BY_CONTENT_TYPE,
	GET_CONTENT_PAGES,
	GET_CONTENT_PAGES_BY_TITLE,
	GET_CONTENT_TYPES,
	INSERT_CONTENT_LABEL,
	INSERT_CONTENT_LABEL_LINKS,
} from './content.gql';
import { ContentOverviewTableCols, ContentPageType, DbContent } from './content.types';

export class ContentService {
	public static async getContentItems(limit: number): Promise<Avo.Content.Content[] | null> {
		const query = {
			query: GET_CONTENT_PAGES,
			variables: {
				limit,
				order: { title: 'asc' },
			},
		};

		return performQuery(
			query,
			`data.${CONTENT_RESULT_PATH.GET}`,
			'Failed to retrieve content items.',
			i18n.t(
				'admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-de-content-items'
			)
		);
	}

	public static async getContentItemsByTitle(
		title: string,
		limit: number
	): Promise<Avo.Content.Content[] | null> {
		const query = {
			query: GET_CONTENT_PAGES_BY_TITLE,
			variables: {
				title,
				limit,
				order: { title: 'asc' },
			},
		};

		return performQuery(
			query,
			`data.${CONTENT_RESULT_PATH.GET}`,
			'Failed to retrieve content items by title.',
			i18n.t(
				'admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-de-content-items'
			)
		);
	}

	public static async getContentPageById(id: number | string): Promise<DbContent | null> {
		const query = {
			query: GET_CONTENT_BY_ID,
			variables: {
				id,
			},
		};

		return performQuery(
			query,
			`data.${CONTENT_RESULT_PATH.GET}[0]`,
			`Failed to retrieve content item by id: ${id}.`,
			i18n.t(
				'admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-het-content-item'
			)
		);
	}

	public static async getContentTypes(): Promise<ContentPageType[] | null> {
		try {
			const response = await dataService.query({ query: GET_CONTENT_TYPES });
			return get(response, `data.${CONTENT_TYPES_LOOKUP_PATH}`, []).map(
				(obj: { value: ContentPageType }) => obj.value
			);
		} catch (err) {
			console.error('Failed to retrieve content types.', err);
			ToastService.danger(
				i18n.t(
					'admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-de-content-types'
				),
				false
			);

			return null;
		}
	}

	public static async fetchLabelsByContentType(
		contentType: string
	): Promise<Avo.Content.ContentLabel[]> {
		let variables: any;
		try {
			variables = {
				contentType,
			};
			const response = await dataService.query({
				variables,
				query: GET_CONTENT_LABELS_BY_CONTENT_TYPE,
			});
			if (response.errors) {
				throw new CustomError(
					'Failed to get content labels by content type from database because of graphql errors',
					null,
					{ response }
				);
			}
			const labels = get(response, 'data.app_content_labels');
			if (!labels) {
				throw new CustomError('The response does not contain any labels', null, {
					response,
				});
			}
			return labels;
		} catch (err) {
			throw new CustomError(
				'Failed to get content labels by content type from database',
				err,
				{
					variables,
					query: 'GET_CONTENT_LABELS_BY_CONTENT_TYPE',
				}
			);
		}
	}

	public static async insertContentLabel(
		label: string,
		contentType: string
	): Promise<Avo.Content.ContentLabel> {
		let variables: any;
		try {
			variables = {
				label,
				contentType,
			};
			const response = await dataService.mutate({
				variables,
				mutation: INSERT_CONTENT_LABEL,
				update: ApolloCacheManager.clearContentLabels,
			});
			if (response.errors) {
				throw new CustomError(
					'Failed to insert content labels in the database because of graphql errors',
					null,
					{ response }
				);
			}
			const contentLabel = get(response, 'data.insert_app_content_labels.returning[0]');
			if (!contentLabel) {
				throw new CustomError('The response does not contain a label', null, { response });
			}
			return contentLabel;
		} catch (err) {
			throw new CustomError('Failed to insert content label in the database', err, {
				variables,
				query: 'INSERT_CONTENT_LABEL',
			});
		}
	}

	public static async insertContentLabelsLinks(
		contentPageId: number,
		labelIds: (number | string)[]
	): Promise<void> {
		let variables: any;
		try {
			variables = {
				objects: labelIds.map(labelId => ({
					content_id: contentPageId,
					label_id: labelId,
				})),
			};
			const response = await dataService.mutate({
				variables,
				mutation: INSERT_CONTENT_LABEL_LINKS,
			});
			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
		} catch (err) {
			throw new CustomError('Failed to insert content label links in the database', err, {
				variables,
				query: 'INSERT_CONTENT_LABEL_LINKS',
			});
		}
	}

	public static async deleteContentLabelsLinks(
		contentPageId: number,
		labelIds: (number | string)[]
	): Promise<void> {
		let variables: any;
		try {
			variables = {
				labelIds,
				contentPageId,
			};
			const response = await dataService.mutate({
				variables,
				mutation: DELETE_CONTENT_LABEL_LINKS,
			});
			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
		} catch (err) {
			throw new CustomError('Failed to insert content label links in the database', err, {
				variables,
				query: 'DELETE_CONTENT_LABEL_LINKS',
			});
		}
	}

	private static getOrderObject(
		sortColumn: ContentOverviewTableCols,
		sortOrder: Avo.Search.OrderDirection
	) {
		const getOrderFunc: Function | undefined =
			TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT[sortColumn];
		if (getOrderFunc) {
			return [getOrderFunc(sortOrder)];
		}
		return [{ [sortColumn]: sortOrder }];
	}

	public static async fetchContentPages(
		page: number,
		sortColumn: ContentOverviewTableCols,
		sortOrder: Avo.Search.OrderDirection,
		where: any
	): Promise<[Avo.Content.Content[], number]> {
		let variables: any;
		try {
			variables = {
				where,
				offset: ITEMS_PER_PAGE * page,
				limit: ITEMS_PER_PAGE,
				orderBy: ContentService.getOrderObject(sortColumn, sortOrder),
			};
			const response = await dataService.query({
				variables,
				query: GET_CONTENT_PAGES,
			});

			const contentPages: Avo.Content.Content[] | null = get(
				response,
				'data.app_content',
				[]
			);
			const contentPageCount: number = get(
				response,
				'data.app_content_aggregate.aggregate.count',
				0
			);

			if (!contentPages) {
				throw new CustomError('Response did not contain any content pages', null, {
					response,
				});
			}

			return [contentPages, contentPageCount];
		} catch (err) {
			throw new CustomError('Failed to get content pages from the database', err, {
				variables,
				query: 'GET_CONTENT_PAGES',
			});
		}
	}

	public static async insertContentPage(
		contentPage: Partial<Avo.Content.Content>,
		contentBlockConfigs: ContentBlockConfig[],
		triggerContentInsert: MutationFunction<Partial<Avo.Content.Content>>
	): Promise<Partial<Avo.Content.Content> | null> {
		try {
			const response = await triggerContentInsert({
				variables: { contentItem: contentPage },
				update: ApolloCacheManager.clearContentCache,
			});
			const id: number | null = get(
				response,
				`data.${CONTENT_RESULT_PATH.INSERT}.returning[0].id`,
				null
			);

			if (id) {
				// Insert content-blocks
				if (contentBlockConfigs && contentBlockConfigs.length) {
					const contentBlocks = await insertContentBlocks(id, contentBlockConfigs);

					if (!contentBlocks) {
						// return null to prevent triggering success toast
						return null;
					}
				}

				return { ...contentPage, id } as Partial<Avo.Content.Content>;
			}

			return null;
		} catch (err) {
			console.error('Failed to insert content blocks', err);
			ToastService.danger(
				i18n.t(
					'admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'
				),
				false
			);

			return null;
		}
	}

	public static async updateContentPage(
		contentPage: Partial<Avo.Content.Content>,
		initialContentBlocks: Avo.ContentBlocks.ContentBlocks[],
		contentBlockConfigs: ContentBlockConfig[],
		triggerContentUpdate: MutationFunction<Partial<Avo.Content.Content>>
	): Promise<Partial<Avo.Content.Content> | null> {
		try {
			const response = await triggerContentUpdate({
				variables: {
					contentItem: contentPage,
					id: contentPage.id,
				},
				update: ApolloCacheManager.clearContentCache,
			});
			const updatedContent = get(response, 'data', null);

			if (contentBlockConfigs && contentBlockConfigs.length) {
				await updateContentBlocks(
					contentPage.id as number,
					initialContentBlocks,
					contentBlockConfigs
				);
			}

			if (!updatedContent) {
				throw new CustomError('Content update returned empty response', null, response);
			}

			return contentPage;
		} catch (err) {
			console.error('Failed to save content', err);
			ToastService.danger(
				i18n.t(
					'admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'
				),
				false
			);

			return null;
		}
	}
}
