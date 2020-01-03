import { get } from 'lodash-es';

import { ApolloCacheManager, dataService } from '../../shared/services/data-service';

import { CONTENT_BLOCK_CONFIG_MAP, CONTENT_BLOCKS_RESULT_PATH } from './content-block.const';
import { GET_CONTENT_BLOCKS_BY_CONTENT_ID, INSERT_CONTENT_BLOCKS } from './content-block.gql';
import {
	ContentBlockConfig,
	ContentBlockFormStates,
	ContentBlockSchema,
	ContentBlockType,
} from './content-block.types';

// Parse content-block config to valid request body
const parseCbConfigs = (
	contentId: number,
	cbConfigs: ContentBlockConfig[]
): Partial<ContentBlockSchema>[] => {
	const contentBlocks = cbConfigs.map((cbConfig, position) => {
		const { blockType, ...variables } = cbConfig.formState;

		return {
			position,
			variables,
			content_id: contentId,
			content_block_type: blockType,
		};
	});

	return contentBlocks;
};

// Parse content-blocks to configs
export const parseContentBlocks = (contentBlocks: ContentBlockSchema[]): ContentBlockConfig[] => {
	const cbConfigs = contentBlocks.map(contentBlock => {
		const { content_block_type, variables } = contentBlock;
		const cleanConfig = CONTENT_BLOCK_CONFIG_MAP[content_block_type as ContentBlockType]();
		console.log(variables);

		return {
			...cleanConfig,
			formState: {
				...variables,
				blockType: content_block_type,
			} as ContentBlockFormStates,
		};
	});

	return cbConfigs;
};

export const fetchContentBlocksByContentId = async (contentId: number) => {
	try {
		const response = await dataService.query({
			query: GET_CONTENT_BLOCKS_BY_CONTENT_ID,
			variables: { contentId },
		});
		console.log(response);

		const contentBlocks = get(response, `data.${CONTENT_BLOCKS_RESULT_PATH.GET}`, null);

		return contentBlocks;
	} catch (err) {
		console.error(err);
		return null;
	}
};

export const insertContentBlocks = async (
	contentId: number,
	cbConfigs: ContentBlockConfig[]
): Promise<Partial<ContentBlockSchema>[] | null> => {
	try {
		const contentBlocks = parseCbConfigs(contentId, cbConfigs);
		const response = await dataService.mutate({
			mutation: INSERT_CONTENT_BLOCKS,
			variables: { contentBlocks },
			update: ApolloCacheManager.clearContentBlocksCache,
		});

		return get(response, `data.${CONTENT_BLOCKS_RESULT_PATH.INSERT}.returning`, null);
	} catch (err) {
		console.error(err);
		return null;
	}
};

export const updateContentBlocks = async (cbConfigs: ContentBlockConfig[]) => {
	try {
		// TODO: Add update logic
	} catch (err) {
		console.error(err);
		return null;
	}
};
