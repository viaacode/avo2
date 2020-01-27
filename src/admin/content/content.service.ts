import { MutationFunction } from '@apollo/react-common';
import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../shared/helpers';
import { ApolloCacheManager, dataService } from '../../shared/services/data-service';
import toastService from '../../shared/services/toast-service';
import i18n from '../../shared/translations/i18n';
import { insertContentBlocks, updateContentBlocks } from '../content-block/content-block.services';
import { ContentBlockConfig, ContentBlockSchema } from '../content-block/content-block.types';

import { CONTENT_RESULT_PATH, CONTENT_TYPES_LOOKUP_PATH } from './content.const';
import { GET_CONTENT, GET_CONTENT_BY_ID, GET_CONTENT_TYPES } from './content.gql';
import { ContentTypesResponse } from './content.types';

export const fetchContentItemById = async (id: number): Promise<Avo.Content.Content | null> => {
	try {
		const response = await dataService.query({ query: GET_CONTENT_BY_ID, variables: { id } });

		return get(response, `data.${CONTENT_RESULT_PATH.GET}[0]`, null) as Avo.Content.Content | null;
	} catch (err) {
		console.error(`Failed to fetch menu item with id: ${id}`);
		toastService.danger(
			i18n.t('admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-het-content-item'),
			false
		);

		return null;
	}
};

export const fetchContentItems = async (limit: number): Promise<Avo.Content.Content[] | null> => {
	try {
		const response = await dataService.query({ query: GET_CONTENT, variables: { limit } });

		return get(response, `data.${CONTENT_RESULT_PATH.GET}`, null);
	} catch (err) {
		console.error(`Failed to fetch content items`);
		toastService.danger(
			i18n.t('admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-het-content-items'),
			false
		);

		return null;
	}
};

export const fetchContentTypes = async (): Promise<ContentTypesResponse[] | null> => {
	try {
		const response = await dataService.query({ query: GET_CONTENT_TYPES });

		return get(response, `data.${CONTENT_TYPES_LOOKUP_PATH}`, null);
	} catch (err) {
		console.error('Failed to fetch content types', err);
		toastService.danger(
			i18n.t('admin/content/content___er-ging-iets-mis-tijdens-het-ophalen-van-de-content-types'),
			false
		);

		return null;
	}
};

export const insertContent = async (
	contentItem: Partial<Avo.Content.Content>,
	contentBlockConfigs: ContentBlockConfig[],
	triggerContentInsert: MutationFunction<Partial<Avo.Content.Content>>
): Promise<Partial<Avo.Content.Content> | null> => {
	try {
		const response = await triggerContentInsert({
			variables: { contentItem },
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

			return { ...contentItem, id } as Partial<Avo.Content.Content>;
		}

		return null;
	} catch (err) {
		console.error('Failed to insert content blocks', err);
		toastService.danger(
			i18n.t('admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'),
			false
		);

		return null;
	}
};

export const updateContent = async (
	contentItem: Partial<Avo.Content.Content>,
	initialContentBlocks: ContentBlockSchema[],
	contentBlockConfigs: ContentBlockConfig[],
	triggerContentUpdate: MutationFunction<Partial<Avo.Content.Content>>
): Promise<Partial<Avo.Content.Content> | null> => {
	try {
		const response = await triggerContentUpdate({
			variables: {
				contentItem,
				id: contentItem.id,
			},
			update: ApolloCacheManager.clearContentCache,
		});
		const updatedContent = get(response, 'data', null);

		if (contentBlockConfigs && contentBlockConfigs.length) {
			await updateContentBlocks(
				contentItem.id as number,
				initialContentBlocks,
				contentBlockConfigs
			);
		}

		if (!updatedContent) {
			throw new CustomError('Content update returned empty response', null, response);
		}

		return contentItem;
	} catch (err) {
		console.error('Failed to save content', err);
		toastService.danger(
			i18n.t('admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'),
			false
		);

		return null;
	}
};
