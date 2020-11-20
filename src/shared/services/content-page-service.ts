import queryString from 'query-string';

import { ButtonAction } from '@viaa/avo2-components';

import { ResolvedItemOrCollection } from '../../admin/content-block/components/wrappers/MediaGridWrapper/MediaGridWrapper.types';
import { ContentPageInfo } from '../../admin/content/content.types';
import { convertToContentPageInfo } from '../../admin/content/helpers/parsers';
import { CustomError, getEnv } from '../helpers';
import { fetchWithLogout } from '../helpers/fetch-with-logout';

export class ContentPageService {
	/**
	 * Get a content page with all of its content without the user having o be logged in
	 * @param path The path to identify the content page including the leading slash. eg: /over
	 */
	public static async getContentPageByPath(path: string): Promise<ContentPageInfo | null> {
		try {
			const response = await fetchWithLogout(
				`${getEnv('PROXY_URL')}/content-pages?${queryString.stringify({
					path,
				})}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				}
			);
			let responseContent: any;
			try {
				responseContent = await response.json();
			} catch (err) {}
			if (response.status < 200 || response.status >= 400) {
				throw new CustomError('Failed to get content page from /content-pages', null, {
					path,
					response,
					responseContent,
				});
			}
			if (responseContent.error) {
				return responseContent.error;
			}
			return convertToContentPageInfo(responseContent);
		} catch (err) {
			throw new CustomError('Failed to get content page by path', err);
		}
	}

	public static async resolveMediaItems(
		searchQuery: string | undefined,
		searchQueryLimit: number | undefined,
		mediaItems:
			| {
					mediaItem: ButtonAction;
			  }[]
			| undefined
	): Promise<ResolvedItemOrCollection[]> {
		let url: string | undefined;
		let body: any | undefined;
		try {
			url = `${getEnv('PROXY_URL')}/content-pages`;
			body = {
				searchQuery,
				searchQueryLimit,
				mediaItems,
			};
			const response = await fetchWithLogout(url, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});
			if (response.status < 200 || response.status >= 400) {
				throw new CustomError('response status was unexpected', null, { response });
			}
			return await response.json();
		} catch (err) {
			throw new CustomError('Failed to resolve media items through proxy', err, {
				searchQuery,
				searchQueryLimit,
				mediaItems,
				url,
				body,
			});
		}
	}
}
