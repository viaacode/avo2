import { Avo } from '@viaa/avo2-types';

import { getProfileId } from '../../authentication/helpers/get-profile-info';
import { getEnv } from '../helpers';

interface MinimalClientEvent {
	action: Avo.EventLogging.Action;
	object: string; // entity being modified
	object_type: Avo.EventLogging.ObjectType;
	message: any; // user played item xxx on avo
}

export function trackLogEvents(
	events: MinimalClientEvent[] | MinimalClientEvent,
	user: Avo.User.User
) {
	try {
		let eventsArray: MinimalClientEvent[];
		if (Array.isArray(events)) {
			eventsArray = events;
		} else {
			eventsArray = [events];
		}
		const eventLogEntries = eventsArray.map(
			(event: MinimalClientEvent): Avo.EventLogging.Event => {
				return {
					occurred_at: new Date().toISOString(),
					source_url: window.location.href, // url when the event was triggered
					subject: getProfileId(user), // Entity making causing the event
					subject_type: 'user_uuid',
					...event,
				};
			}
		);
		fetch(`${getEnv('PROXY_URL')}/event-logging`, {
			method: 'POST',
			body: JSON.stringify(eventLogEntries),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
		}).catch((err: any) => {
			console.error('Failed to log events to database', {
				eventLogEntries,
				innerException: err,
			});
		});
	} catch (err) {
		console.error('Failed to log event to the server', err, { events });
	}
}
