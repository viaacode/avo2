import { get } from 'lodash-es';

import { CONTENT_BLOCK_CONFIG_MAP } from '../content-block.const';
import { ContentBlockConfig, ContentBlockSchema, ContentBlockType } from '../content-block.types';

// Parse content-block config to valid request body
export const parseContentBlockConfig = (
	contentBlockConfig: ContentBlockConfig,
	contentId?: number
) => {
	const componentState = contentBlockConfig.components.state;
	const { blockType, position, ...blockState } = contentBlockConfig.block.state;

	return {
		position,
		variables: { componentState, blockState },
		...(contentId ? { content_id: contentId } : null),
		content_block_type: blockType,
	};
};

export const parseContentBlockConfigs = (
	contentId: number,
	contentBlockConfigs: ContentBlockConfig[]
): Partial<ContentBlockSchema>[] =>
	contentBlockConfigs.map(contentBlockConfig =>
		parseContentBlockConfig(contentBlockConfig, contentId)
	);

// Parse content-blocks to configs
export const parseContentBlocks = (contentBlocks: ContentBlockSchema[]): ContentBlockConfig[] => {
	const sortedContentBlocks = contentBlocks.sort(
		// TODO: remove as number after types update
		(a, b) => (a.position as number) - (b.position as number)
	);

	return sortedContentBlocks.map(contentBlock => {
		const { content_block_type, id, variables } = contentBlock;
		const cleanConfig = CONTENT_BLOCK_CONFIG_MAP[content_block_type as ContentBlockType](
			// TODO: remove as number after types update
			contentBlock.position as number
		);

		return {
			...cleanConfig,
			id,
			components: {
				...cleanConfig.components,
				state: {
					...cleanConfig.components.state,
					...get(variables, 'componentState', {}),
				},
			},
			block: {
				...cleanConfig.block,
				state: {
					...cleanConfig.block.state,
					...get(variables, 'blockState', {}),
				},
			},
		} as ContentBlockConfig;
	});
};