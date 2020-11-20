import { Action } from 'redux';

import { createReducer } from './create-reducer';

interface AddAction extends Action {
	value: number;
}

describe('helpers > redux > createReducer', () => {
	it('Should correctly create a callable reducer', () => {
		const reducer = createReducer<Number[]>([], {
			add: (state, action: AddAction) => [...state, action.value],
			subtract: (state) => state.slice(0, -1),
			clear: () => [],
		});

		expect(reducer([], { type: 'add', value: 5 })).toEqual([5]);
		expect(reducer([1, 2, 3], { type: 'add', value: 4 })).toEqual([1, 2, 3, 4]);
		expect(reducer([1, 2, 3], { type: 'subtract' })).toEqual([1, 2]);
		expect(reducer([1, 2, 3], { type: 'clear' })).toEqual([]);
	});
});
