import { gql } from 'apollo-boost';

export const GET_COLLECTIONS = gql`
	query getCollections(
		$where: app_collections_bool_exp!
		$orderBy: [app_collections_order_by!]!
		$offset: Int!
		$limit: Int!
	) {
		app_collections(where: $where, order_by: $orderBy, offset: $offset, limit: $limit) {
			id
			type_id
			updated_at
			title
			description
			is_public
			is_deleted
			created_at
			profile {
				id
				organisation {
					logo_url
					name
					or_id
				}
				profile_user_group {
					groups {
						label
						id
					}
				}
				user: usersByuserId {
					id
					first_name
					last_name
				}
			}
			view_counts_aggregate {
				aggregate {
					sum {
						count
					}
				}
			}
			collection_bookmarks_aggregate {
				aggregate {
					count(distinct: false)
				}
			}
			lom_context
			lom_classification
			updated_by {
				id
				user: usersByuserId {
					id
					first_name
					last_name
					profile {
						profile_user_group {
							groups {
								label
								id
							}
						}
					}
				}
			}
			collection_labels {
				id
				label
			}
			copies: relations_aggregate(where: { predicate: { _eq: "HAS_COPY" } }) {
				aggregate {
					count
				}
			}
			in_bundle: relations_aggregate(where: { predicate: { _eq: "USED_IN_COLLECTION" } }) {
				aggregate {
					count
				}
			}
			in_assignment: relations_aggregate(
				where: { predicate: { _eq: "USED_IN_ASSIGNMENT" } }
			) {
				aggregate {
					count
				}
			}
		}
		app_collections_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`;
