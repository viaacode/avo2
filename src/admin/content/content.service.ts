import { get, isFunction, kebabCase, omit } from 'lodash-es';
import moment from 'moment';

import { Avo } from '@viaa/avo2-types';

import { CustomError, performQuery, sanitizeHtml } from '../../shared/helpers';
import { getOrderObject } from '../../shared/helpers/generate-order-gql-query';
import { SanitizePreset } from '../../shared/helpers/sanitize/presets';
import { ApolloCacheManager, dataService, ToastService } from '../../shared/services';
import i18n from '../../shared/translations/i18n';
import { ContentBlockService } from '../content-block/services/content-block.service';
import { mapDeep } from '../shared/helpers/map-deep';
import { ContentBlockConfig } from '../shared/types';

import {
	CONTENT_RESULT_PATH,
	CONTENT_TYPES_LOOKUP_PATH,
	ITEMS_PER_PAGE,
	RichEditorStateKey,
	TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT,
} from './content.const';
import {
	DELETE_CONTENT,
	DELETE_CONTENT_LABEL_LINKS,
	GET_CONTENT_BY_ID,
	GET_CONTENT_LABELS_BY_CONTENT_TYPE,
	GET_CONTENT_PAGES,
	GET_CONTENT_TYPES,
	GET_PUBLIC_CONTENT_PAGES_BY_TITLE,
	GET_PUBLIC_PROJECT_CONTENT_PAGES,
	GET_PUBLIC_PROJECT_CONTENT_PAGES_BY_TITLE,
	INSERT_CONTENT,
	INSERT_CONTENT_LABEL_LINKS,
	UPDATE_CONTENT_BY_ID,
} from './content.gql';
import { ContentOverviewTableCols, ContentPageInfo } from './content.types';
import {
	convertToContentPageInfo,
	convertToContentPageInfos,
	convertToDatabaseContentPage,
} from './helpers/parsers';

export class ContentService {
	public static async getPublicContentItems(limit: number): Promise<ContentPageInfo[] | null> {
		const query = {
			query: GET_CONTENT_PAGES,
			variables: {
				limit,
				orderBy: { title: 'asc' },
				where: { is_public: { _eq: true } },
			},
		};

		return convertToContentPageInfos(
			(await performQuery(
				query,
				CONTENT_RESULT_PATH.GET,
				'Failed to retrieve content pages.'
			)) || []
		) as ContentPageInfo[];
	}

	public static async getPublicProjectContentItems(
		limit: number
	): Promise<ContentPageInfo[] | null> {
		const query = {
			query: GET_PUBLIC_PROJECT_CONTENT_PAGES,
			variables: {
				limit,
				orderBy: { title: 'asc' },
			},
		};

		return (
			(await performQuery(
				query,
				CONTENT_RESULT_PATH.GET,
				'Failed to retrieve project content pages.'
			)) || []
		);
	}

	public static async getPublicContentItemsByTitle(
		title: string,
		limit?: number
	): Promise<ContentPageInfo[]> {
		const query = {
			query: GET_PUBLIC_CONTENT_PAGES_BY_TITLE,
			variables: {
				limit: limit || null,
				orderBy: { title: 'asc' },
				where: { title: { _ilike: `%${title}%` }, is_public: { _eq: true } },
			},
		};

		return (
			(await performQuery(
				query,
				CONTENT_RESULT_PATH.GET,
				'Failed to retrieve content pages by title.'
			)) || []
		);
	}

	public static async getPublicProjectContentItemsByTitle(
		title: string,
		limit: number
	): Promise<Partial<ContentPageInfo>[] | null> {
		const query = {
			query: GET_PUBLIC_PROJECT_CONTENT_PAGES_BY_TITLE,
			variables: {
				title,
				limit,
				orderBy: { title: 'asc' },
			},
		};

		return performQuery(
			query,
			CONTENT_RESULT_PATH.GET,
			'Failed to retrieve content pages by title.'
		);
	}

	public static async getContentPageById(id: number | string): Promise<ContentPageInfo> {
		const query = {
			query: GET_CONTENT_BY_ID,
			variables: {
				id,
			},
		};

		const dbContentPage: Avo.ContentPage.Page | null = await performQuery(
			query,
			`${CONTENT_RESULT_PATH.GET}[0]`,
			`Failed to retrieve content page by id: ${id}.`
		);
		if (!dbContentPage) {
			throw new CustomError('No content page found with provided id', null, {
				id,
				code: 'NOT_FOUND',
			});
		}
		return convertToContentPageInfo(dbContentPage);
	}

	public static async getContentTypes(): Promise<
		{ value: Avo.ContentPage.Type; label: string }[] | null
	> {
		try {
			const response = await dataService.query({ query: GET_CONTENT_TYPES });

			return get(response, `data.${CONTENT_TYPES_LOOKUP_PATH}`, []).map(
				(obj: { value: Avo.ContentPage.Type; description: string }) => ({
					value: obj.value,
					label: obj.description,
				})
			);
		} catch (err) {
			console.error('Failed to retrieve content types.', err, { query: 'GET_CONTENT_TYPES' });
			ToastService.danger(
				i18n.t(
					'admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-de-content-types'
				)
			);

			return null;
		}
	}

	public static async fetchLabelsByContentType(
		contentType: string
	): Promise<Avo.ContentPage.Label[]> {
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

	public static async insertContentLabelsLinks(
		contentPageId: number,
		labelIds: (number | string)[]
	): Promise<void> {
		let variables: any;
		try {
			variables = {
				objects: labelIds.map((labelId) => ({
					content_id: contentPageId,
					label_id: labelId,
				})),
			};

			const response = await dataService.mutate({
				variables,
				mutation: INSERT_CONTENT_LABEL_LINKS,
				update: ApolloCacheManager.clearContentLabels,
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
				update: ApolloCacheManager.clearContentCache,
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

	public static async fetchContentPages(
		page: number,
		sortColumn: ContentOverviewTableCols,
		sortOrder: Avo.Search.OrderDirection,
		where: any
	): Promise<[ContentPageInfo[], number]> {
		let variables: any;
		try {
			variables = {
				where,
				offset: ITEMS_PER_PAGE * page,
				limit: ITEMS_PER_PAGE,
				orderBy: getOrderObject(
					sortColumn,
					sortOrder,
					TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT
				),
			};

			const response = await dataService.query({
				variables,
				query: GET_CONTENT_PAGES,
			});

			const dbContentPages: Avo.ContentPage.Page[] | null = get(
				response,
				'data.app_content',
				[]
			);

			const dbContentPageCount: number = get(
				response,
				'data.app_content_aggregate.aggregate.count',
				0
			);

			if (!dbContentPages) {
				throw new CustomError('Response did not contain any content pages', null, {
					response,
				});
			}

			return [convertToContentPageInfos(dbContentPages), dbContentPageCount];
		} catch (err) {
			throw new CustomError('Failed to get content pages from the database', err, {
				variables,
				query: 'GET_CONTENT_PAGES',
			});
		}
	}

	private static cleanupBeforeInsert(
		dbContentPage: Partial<Avo.ContentPage.Page>
	): Partial<Avo.ContentPage.Page> {
		return omit(dbContentPage, [
			'contentBlockssBycontentId',
			'profile',
			'__typename',
			'content_content_labels',
			'id',
		]);
	}

	public static async insertContentPage(
		contentPage: Partial<ContentPageInfo>
	): Promise<Partial<ContentPageInfo> | null> {
		try {
			const dbContentPage = this.cleanupBeforeInsert(
				convertToDatabaseContentPage(contentPage)
			);
			const response = await dataService.mutate({
				mutation: INSERT_CONTENT,
				variables: {
					contentPage: dbContentPage,
				},
				update: ApolloCacheManager.clearContentCache,
			});

			if (response.errors) {
				throw new CustomError('Response contains errors', null, { response });
			}

			const id: number | null = get(
				response,
				`data.${CONTENT_RESULT_PATH.INSERT}.returning[0].id`,
				null
			);

			if (id) {
				// Insert content-blocks
				let contentBlockConfigs: Partial<ContentBlockConfig>[] | null = null;
				if (contentPage.contentBlockConfigs && contentPage.contentBlockConfigs.length) {
					contentBlockConfigs = await ContentBlockService.insertContentBlocks(
						id,
						contentPage.contentBlockConfigs
					);

					if (!contentBlockConfigs) {
						// return null to prevent triggering success toast
						return null;
					}
				}

				return { ...contentPage, contentBlockConfigs, id } as Partial<ContentPageInfo>;
			}

			return null;
		} catch (err) {
			console.error('Failed to insert content blocks', err);
			ToastService.danger(
				i18n.t(
					'admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'
				)
			);

			return null;
		}
	}

	public static async updateContentPage(
		contentPage: Partial<ContentPageInfo>,
		initialContentPage?: Partial<ContentPageInfo>
	): Promise<Partial<ContentPageInfo> | null> {
		try {
			const dbContentPage = this.cleanupBeforeInsert(
				convertToDatabaseContentPage(contentPage)
			);
			const response = await dataService.mutate({
				mutation: UPDATE_CONTENT_BY_ID,
				variables: {
					contentPage: dbContentPage,
					id: contentPage.id,
				},
				update: ApolloCacheManager.clearContentCache,
			});

			if (response.errors) {
				throw new CustomError('Response contains errors', null, { response });
			}

			const updatedContent = get(response, 'data.update_app_content.affected_rows', null);
			if (!updatedContent) {
				throw new CustomError(
					'Content page update returned empty response',
					null,
					response
				);
			}

			if (contentPage.contentBlockConfigs && initialContentPage) {
				await ContentBlockService.updateContentBlocks(
					contentPage.id as number,
					initialContentPage.contentBlockConfigs || [],
					contentPage.contentBlockConfigs
				);
			}

			return contentPage;
		} catch (err) {
			console.error('Failed to save content', err);
			ToastService.danger(
				i18n.t(
					'admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'
				)
			);

			return null;
		}
	}

	public static getPathOrDefault(contentPage: Partial<ContentPageInfo>): string {
		return contentPage.path || `/${kebabCase(contentPage.title)}`;
	}

	/**
	 * Remove rich text editor states, since they are also saved as html,
	 * and we don't want those states to end up in the database
	 * @param blockConfigs
	 */
	public static convertRichTextEditorStatesToHtml(
		blockConfigs: ContentBlockConfig[]
	): ContentBlockConfig[] {
		return mapDeep(
			blockConfigs,
			(obj: any, key: string | number, value: any) => {
				if (String(key).endsWith(RichEditorStateKey)) {
					const htmlKey: string = String(key).substr(
						0,
						String(key).length - RichEditorStateKey.length
					);
					let htmlFromRichTextEditor = undefined;
					if (value && value.toHTML && isFunction(value.toHTML)) {
						htmlFromRichTextEditor = value.toHTML();
						if (htmlFromRichTextEditor === '<p></p>') {
							htmlFromRichTextEditor = '';
						}
					}
					obj[htmlKey] = sanitizeHtml(
						htmlFromRichTextEditor || obj[htmlKey] || '',
						'full'
					);
					delete obj[key];
				}
			},
			(key: string | number) => String(key).endsWith(RichEditorStateKey)
		);
	}

	// TODO: Make function generic so we can combine this getTitle and the one from collections.
	/**
	 * Find name that isn't a duplicate of an existing name of a content page of this user
	 * eg if these content pages exist:
	 * copy 1: test
	 * copy 2: test
	 * copy 4: test
	 *
	 * Then the algorithm will propose: copy 3: test
	 * @param copyPrefix
	 * @param copyRegex
	 * @param existingTitle
	 *
	 * @returns Potential title for duplicate content page.
	 */
	public static getCopyTitleForContentPage = async (
		copyPrefix: string,
		copyRegex: RegExp,
		existingTitle: string
	): Promise<string> => {
		const titleWithoutCopy = existingTitle.replace(copyRegex, '');
		const contentPages = await ContentService.getPublicContentItemsByTitle(
			`%${titleWithoutCopy}`
		);
		const titles = (contentPages || []).map((contentPage) => contentPage.title);

		let index = 0;
		let candidateTitle: string;

		do {
			index += 1;
			candidateTitle = copyPrefix.replace('%index%', String(index)) + titleWithoutCopy;
		} while (titles.includes(candidateTitle));

		return candidateTitle;
	};

	/**
	 * Add duplicate of content page
	 *
	 * @param contentPageInfo
	 * @param copyPrefix
	 * @param copyRegex
	 * @param profileId user who will be the owner of the copy
	 *
	 * @returns Duplicate content page.
	 */
	public static async duplicateContentPage(
		contentPageInfo: ContentPageInfo,
		copyPrefix: string,
		copyRegex: RegExp,
		profileId: string
	): Promise<Partial<ContentPageInfo> | null> {
		try {
			const contentToInsert = { ...contentPageInfo };

			// update attributes specific to duplicate
			contentToInsert.is_public = false;
			contentToInsert.published_at = null;
			contentToInsert.depublish_at = null;
			contentToInsert.publish_at = null;
			contentToInsert.path = null;
			contentToInsert.created_at = moment().toISOString();
			contentToInsert.updated_at = contentToInsert.created_at;
			contentToInsert.user_profile_id = profileId;

			try {
				contentToInsert.title = await this.getCopyTitleForContentPage(
					copyPrefix,
					copyRegex,
					contentToInsert.title
				);
			} catch (err) {
				// handle error
				const customError = new CustomError(
					'Failed to retrieve title for duplicate content page',
					err,
					{
						contentToInsert,
					}
				);

				console.error(customError);

				// fallback to simple copy title
				contentToInsert.title = `${copyPrefix.replace(' %index%', '')}${
					contentToInsert.title
				}`;
			}

			// insert duplicated collection
			return await ContentService.insertContentPage(contentToInsert);
		} catch (err) {
			throw new CustomError('Failed to duplicate collection', err, {
				copyPrefix,
				copyRegex,
				contentPage: contentPageInfo,
			});
		}
	}

	public static async deleteContentPage(id: number) {
		try {
			const response = await dataService.mutate({
				variables: { id },
				mutation: DELETE_CONTENT,
				update: ApolloCacheManager.clearContentCache,
			});

			if (response.errors) {
				throw new CustomError('Failed due to graphql errors', null, { response });
			}
		} catch (err) {
			throw new CustomError('Failed to delete content page from the database', err, {
				id,
				query: 'DELETE_CONTENT',
			});
		}
	}

	public static getDescription(
		contentPageInfo: ContentPageInfo,
		sanitizePreset: SanitizePreset = 'link'
	): string | null {
		const description = contentPageInfo.description_state
			? contentPageInfo.description_state.toHTML()
			: contentPageInfo.description_html || null;
		return description ? sanitizeHtml(description, sanitizePreset) : null;
	}
}
