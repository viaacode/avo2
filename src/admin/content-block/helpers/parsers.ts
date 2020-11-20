import { compact, get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import { ContentBlockConfig, ContentBlockType } from '../../shared/types';
import { CONTENT_BLOCK_CONFIG_MAP } from '../content-block.const';

// Parse content-block config to valid request body
export const convertBlockToDatabaseFormat = (
	contentBlockConfig: Partial<ContentBlockConfig>,
	contentId?: number
) => {
	const componentState = get(contentBlockConfig, 'components.state');
	const { ...blockState } = get(contentBlockConfig, 'block.state');

	return {
		position: contentBlockConfig.position,
		variables: { componentState, blockState },
		...(contentId ? { content_id: contentId } : null),
		content_block_type: contentBlockConfig.type,
	};
};

export const convertBlocksToDatabaseFormat = (
	contentBlockConfigs: Partial<ContentBlockConfig>[],
	contentId?: number
): Partial<Avo.ContentPage.Block>[] =>
	contentBlockConfigs.map((contentBlockConfig) =>
		convertBlockToDatabaseFormat(contentBlockConfig, contentId)
	);

// Parse content-blocks to configs
export const parseContentBlocks = (
	contentBlocks: Avo.ContentPage.Block[]
): ContentBlockConfig[] => {
	const sortedContentBlocks = contentBlocks.sort((a, b) => a.position - b.position);

	return compact(
		(sortedContentBlocks || []).map((contentBlock) => {
			const { content_block_type, id, variables } = contentBlock;
			const configForType = CONTENT_BLOCK_CONFIG_MAP[content_block_type as ContentBlockType];
			if (!configForType) {
				console.error(
					new CustomError('Failed to find content block config for type', null, {
						content_block_type,
						contentBlock,
						CONTENT_BLOCK_CONFIG_MAP,
					})
				);
				ToastService.danger('Er ging iets mis bij het laden van de pagina');
				return null;
			}
			const cleanConfig = configForType(contentBlock.position);

			const rawComponentState = get(variables, 'componentState', null);
			const componentState = Array.isArray(rawComponentState)
				? rawComponentState
				: { ...cleanConfig.components.state, ...rawComponentState };

			return {
				...cleanConfig,
				id,
				components: {
					...cleanConfig.components,
					state: componentState,
				},
				block: {
					...cleanConfig.block,
					state: {
						...cleanConfig.block.state,
						...get(variables, 'blockState', {}),
					},
				},
			} as ContentBlockConfig;
		})
	);
};
