import { Requests } from 'node-zendesk';

import { getEnv } from '../helpers';
import { fetchWithLogout } from '../helpers/fetch-with-logout';

export class ZendeskService {
	public static async createTicket(
		request: Requests.CreateModel
	): Promise<Requests.ResponseModel> {
		const response = await fetchWithLogout(`${getEnv('PROXY_URL')}/zendesk`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(request),
		});
		if (response.status < 200 || response.status >= 400) {
			throw response;
		}
		return await response.json();
	}
}
