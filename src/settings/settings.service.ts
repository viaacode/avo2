import { Avo } from '@viaa/avo2-types';

interface UpdateProfileValues {
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
	alias: string;
	alternativeEmail: string;
	avatar: string | null;
	bio: string | null;
	function: string | null;
	location: string;
	stamboek: string | null;
}

export async function updateProfileInfo(
	triggerProfileObjectsDelete: any,
	triggerProfileUpdate: any,
	profile: Avo.User.Profile,
	variables: Partial<UpdateProfileValues>
): Promise<void> {
	try {
		const completeVars = {
			educationLevels: (profile as any).contexts || [],
			subjects: (profile as any).classifications || [],
			organizations: (profile as any).organizations || [],
			alias: profile.alias,
			alternativeEmail: profile.alternative_email,
			avatar: profile.avatar,
			bio: (profile as any).bio || null,
			function: (profile as any).function || null,
			location: profile.location || 'nvt',
			stamboek: profile.stamboek,
			...variables, // Override current profile variables with the variables in the parameter
		};
		await triggerProfileObjectsDelete({
			variables: {
				profileId: profile.id,
			},
		});
		await triggerProfileUpdate({
			variables: {
				profileId: profile.id,
				...completeVars,
			},
		});
	} catch (err) {
		console.error('Failed to update profile information', err, { profile, variables });
		throw err;
	}
}
