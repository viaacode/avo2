import { FetchResult } from 'apollo-link';
import { compact, get, has, omit, without } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../../shared/helpers';
import { ApolloCacheManager, dataService, ToastService } from '../../../shared/services';
import i18n from '../../../shared/translations/i18n';
import { ContentBlockConfig } from '../../shared/types';
import { CONTENT_BLOCKS_RESULT_PATH } from '../content-block.const';
import {
	DELETE_CONTENT_BLOCK,
	INSERT_CONTENT_BLOCKS,
	UPDATE_CONTENT_BLOCK,
} from '../content-block.gql';
import { convertBlocksToDatabaseFormat, convertBlockToDatabaseFormat } from '../helpers';

export class ContentBlockService {
	/**
	 * Update content block.
	 *
	 * @param contentBlockConfig updated state of content block
	 */
	public static async updateContentBlock(
		contentBlockConfig: ContentBlockConfig
	): Promise<FetchResult<any> | null> {
		try {
			const contentBlock = convertBlockToDatabaseFormat(contentBlockConfig);

			return await dataService.mutate({
				mutation: UPDATE_CONTENT_BLOCK,
				variables: { contentBlock, id: contentBlockConfig.id },
				update: ApolloCacheManager.clearContentBlocksCache,
			});
		} catch (err) {
			console.error(
				new CustomError('Failed to update content block', err, {
					contentBlockConfig,
				})
			);

			ToastService.danger(
				i18n.t(
					'admin/content-block/content-block___er-ging-iets-mis-tijdens-het-updaten-van-de-content-blocks'
				)
			);

			return null;
		}
	}

	/**
	 * Delete content block.
	 *
	 * @param id content block identifier
	 */
	public static async deleteContentBlock(id: number) {
		try {
			return await dataService.mutate({
				mutation: DELETE_CONTENT_BLOCK,
				variables: { id },
				update: ApolloCacheManager.clearContentBlocksCache,
			});
		} catch (err) {
			console.error(new CustomError('Failed to delete content block', err, { id }));

			ToastService.danger(
				i18n.t(
					'admin/content-block/content-block___er-ging-iets-mis-tijdens-het-verwijderen-van-de-content-blocks'
				)
			);

			return null;
		}
	}

	private static cleanContentBlocksBeforeDatabaseInsert(
		dbContentBlocks: Partial<Avo.ContentPage.Block>[]
	) {
		return (dbContentBlocks || []).map((block) =>
			omit(block, 'enum_content_block_type', '__typename', 'id')
		);
	}

	/**
	 * Insert content blocks.
	 *
	 * @param contentId content page identifier
	 * @param contentBlockConfigs
	 *
	 * @return content blocks
	 */
	public static async insertContentBlocks(
		contentId: number,
		contentBlockConfigs: Partial<ContentBlockConfig>[]
	): Promise<Partial<ContentBlockConfig>[] | null> {
		try {
			const dbBlocks: Partial<Avo.ContentPage.Block>[] = convertBlocksToDatabaseFormat(
				contentBlockConfigs
			);
			(dbBlocks || []).forEach((block) => (block.content_id = contentId));
			const response = await dataService.mutate({
				mutation: INSERT_CONTENT_BLOCKS,
				variables: {
					contentBlocks: this.cleanContentBlocksBeforeDatabaseInsert(dbBlocks),
				},
				update: ApolloCacheManager.clearContentBlocksCache,
			});

			const ids: number[] =
				get(response, `data.${CONTENT_BLOCKS_RESULT_PATH.INSERT}.returning`) || [];
			return contentBlockConfigs.map((block, index) => ({
				...block,
				id: ids[index],
			}));
		} catch (err) {
			console.error(
				new CustomError('Failed to insert content blocks', err, {
					contentId,
					contentBlockConfigs,
				})
			);

			ToastService.danger(
				i18n.t(
					'admin/content-block/content-block___er-ging-iets-mis-tijdens-het-opslaan-van-de-content-blocks'
				)
			);

			return null;
		}
	}

	/**
	 * Update content blocks.
	 *
	 * @param contentId content page identifier
	 * @param initialContentBlocks initial state of content blocks
	 * @param contentBlockConfigs configs of content blocks to update
	 */
	public static async updateContentBlocks(
		contentId: number,
		initialContentBlocks: ContentBlockConfig[],
		contentBlockConfigs: ContentBlockConfig[]
	) {
		try {
			const initialContentBlockIds: number[] = compact(
				initialContentBlocks.map((contentBlock) => contentBlock.id)
			);
			const currentContentBlockIds = contentBlockConfigs.reduce((acc: number[], curr) => {
				if (has(curr, 'id')) {
					return [...acc, curr.id as number];
				}

				return acc;
			}, []);

			// Inserted content-blocks
			const insertPromises: Promise<any>[] = [];
			const insertedConfigs: ContentBlockConfig[] = contentBlockConfigs.filter(
				(config) => !has(config, 'id')
			);

			if (insertedConfigs.length) {
				insertPromises.push(
					ContentBlockService.insertContentBlocks(contentId, insertedConfigs)
				);
			}

			// Updated content-blocks
			const updatePromises: Promise<any>[] = [];
			const updatedConfigs = contentBlockConfigs.filter(
				(config) =>
					has(config, 'id') && initialContentBlockIds.includes(config.id as number)
			);

			updatedConfigs.forEach((config) =>
				updatePromises.push(ContentBlockService.updateContentBlock(config))
			);

			// Deleted content-blocks
			const deletePromises: Promise<any>[] = [];
			const deletedIds = without(initialContentBlockIds, ...currentContentBlockIds);

			deletedIds.forEach((id) =>
				deletePromises.push(ContentBlockService.deleteContentBlock(id))
			);

			// Run requests in parallel
			await Promise.all([
				Promise.all(insertPromises),
				Promise.all(updatePromises),
				Promise.all(deletePromises),
			]);
		} catch (err) {
			console.error(
				new CustomError('Failed to update content blocks', err, {
					contentId,
					initialContentBlocks,
					contentBlockConfigs,
				})
			);

			ToastService.danger(
				i18n.t(
					'admin/content-block/content-block___er-ging-iets-mis-tijdens-het-opslaan-van-de-content-blocks'
				)
			);

			return null;
		}
	}
}
