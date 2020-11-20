import { mount } from 'enzyme';
import React from 'react';
import { MemoryRouter } from 'react-router';

import { TopBar } from './TopBar';

describe('<TopBar />', () => {
	it('Should be able to render', () => {
		mount(
			<MemoryRouter>
				<TopBar onClickBackButton={() => window.history.back()} />
			</MemoryRouter>
		);
	});

	it('Should set the correct className', () => {
		const topBarComponent = mount(
			<MemoryRouter>
				<TopBar onClickBackButton={() => window.history.back()} />
			</MemoryRouter>
		);
		expect(topBarComponent.find('div').at(0).hasClass('c-top-bar')).toBeTruthy();
	});

	it('Should render a back button based on `showBackButton` prop', () => {
		const topBarComponentWithButton = mount(
			<MemoryRouter>
				<TopBar onClickBackButton={() => window.history.back()} />
			</MemoryRouter>
		);
		const topBarComponentWithoutButton = mount(
			<MemoryRouter>
				<TopBar />
			</MemoryRouter>
		);
		// Not sure why .find returns 2 buttons, since the html only contains one
		expect(topBarComponentWithButton.find('.c-top-bar__back')).toHaveLength(2);
		expect(topBarComponentWithoutButton.find('.c-top-bar__back')).toHaveLength(0);
	});
});
