import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { BrowserRouter as Router, Link, MemoryRouter } from 'react-router-dom';

import { APP_PATH } from '../../../constants';
import { getMockRouterProps } from '../../mocks/route-components-props-mock';

import { Navigation } from './Navigation';

const linkLoginState: {
	[routePath: string]: { showWhenLoggedIn: boolean; showWhenLoggedOut: boolean };
} = {
	[APP_PATH.LOGGED_IN_HOME.route]: { showWhenLoggedIn: true, showWhenLoggedOut: false },
	[APP_PATH.SEARCH.route]: { showWhenLoggedIn: true, showWhenLoggedOut: false },
	[APP_PATH.WORKSPACE.route]: { showWhenLoggedIn: true, showWhenLoggedOut: false },
	['/projecten']: { showWhenLoggedIn: true, showWhenLoggedOut: true },
	['/nieuws']: { showWhenLoggedIn: true, showWhenLoggedOut: true },
	['/voor-leerkrachten']: { showWhenLoggedIn: false, showWhenLoggedOut: true },
	['/voor-leerlingen']: { showWhenLoggedIn: false, showWhenLoggedOut: true },
	[APP_PATH.SETTINGS.route]: { showWhenLoggedIn: true, showWhenLoggedOut: false },
	['/help']: { showWhenLoggedIn: true, showWhenLoggedOut: false },
	['/feedback']: { showWhenLoggedIn: true, showWhenLoggedOut: false },
	[APP_PATH.LOGOUT.route]: { showWhenLoggedIn: true, showWhenLoggedOut: false },
	[APP_PATH.REGISTER_OR_LOGIN.route]: { showWhenLoggedIn: false, showWhenLoggedOut: true },
};

function checkLinks(menuItems: ReactWrapper<any, any>, loggedIn: boolean) {
	const links = menuItems.find(Link);

	links.forEach((link) => {
		const to: Location = link.prop('to') as Location;
		if (to) {
			expect(link.text()).toBeTruthy();
			expect(
				Object.values(APP_PATH)
					.map((routeInfo) => routeInfo.route)
					.includes(to.pathname)
			).toEqual(true);
			if (loggedIn) {
				expect(
					linkLoginState[to.pathname].showWhenLoggedIn,
					`Expected nav item to route ${to.pathname} to be visible when logged in`
				).toEqual(true);
			} else {
				expect(linkLoginState[to.pathname].showWhenLoggedOut).toEqual(true);
			}
		} else {
			expect(link.children()).toBeDefined();
			expect(link.children()).toHaveLength(1);
		}
	});
}

const mockProps = getMockRouterProps({});

describe('<Navigation />', () => {
	it('Should be able to render', () => {
		// Render unconnected navigation component (best practice according to react test docs:
		// https://redux.js.org/recipes/writing-tests#connected-components
		mount(
			<MemoryRouter>
				<Navigation {...mockProps} />
			</MemoryRouter>
		);
	});

	it('Should correctly render navbar links when logged out on desktop', () => {
		const navigationComponent = mount(
			<Router>
				<Navigation {...mockProps} />
			</Router>
		);

		const primaryMenuDesktop = navigationComponent.find(
			'.u-mq-switch-main-nav-has-space .c-nav'
		);

		checkLinks(primaryMenuDesktop, false);

		const secondaryMenuDesktop = navigationComponent.find(
			'.u-mq-switch-main-nav-authentication .c-nav'
		);

		checkLinks(secondaryMenuDesktop, false);
	});

	it('Should correctly render navbar links when logged in on desktop', () => {
		const navigationComponent = mount(
			<Router>
				<Navigation {...mockProps} />
			</Router>
		);

		const primaryMenuDesktop = navigationComponent.find(
			'.u-mq-switch-main-nav-has-space .c-nav'
		);

		checkLinks(primaryMenuDesktop, true);

		const secondaryMenuDesktop = navigationComponent.find(
			'.u-mq-switch-main-nav-authentication .c-nav'
		);

		checkLinks(secondaryMenuDesktop, true);
	});
});
