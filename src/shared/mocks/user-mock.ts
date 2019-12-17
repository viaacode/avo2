import { Avo } from '@viaa/avo2-types';

const mockUser: Avo.User.User = {
	id: 64,
	first_name: 'Bert',
	last_name: 'Verhelst',
	created_at: '2019-10-23T16:21:17.984884+00:00',
	expires_at: null,
	external_uid: null,
	role_id: 1,
	role: { id: 1, label: 'Administrator', name: 'admin' },
	type: null,
	uid: '517aec71-cf0e-4e08-99d1-8e7e042923f7',
	updated_at: '2019-10-23T16:21:17.984884+00:00',
	mail: 'bert.verhelst@studiohyperdrive.be',
	organisation_id: null,
	// idpmaps: [],
	profile: {
		id: '69ccef3b-751a-4be4-95bc-5ef365fbd504',
		alias: 'bert',
		alternative_email: 'verhelstbert@gmail.com',
		avatar: null,
		created_at: '2019-10-23T16:22:47.543339+00:00',
		location: 'nvt',
		stamboek: '97436428856',
		// bio: 'bert de shd developer',
		// function: 'developer',
		updated_at: '2019-10-23T16:22:47.543339+00:00',
		user_id: '517aec71-cf0e-4e08-99d1-8e7e042923f7',
		// profile_user_group: null,
		// educationLevels: ['Lager onderwijs', 'Hoger onderwijs'],
		// subjects: ['lichamelijke opvoeding', 'sociale vaardigheden'],
		// organizations: [],
		user: {} as any,
		permissions: [],
	},
};

export default mockUser;
