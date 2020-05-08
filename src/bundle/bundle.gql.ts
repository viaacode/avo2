import { gql } from 'apollo-boost';

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

export const GET_COLLECTIONS_BY_AVO1_ID = gql`
	query getCollectionsByAvo1Id($avo1Id: String!) {
		items: app_collections(where: { avo1_id: { _eq: $avo1Id } }) {
			id
		}
	}
`;
