import { get, sortBy } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError, getEnv } from '../shared/helpers';
import { fetchWithLogout } from '../shared/helpers/fetch-with-logout';
import { GET_EDUCATION_LEVELS, GET_SUBJECTS } from '../shared/queries/lookup.gql';
import { dataService } from '../shared/services';

import { UpdateProfileValues } from './settings.types';

export class SettingsService {
	public static async updateProfileInfo(
		profile: Avo.User.Profile | null,
		variables: Partial<UpdateProfileValues>
	): Promise<void> {
		try {
			if (!profile) {
				return;
			}
			const response = await fetchWithLogout(`${getEnv('PROXY_URL')}/profile`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(variables),
			});
			let body;
			try {
				body = await response.json();
			} catch (err) {}
			if (response.status < 200 || response.status >= 400) {
				throw new CustomError(
					"Failed to update profile because response status wasn't in the valid range",
					null,
					{ response, body }
				);
			}
		} catch (err) {
			throw new CustomError('Failed to update profile information', err, {
				profile,
				variables,
			});
		}
	}

	public static async fetchSubjects(): Promise<string[]> {
		try {
			const response = await dataService.query({
				query: GET_SUBJECTS,
			});

			if (response.errors) {
				throw new CustomError('GraphQL response contains errors', null, { response });
			}

			const subjects = ((get(response, 'data.lookup_enum_lom_classification', []) || []) as {
				description: string;
			}[]).map((item: { description: string }) => item.description);

			return sortBy(subjects, (subject) => subject.toLowerCase());
		} catch (err) {
			throw new CustomError('Failed to get subjects from the database', err, {
				query: 'GET_SUBJECTS',
			});
		}
	}

	public static async fetchEducationLevels(): Promise<string[]> {
		try {
			const response = await dataService.query({
				query: GET_EDUCATION_LEVELS,
			});

			if (response.errors) {
				throw new CustomError('GraphQL response contains errors', null, { response });
			}

			return ((get(response, 'data.lookup_enum_lom_context') || []) as {
				description: string;
			}[]).map((item: { description: string }) => item.description);
		} catch (err) {
			throw new CustomError('Failed to get education levels from the database', err, {
				query: 'GET_EDUCATION_LEVELS',
			});
		}
	}
}
