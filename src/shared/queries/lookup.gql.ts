import { gql } from 'apollo-boost';

export const GET_EDUCATION_LEVELS = gql`
	query getEducationLevels {
		lookup_enum_lom_context {
			description
		}
	}
`;

export const GET_SUBJECTS = gql`
	query getSubjects {
		lookup_enum_lom_classification {
			description
		}
	}
`;
