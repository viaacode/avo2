import { shallow } from 'enzyme';
import React from 'react';

import { TopBar } from './TopBar';

describe('<TopBar />', () => {
	const topBarComponent = shallow(<TopBar showBackButton />);

	it('Should be able to render', () => {
		shallow(<TopBar showBackButton />);
	});

	it('Should set the correct className', () => {
		expect(topBarComponent.hasClass('c-top-bar')).toBeTruthy();
	});

	it('Should render a back button based on `showBackButton` prop', () => {
		expect(topBarComponent.find('.c-top-bar__back')).toHaveLength(1);
		topBarComponent.setProps({ showBackButton: false });
		expect(topBarComponent.find('.c-top-bar__back')).toHaveLength(0);
	});
});
