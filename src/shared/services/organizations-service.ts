import { get, sortBy } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../helpers';

import { dataService } from './data-service';
import {
	GET_ALL_ORGANISATIONS,
	GET_DISTINCT_ORGANISATIONS,
	GET_USERS_IN_COMPANY,
} from './organizations-service.gql';

export class OrganisationService {
	public static async fetchOrganisations(
		onlyWithItems: boolean
	): Promise<Partial<Avo.Organization.Organization>[]> {
		try {
			const response = await dataService.query({
				query: onlyWithItems ? GET_DISTINCT_ORGANISATIONS : GET_ALL_ORGANISATIONS,
			});

			if (response.errors) {
				throw new CustomError('GraphQL response contains errors', null, { response });
			}

			let organisations: Partial<Avo.Organization.Organization>[] | null;
			if (onlyWithItems) {
				organisations = get(response, 'data.app_item_meta', []).map(
					(item: any) => item.organisation
				);
			} else {
				organisations = get(response, 'data.shared_organisations');
			}

			if (!organisations) {
				throw new CustomError('Response does not contain any organisations', null, {
					response,
				});
			}

			return sortBy(organisations, 'name');
		} catch (err) {
			throw new CustomError('Failed to get organisations from the database', err, {
				query: 'GET_ALL_ORGANISATIONS',
			});
		}
	}

	public static async fetchUsersByCompanyId(
		companyId: string
	): Promise<Partial<Avo.User.Profile>[]> {
		try {
			const response = await dataService.query({
				query: GET_USERS_IN_COMPANY,
				variables: {
					companyId,
				},
			});

			if (response.errors) {
				throw new CustomError('GraphQL response contains errors', null, { response });
			}

			const users: Partial<Avo.User.Profile>[] | null = get(response, 'data.users_profiles');

			if (!users) {
				throw new CustomError('Response does not contain any users', null, {
					response,
				});
			}

			return users;
		} catch (err) {
			throw new CustomError('Failed to get users by companyId from the database', err, {
				query: 'GET_USERS_IN_COMPANY',
			});
		}
	}
}
