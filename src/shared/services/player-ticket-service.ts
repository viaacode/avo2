import { getEnv } from '../helpers/env';

export type PlayerTicketResponse = {
	url: string;
};

export const fetchPlayerTicket = async (externalId: string): Promise<string> => {
	try {
		const url = `${getEnv('PROXY_URL')}/player-ticket?externalId=${externalId}`;

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		const data: PlayerTicketResponse = await response.json();

		return data.url;
	} catch (err) {
		console.error(err);
		throw new Error('Failed to get player ticket');
	}
};
