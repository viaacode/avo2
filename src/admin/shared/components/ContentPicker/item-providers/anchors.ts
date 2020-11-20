import { LinkTarget } from '@viaa/avo2-components';

import { CustomError } from '../../../../../shared/helpers';
import { PickerSelectItem } from '../../../types';

export const retrieveAnchors = async (
	name: string | null,
	limit: number = 5
): Promise<PickerSelectItem[]> => {
	try {
		const anchorIds: string[] = [];
		document.querySelectorAll('[data-anchor]').forEach((block) => {
			const anchorId = block.getAttribute('data-anchor');
			if (anchorId) {
				anchorIds.push(anchorId);
			}
		});
		return parseAnchors(anchorIds);
	} catch (err) {
		throw new CustomError('Failed to get anchor links for content picker', err, {
			name,
			limit,
		});
	}
};

// Convert anchors to react-select options
const parseAnchors = (anchorIds: string[]): PickerSelectItem[] => {
	return anchorIds.map(
		(anchorId): PickerSelectItem => ({
			label: anchorId,
			value: {
				type: 'ANCHOR_LINK',
				value: anchorId,
				label: anchorId,
				target: LinkTarget.Self,
			},
		})
	);
};
