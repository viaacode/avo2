import { get } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../helpers';

import { dataService } from './data-service';
import { INSERT_COLLECTION_BOOKMARK, INSERT_ITEM_BOOKMARK } from './event-service.gql';

const EVENT_QUERIES = {
	bookmark: {
		item: {
			query: INSERT_ITEM_BOOKMARK,
			variables: (contentId: string, profileId: string) => ({
				bookmarkItem: {
					item_id: contentId,
					profile_id: profileId,
				},
			}),
		},
		collection: {
			query: INSERT_COLLECTION_BOOKMARK,
			variables: (contentId: string, profileId: string) => ({
				bookmarkItem: {
					collection_id: contentId,
					profile_id: profileId,
				},
			}),
		},
	},
};

export async function trackEvent(
	action: 'bookmark' | 'unbookmark' | 'view' | 'play',
	contentType: 'item' | 'collection' | 'bundle',
	contentId: string,
	user: Avo.User.User
): Promise<void> {
	try {
		const profileId = get(user, 'profile.id');
		if (!profileId) {
			throw new CustomError(
				'Failed to create bookmark because could not get profile id',
				null
			);
		}
		const query = get(EVENT_QUERIES, [action, contentType, 'query']);
		const variables = get(EVENT_QUERIES, [action, contentType, 'variables'], () => {})(
			contentId,
			profileId
		);
		if (!query || !variables) {
			throw new CustomError(
				'Failed to find query/variables to execute query in the database',
				null
			);
		}
		const response = await dataService.query({ query, variables });

		if (response.errors) {
			throw new CustomError('Graphql errors', null, { errors: response.errors });
		}
	} catch (err) {
		console.error('Failed to track metric event to the database', err, {
			action,
			contentType,
			contentId,
			user,
		});
	}
}
