import { gql } from 'apollo-boost';

export const GET_ALL_ORGANISATIONS = gql`
	query getAllOrganisations {
		shared_organisations(order_by: { name: asc }) {
			or_id
			name
		}
	}
`;

export const GET_DISTINCT_ORGANISATIONS = gql`
	query getDistinctOrganisations {
		app_item_meta(distinct_on: org_id, where: { org_id: { _is_null: false } }) {
			organisation {
				or_id
				name
			}
			is_published
			is_deleted
		}
	}
`;

export const GET_USERS_IN_COMPANY = gql`
	query getUsersByCompanyId($companyId: String!) {
		users_profiles(
			order_by: { usersByuserId: { first_name: asc } }
			where: { company_id: { _eq: $companyId } }
		) {
			id
			user: usersByuserId {
				uid
				full_name
				mail
				is_blocked
				last_access_at
			}
			profile_user_groups {
				groups(limit: 1) {
					id
					label
				}
			}
		}
	}
`;
