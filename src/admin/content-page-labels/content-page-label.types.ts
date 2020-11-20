import { Avo } from '@viaa/avo2-types';

import { FilterableTableState } from '../shared/components/FilterTable/FilterTable';
import { PickerItem } from '../shared/types';

export type ContentPageLabelOverviewTableCols =
	| 'label'
	| 'content_type'
	| 'link_to'
	| 'created_at'
	| 'updated_at'
	| 'actions';

export interface ContentPageLabel {
	id: number;
	label: string;
	content_type: Avo.ContentPage.Type;
	link_to: PickerItem | null;
	created_at: string;
	updated_at: string;
}

export interface ContentPageLabelEditFormErrorState {
	label?: string;
	content_type?: string;
	link_to?: string;
}

export interface ContentPageLabelTableState extends FilterableTableState {
	label: string;
	content_type: Avo.ContentPage.Type | null;
	link_to: PickerItem | null;
	created_at: string;
	updated_at: string;
}
