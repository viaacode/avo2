import { createBrowserHistory } from 'history';

import { NavigationParams } from '../components/Navigation/Navigation';

/**
 * This is to mock out the dependencies for react router
 */
export function getMockRouterProps(data: any) {
	const location = {
		hash: '',
		key: '',
		pathname: '',
		search: '',
		state: {},
	};

	const props: NavigationParams = {
		location,
		match: {
			isExact: true,
			params: data,
			path: '',
			url: '',
		},
		history: createBrowserHistory(),
		staticContext: {},
		loginState: {} as any,
		loginStateLoading: false,
		loginStateError: false,
		getLoginState: () => ({} as any),
	};

	return props;
}
