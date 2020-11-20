import { gql } from 'apollo-boost';

export const GET_TRANSLATIONS = gql`
	query getTranslations {
		app_site_variables(where: { name: { _ilike: "translations-%" } }) {
			name
			value
		}
	}
`;

export const UPDATE_TRANSLATIONS = gql`
	mutation updateTranslations($name: String!, $translations: app_site_variables_set_input!) {
		update_app_site_variables(where: { name: { _eq: $name } }, _set: $translations) {
			affected_rows
		}
	}
`;
