import { orderBy } from 'lodash-es';
import React, { FunctionComponent } from 'react';

import { Button, Container, Toolbar, ToolbarItem } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { NEW_FRAGMENT } from '../../collection.const';

interface FragmentAddProps {
	index: number;
	collection: Avo.Collection.Collection;
	updateCollection: (collection: Avo.Collection.Collection) => void;
	reorderFragments: (fragments: Avo.Collection.Fragment[]) => Avo.Collection.Fragment[];
}

const FragmentAdd: FunctionComponent<FragmentAddProps> = ({
	index,
	collection,
	updateCollection,
	reorderFragments,
}) => {
	const { collection_fragments, id } = collection;
	const TEXT_BLOCK_FRAGMENT: any = {
		...NEW_FRAGMENT.text,
		id: -collection_fragments.length,
		collection_id: id,
	};

	// Listeners
	const generateNewFragments = (): Avo.Collection.Fragment[] => {
		const newFragments = orderBy([...collection_fragments], 'position', 'asc');

		newFragments.splice(index + 1, 0, TEXT_BLOCK_FRAGMENT);

		return reorderFragments(newFragments);
	};

	const handleAddFragmentClick = () => {
		const generatedFragments = generateNewFragments();

		updateCollection({
			...collection,
			collection_fragments: generatedFragments,
			collection_fragment_ids: generatedFragments.map(({ id: fragmentId }) => fragmentId),
		});
	};

	// Render methods
	const renderDivider = () => (
		<ToolbarItem grow>
			<div className="c-hr" />
		</ToolbarItem>
	);

	return (
		<Container>
			<Toolbar justify>
				{renderDivider()}
				<ToolbarItem>
					<Button
						type="secondary"
						icon="add"
						onClick={handleAddFragmentClick}
						ariaLabel="Sectie toevoegen"
					/>
				</ToolbarItem>
				{renderDivider()}
			</Toolbar>
		</Container>
	);
};

export default FragmentAdd;
