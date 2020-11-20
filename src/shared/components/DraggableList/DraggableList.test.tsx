import { mount, shallow } from 'enzyme';
import React from 'react';

import DraggableList from './DraggableList';

const mockItems = [
	{ label: 'Element 1', id: 'elem-1' },
	{ label: 'Element 2', id: 'elem-2' },
];

const renderItem = (item: any) => <div key={item.id}>{item.label}</div>;

describe('<DraggableList />', () => {
	it('Should be able to render', () => {
		shallow(
			<DraggableList
				renderItem={renderItem}
				items={mockItems}
				onListChange={() => {}}
				generateKey={(item: any) => item.id}
			/>
		);
	});

	it('Should set the correct className', () => {
		const draggableListComponent = shallow(
			<DraggableList
				renderItem={renderItem}
				items={mockItems}
				onListChange={() => {}}
				generateKey={(item: any) => item.id}
			/>
		);

		expect(draggableListComponent.hasClass('c-table-view')).toEqual(true);
	});

	it('Should correctly pass children', () => {
		const draggableListComponent = mount(
			<DraggableList
				renderItem={renderItem}
				items={mockItems}
				onListChange={() => {}}
				generateKey={(item: any) => item.id}
			/>
		);

		const draggableListItems = draggableListComponent.find('.c-table-view__item');

		expect(draggableListItems).toHaveLength(mockItems.length);
	});

	// TODO expose internal state for tests using onDragStart and onDragEnd handlers
	// it('Should initialize with null as currentlyBeingDragged state', () => {
	// 	const draggableListComponent = mount(
	// 		<DraggableList
	// 			renderItem={renderItem}
	// 			items={mockItems}
	// 			onListChange={() => {}}
	// 			generateKey={(item: any) => item.id}
	// 		/>
	// 	);
	//
	// 	expect(draggableListComponent.state('currentlyBeingDragged')).toEqual(null);
	// });
	//
	// it('Should initialize with null as currentlyBeingDragged state', () => {
	// 	const draggableListComponent = mount(
	// 		<DraggableList
	// 			renderItem={renderItem}
	// 			items={mockItems}
	// 			onListChange={() => {}}
	// 			generateKey={(item: any) => item.id}
	// 		/>
	// 	);
	//
	// 	expect(draggableListComponent.state('currentlyBeingDragged')).toEqual(null);
	// });
	//
	// it('Should set currentlyBeingDragged state on onDragStart', () => {
	// 	const draggableListComponent = mount(
	// 		<DraggableList
	// 			renderItem={renderItem}
	// 			items={mockItems}
	// 			onListChange={() => {}}
	// 			generateKey={(item: any) => item.id}
	// 		/>
	// 	);
	//
	// 	const draggableListItems = draggableListComponent.find('.c-table-view__item');
	// 	draggableListItems.at(1).simulate('dragstart');
	//
	// 	expect(draggableListComponent.state('currentlyBeingDragged')).toEqual(mockItems[1]);
	// });
	//
	// it('Should clear currentlyBeingDragged state on onDragEnd', () => {
	// 	const draggableListComponent = mount(
	// 		<DraggableList
	// 			renderItem={renderItem}
	// 			items={mockItems}
	// 			onListChange={() => {}}
	// 			generateKey={(item: any) => item.id}
	// 		/>
	// 	);
	//
	// 	const draggableListItems = draggableListComponent.find('.c-table-view__item');
	// 	draggableListItems.at(1).simulate('dragstart');
	// 	draggableListItems.at(1).simulate('dragend');
	//
	// 	expect(draggableListComponent.state('currentlyBeingDragged')).toEqual(null);
	// });
});
