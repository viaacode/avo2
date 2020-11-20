import { get } from 'lodash-es';

import { CustomError } from '../helpers';

import { ApolloCacheManager, dataService } from './data-service';
import {
	GET_NOTIFICATION,
	INSERT_NOTIFICATION,
	UPDATE_NOTIFICATION,
} from './notification-service.gql';

export interface NotificationInfo {
	through_email: boolean;
	through_platform: boolean;
}

export class NotificationService {
	public static async getNotification(
		key: string,
		profileId: string
	): Promise<NotificationInfo | null> {
		try {
			const response = await dataService.query({
				query: GET_NOTIFICATION,
				variables: {
					key,
					profileId,
				},
			});

			if (response.errors) {
				throw new CustomError('Response from graphql contains errors', null, {
					response,
				});
			}

			return get(response, 'data.users_notifications[0]', null);
		} catch (err) {
			throw new CustomError('Failed to get user notification', err, {
				profileId,
				notificationKey: key,
				query: 'GET_NOTIFICATION',
			});
		}
	}

	public static async setNotification(
		key: string,
		profileId: string,
		throughEmail: boolean,
		throughPlatform: boolean
	): Promise<void> {
		try {
			const notificationEntryExists: boolean = !!(await NotificationService.getNotification(
				key,
				profileId
			));
			// If entry already exists => update existing entry
			// If no entry exists in the notifications table => insert a new entry
			const mutation = notificationEntryExists ? UPDATE_NOTIFICATION : INSERT_NOTIFICATION;
			const mutateResponse = await dataService.mutate({
				mutation,
				variables: {
					profileId,
					key,
					throughEmail,
					throughPlatform,
				},
				update: ApolloCacheManager.clearNotificationCache,
			});
			if (mutateResponse.errors) {
				throw new CustomError('Response from graphql contains errors', null, {
					mutation,
					mutateResponse,
				});
			}
		} catch (err) {
			throw new CustomError('Failed to set user notification', err, {
				profileId,
				throughEmail,
				throughPlatform,
				notificationKey: key,
				query: ['GET_NOTIFICATION', 'UPDATE_NOTIFICATION', 'INSERT_NOTIFICATION'],
			});
		}
	}
}
