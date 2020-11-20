import { action } from '@storybook/addon-actions';
import { mount, shallow } from 'enzyme';
import React from 'react';

import BooleanCheckboxDropdown from './BooleanCheckboxDropdown';

describe('<BooleanCheckboxDropdown />', () => {
	it('Should be able to render', () => {
		shallow(
			<BooleanCheckboxDropdown
				label="Deleted"
				id="is_deleted"
				value={null}
				onChange={action('CheckboxDropdown changed')}
			/>
		);
	});

	it('Should call `onChange` when toggling checkbox', () => {
		const onChangeHandler = jest.fn();

		const checkboxDropdownComponent = mount(
			<BooleanCheckboxDropdown
				label="Deleted"
				id="is_deleted"
				value={null}
				onChange={onChangeHandler}
			/>
		);

		const checkboxes = checkboxDropdownComponent.find('[type="checkbox"]');
		const button = checkboxDropdownComponent
			.find('.c-button.c-button--block.c-button--primary')
			.at(0);

		checkboxes.at(0).simulate('change', { target: { checked: true } });
		button.simulate('click');

		expect(onChangeHandler).toBeCalledWith(true, 'is_deleted');

		checkboxes.at(1).simulate('change', { target: { checked: true } });
		button.simulate('click');

		expect(onChangeHandler).toBeCalledWith(null, 'is_deleted');

		checkboxes.at(0).simulate('change', { target: { checked: false } });
		button.simulate('click');

		expect(onChangeHandler).toBeCalledWith(false, 'is_deleted');

		checkboxes.at(1).simulate('change', { target: { checked: false } });
		button.simulate('click');

		expect(onChangeHandler).toBeCalledWith(null, 'is_deleted');
	});
});
