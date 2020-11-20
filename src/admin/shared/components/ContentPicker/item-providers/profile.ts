import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../../../../shared/helpers';
import { UserService } from '../../../../users/user.service';
import { PickerSelectItem } from '../../../types';
import { parsePickerItem } from '../helpers/parse-picker';

// Fetch profiles from GQL
export const retrieveProfiles = async (
	name: string | null,
	limit: number = 5
): Promise<PickerSelectItem[]> => {
	try {
		const response: [Avo.User.Profile[], number] = await UserService.getProfiles(
			0,
			'last_access_at',
			'desc',
			!!name
				? {
						_or: [
							// TODO replace with full_name after https://meemoo.atlassian.net/browse/DEV-1301
							{ first_name: { _ilike: `%${name}%` } },
							{ last_name: { _ilike: `%${name}%` } },
							// { full_name: { _ilike: `%${name}%` } },
							{ mail: { _ilike: `%${name}%` } },
						],
				  }
				: undefined,
			limit
		);
		return parseProfiles(response[0]);
	} catch (err) {
		throw new CustomError('Failed to get profiles for content picker', err, { name, limit });
	}
};

// Convert profiles to react-select options
const parseProfiles = (profiles: Avo.User.Profile[]): PickerSelectItem[] => {
	return profiles.map(
		(profile): PickerSelectItem => ({
			label: `${profile.user.full_name} (${profile.user.mail})`,
			value: parsePickerItem('PROFILE', profile.id),
		})
	);
};
