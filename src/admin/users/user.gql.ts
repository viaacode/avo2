import { gql } from 'apollo-boost';

export const GET_USER_BY_ID = gql`
	query getUserById($id: uuid!) {
		users_profiles(offset: 0, limit: 1, where: { id: { _eq: $id } }) {
			id
			user: usersByuserId {
				uid
				id
				first_name
				last_name
				mail
				is_blocked
				idpmaps(where: { idp: { _eq: HETARCHIEF } }) {
					id
					idp_user_id
					idp
				}
			}
			avatar
			alias
			title
			business_category
			stamboek
			updated_at
			created_at
			bio
			alternative_email
			company_id
			organisation {
				logo_url
				name
				or_id
			}
			is_exception
			title
			profile_classifications {
				key
			}
			profile_contexts {
				key
			}
			profile_organizations {
				unit_id
				organization_id
			}
			profile_user_groups {
				groups {
					id
					label
					group_user_permission_groups {
						permission_group {
							permission_group_user_permissions {
								permission {
									label
									id
								}
							}
							id
							label
						}
					}
				}
			}
		}
	}
`;

export const GET_USERS = gql`
	query getUsers(
		$offset: Int!
		$limit: Int!
		$orderBy: [shared_users_order_by!]!
		$where: shared_users_bool_exp!
	) {
		shared_users(offset: $offset, limit: $limit, order_by: $orderBy, where: $where) {
			first_name
			last_name
			mail
			id
			last_access_at
			is_blocked
			profiles {
				id
				stamboek
				created_at
				profile_user_groups {
					groups {
						label
						id
					}
				}
				organisation {
					name
				}
			}
		}
		shared_users_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;

export const UPDATE_USER_BLOCKED_STATUS = gql`
	mutation updateUserBlockedStatus($userId: uuid!, $isBlocked: Boolean!) {
		update_shared_users(where: { uid: { _eq: $userId } }, _set: { is_blocked: $isBlocked }) {
			affected_rows
		}
	}
`;
