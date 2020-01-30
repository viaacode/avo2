import { gql } from 'apollo-boost';

// TODO replace with uuid once database has received correct migration
export const GET_COLLECTIONS_BY_IDS = gql`
	query getCollectionsByIds($ids: [uuid!]!) {
		items: app_collections(where: { id: { _in: $ids } }) {
			external_id
			id
			thumbnail_path
			updated_at
			organisation {
				logo_url
				name
			}
			title
			avo1_id
		}
	}
`;
