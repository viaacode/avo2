import { Avo } from '@viaa/avo2-types';

import i18n from '../../../../shared/translations/i18n';

import { parsePickerItem } from '..';
import { fetchContentItems } from '../../content.service';
import { PickerSelectItem, PickerSelectItemGroup } from '../../content.types';

// Fetch content items from GQL
export const fetchContentPages = async (limit: number = 5): Promise<PickerSelectItemGroup> => {
	const contentItems: Avo.Content.Content[] | null = await fetchContentItems(limit);

	return parseContentPages(contentItems || []);
};

// Parse raw content items to react-select options
const parseContentPages = (raw: Avo.Content.Content[]): PickerSelectItemGroup => {
	const parsedContentItems = raw.map(
		(item: Avo.Content.Content): PickerSelectItem => ({
			label: item.title,
			value: parsePickerItem('CONTENT_PAGE', item.path),
		})
	);

	return {
		label: i18n.t("Content pagina's"),
		options: parsedContentItems,
	};
};
