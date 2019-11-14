import { orderBy } from 'lodash-es';
import React, { FunctionComponent } from 'react';

import { Button, Container, Toolbar, ToolbarItem } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ContentBlockType } from '../collection.types';

const COLLECTION_CONTENT_BLOCKS = ['RichText'];

interface FragmentAddProps {
	index: number;
	collection: Avo.Collection.Collection;
	updateCollection: (collection: Avo.Collection.Collection) => void;
	reorderFragments: (fragments: Avo.Collection.Fragment[]) => Avo.Collection.Fragment[];
}

const fragmentsDefaults = {
	TEXT: {
		id: null,
		collection_id: null,
		position: 1,
		external_id: '',
		custom_description: '',
		custom_title: '',
		end_oc: null,
		start_oc: null,
		use_custom_fields: true,
	},
};

const FragmentAdd: FunctionComponent<FragmentAddProps> = ({
	index,
	collection,
	updateCollection,
	reorderFragments,
}) => {
	const TEXT_BLOCK_FRAGMENT: any = {
		...fragmentsDefaults.TEXT,
		id: -collection.collection_fragments.length,
		collection_id: collection.id,
	};

	const addFragment = (index: number, contentBlockType: ContentBlockType) => {
		const newFragments = orderBy([...collection.collection_fragments], 'position', 'asc');

		switch (contentBlockType) {
			case ContentBlockType.RichText:
				newFragments.splice(index + 1, 0, TEXT_BLOCK_FRAGMENT);
				break;
			default:
				// TODO: Could not add fragment because unknown type.
				break;
		}

		const positionedFragments = reorderFragments(newFragments);

		updateCollection({
			...collection,
			collection_fragments: positionedFragments,
			collection_fragment_ids: positionedFragments.map(fragment => fragment.id),
		});
	};

	return (
		<Container>
			<Toolbar justify>
				<ToolbarItem grow>
					<div className="c-hr" />
				</ToolbarItem>
				<ToolbarItem>
					{COLLECTION_CONTENT_BLOCKS.length > 1 ? null : (
						<Button
							type="secondary"
							icon="add"
							onClick={() => addFragment(index, ContentBlockType.RichText)}
							ariaLabel="Sectie toevoegen"
						/>
					)}
				</ToolbarItem>
				<ToolbarItem grow>
					<div className="c-hr" />
				</ToolbarItem>
			</Toolbar>
		</Container>
	);
};

export default FragmentAdd;
