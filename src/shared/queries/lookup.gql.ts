import { gql } from 'apollo-boost';

export const GET_EDUCATION_LEVELS = gql`
	{
		lookup_enum_lom_context {
			description
		}
	}
`;

export const GET_SUBJECTS = gql`
	{
		lookup_enum_lom_classification {
			description
		}
	}
`;
