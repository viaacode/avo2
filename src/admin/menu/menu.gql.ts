import { gql } from 'apollo-boost';

export const GET_MENUS = gql`
	query getNavElements {
		app_content_nav_elements(distinct_on: placement, order_by: { placement: asc }) {
			id
			description
			placement
			tooltip
		}
	}
`;

export const GET_MENU_ITEMS_BY_PLACEMENT = gql`
	query getMenuItemsByPlacement($placement: String!) {
		app_content_nav_elements(
			order_by: { position: asc }
			where: { placement: { _eq: $placement } }
		) {
			id
			created_at
			description
			user_group_ids
			icon_name
			label
			link_target
			placement
			position
			updated_at
			content_type
			content_path
			tooltip
		}
	}
`;

export const GET_MENU_ITEM_BY_ID = gql`
	query getMenuItemById($id: Int!) {
		app_content_nav_elements(where: { id: { _eq: $id } }) {
			id
			created_at
			description
			user_group_ids
			icon_name
			label
			link_target
			placement
			position
			updated_at
			content_type
			content_path
			tooltip
		}
	}
`;

export const UPDATE_MENU_ITEM_BY_ID = gql`
	mutation updateMenuItemById($id: Int!, $menuItem: app_content_nav_elements_set_input!) {
		update_app_content_nav_elements(where: { id: { _eq: $id } }, _set: $menuItem) {
			affected_rows
		}
	}
`;

export const INSERT_MENU_ITEM = gql`
	mutation insertMenuItem($menuItem: app_content_nav_elements_insert_input!) {
		insert_app_content_nav_elements(objects: [$menuItem]) {
			returning {
				id
			}
		}
	}
`;

export const DELETE_MENU_ITEM = gql`
	mutation deleteMenuItemById($id: Int!) {
		delete_app_content_nav_elements(where: { id: { _eq: $id } }) {
			affected_rows
		}
	}
`;
