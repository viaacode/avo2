import { gql } from 'apollo-boost';

export const INSERT_CONTENT_BLOCKS = gql`
	mutation insertContentBlocks($contentBlocks: [app_content_blocks_insert_input!]!) {
		insert_app_content_blocks(objects: $contentBlocks) {
			returning {
				id
			}
		}
	}
`;

export const UPDATE_CONTENT_BLOCK = gql`
	mutation updateContentBlock($id: Int!, $contentBlock: app_content_blocks_set_input!) {
		update_app_content_blocks(where: { id: { _eq: $id } }, _set: $contentBlock) {
			affected_rows
		}
	}
`;

export const DELETE_CONTENT_BLOCK = gql`
	mutation deleteContentBlock($id: Int!) {
		delete_app_content_blocks(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;
