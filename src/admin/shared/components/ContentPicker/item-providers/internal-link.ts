import { compact, sortBy } from 'lodash-es';

import { APP_PATH, RouteId } from '../../../../../constants';
import { PickerSelectItem } from '../../../types';
import { parsePickerItem } from '../helpers/parse-picker';

// Return InternalLinkItems items from APP_PATH
export const retrieveInternalLinks = async (
	keyword: string | null,
	limit: number
): Promise<PickerSelectItem[]> => {
	const routeOptions: (PickerSelectItem | null)[] = (Object.keys(APP_PATH) as RouteId[]).map(
		(pageId: RouteId): PickerSelectItem | null => {
			if (
				APP_PATH[pageId].showInContentPicker &&
				(!keyword || APP_PATH[pageId].route.includes(keyword))
			) {
				return {
					label: APP_PATH[pageId].route,
					value: parsePickerItem('INTERNAL_LINK', APP_PATH[pageId].route),
				};
			}
			return null;
		}
	);
	return sortBy(compact(routeOptions), 'value').slice(0, limit);
};
