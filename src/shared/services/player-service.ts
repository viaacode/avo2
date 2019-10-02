import { getEnv } from '../../shared/helpers/env';

export type PlayerTicketResponse = {
	url: string;
};

export const fetchPlayerTicket = async (externalId: string): Promise<string> => {
	const url = `${getEnv('PROXY_URL')}/player-ticket?externalId=${externalId}`;

	const response = await fetch(url, {
		method: 'GET',
		mode: 'no-cors',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
	});

	const data: PlayerTicketResponse = await response.json();

	return data.url;
};
