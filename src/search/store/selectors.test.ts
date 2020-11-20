import moment from 'moment';

import { Avo } from '@viaa/avo2-types';

import { LoginMessage } from '../../authentication/authentication.types';
import { AppState } from '../../store';

import {
	selectSearch,
	selectSearchError,
	selectSearchLoading,
	selectSearchResults,
} from './selectors';

describe('search > store > selectors', () => {
	const store: AppState = {
		loginState: {
			data: {
				message: LoginMessage.LOGGED_IN,
				userInfo: {} as Avo.User.User,
				acceptedConditions: true,
				sessionExpiresAt: moment().add(1, 'days').toString(),
			},
			loading: false,
			error: false,
		},
		search: {
			data: { results: [], count: 0, aggregations: {} },
			loading: false,
			error: false,
		},
	};

	it('Should get the search tree from the store', () => {
		expect(selectSearch(store)).toMatchObject(store.search);
	});

	it('Should get the search error-state from the store', () => {
		expect(selectSearchError(store)).toEqual(false);
	});

	it('Should get the search loading-state from the store', () => {
		expect(selectSearchLoading(store)).toEqual(false);
	});

	it('Should get the search results from the store', () => {
		expect(selectSearchResults(store)).toMatchObject(store.search.data as any);
	});
});
