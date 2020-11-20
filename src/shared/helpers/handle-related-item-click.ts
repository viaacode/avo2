import { Avo } from '@viaa/avo2-types';

import { generateContentLinkString } from './link';

export function generateRelatedItemLink(relatedItem: Avo.Search.ResultItem) {
	return generateContentLinkString(relatedItem.administrative_type, relatedItem.id);
}
