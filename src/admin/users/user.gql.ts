import { gql } from 'apollo-boost';

export const GET_USER_BY_ID = gql`
	query getUsers($id: uuid!) {
		users_profiles(offset: 0, limit: 1, where: { id: { _eq: $id } }) {
			id
			user: usersByuserId {
				first_name
				last_name
				mail
				idpmaps(where: { idp: { _eq: HETARCHIEF } }) {
					idp_user_id
				}
			}
			function
			avatar
			alias
			stamboek
			updated_at
			created_at
			bio
			alternative_email
		}
	}
`;

export const GET_USERS = gql`
	query getUsers(
		$offset: Int!
		$limit: Int!
		$orderBy: [users_profiles_order_by!]!
		$queryText: String!
	) {
		users_profiles(
			offset: $offset
			limit: $limit
			order_by: $orderBy
			where: {
				_or: [
					{ stamboek: { _ilike: $queryText } }
					{ alternative_email: { _ilike: $queryText } }
					{ bio: { _ilike: $queryText } }
					{ alias: { _ilike: $queryText } }
					{ function: { _ilike: $queryText } }
					{
						usersByuserId: {
							_or: [
								{ first_name: { _ilike: $queryText } }
								{ last_name: { _ilike: $queryText } }
								{ mail: { _ilike: $queryText } }
							]
						}
					}
				]
			}
		) {
			id
			user: usersByuserId {
				first_name
				last_name
				mail
				idpmaps(where: { idp: { _eq: HETARCHIEF } }) {
					idp_user_id
					id
				}
				id
			}
			function
			avatar
			alias
			stamboek
			updated_at
			created_at
			bio
			alternative_email
		}
		users_profiles_aggregate(
			where: {
				_or: [
					{ stamboek: { _ilike: $queryText } }
					{ alternative_email: { _ilike: $queryText } }
					{ bio: { _ilike: $queryText } }
					{ alias: { _ilike: $queryText } }
					{ function: { _ilike: $queryText } }
					{
						usersByuserId: {
							_or: [
								{ first_name: { _ilike: $queryText } }
								{ last_name: { _ilike: $queryText } }
								{ mail: { _ilike: $queryText } }
							]
						}
					}
				]
			}
		) {
			aggregate {
				count
			}
		}
	}
`;