export interface UpdateProfileValues {
	userId: string;
	educationLevels: {
		profile_id: string;
		key: string;
	}[];
	subjects: {
		profile_id: string;
		key: string;
	}[];
	organizations: {
		profile_id: string;
		organization_id: string;
		unit_id: string | null;
	}[];
	firstName: string;
	lastName: string;
	company_id: string | null;
	alias: string;
	title: string | null;
	alternativeEmail: string;
	avatar: string | null;
	bio: string | null;
	location: string;
	stamboek: string | null;
}

export type UsersInSameCompanyColumn =
	| 'full_name'
	| 'mail'
	| 'is_blocked'
	| 'last_access_at'
	| 'user_group';
