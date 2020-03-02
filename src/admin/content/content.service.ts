import { MutationFunction } from '@apollo/react-common';
import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError, performQuery } from '../../shared/helpers';
import { ToastService } from '../../shared/services';
import { ApolloCacheManager, dataService } from '../../shared/services/data-service';
import i18n from '../../shared/translations/i18n';
import {
	insertContentBlocks,
	updateContentBlocks,
} from '../content-block/services/content-block.service';
import { ContentBlockConfig } from '../shared/types';

import { CONTENT_RESULT_PATH, CONTENT_TYPES_LOOKUP_PATH } from './content.const';
import {
	GET_CONTENT_BY_ID,
	GET_CONTENT_PAGES,
	GET_CONTENT_PAGES_BY_TITLE,
	GET_CONTENT_TYPES,
} from './content.gql';
import { ContentPageType } from './content.types';

export const getContentItems = async (limit: number): Promise<Avo.Content.Content[] | null> => {
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
		i18n.t('Er ging iets mis tijdens het ophalen van de content items.')
	);
};

export const getContentItemsByTitle = async (
	title: string,
	limit: number
): Promise<Avo.Content.Content[] | null> => {
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
		i18n.t('Er ging iets mis tijdens het ophalen van de content items.')
	);
};

export const getContentItemById = async (id: number): Promise<Avo.Content.Content | null> => {
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
		i18n.t('Er ging iets mis tijdens het ophalen van het content item.')
	);
};

export const getContentTypes = async (): Promise<ContentPageType[] | null> => {
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
		ToastService.danger(
			i18n.t('admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'),
			false
		);

		return null;
	}
};

export const updateContent = async (
	contentItem: Partial<Avo.Content.Content>,
	initialContentBlocks: Avo.ContentBlocks.ContentBlocks[],
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
		ToastService.danger(
			i18n.t('admin/content/content___er-ging-iets-mis-tijdens-het-opslaan-van-de-content'),
			false
		);

		return null;
	}
};
