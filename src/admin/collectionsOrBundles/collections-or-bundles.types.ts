import { FilterableTableState } from '../shared/components/FilterTable/FilterTable';

export type CollectionsOrBundlesOverviewTableCols =
	| 'title'
	| 'owner_profile_id'
	| 'author_user_group'
	| 'last_updated_by_profile'
	| 'created_at'
	| 'updated_at'
	| 'is_public'
	| 'labels'
	| 'views'
	| 'bookmarks'
	| 'copies'
	| 'in_bundle'
	| 'in_assignment'
	| 'subjects'
	| 'education_levels'
	| 'collection_labels'
	| 'actions';

export interface CollectionsOrBundlesTableState extends FilterableTableState {
	title: string;
	author: string;
	author_user_group: string;
	last_updated_by_profile: string;
	created_at: string;
	updated_at: string;
	is_public: boolean;
	labels: string[];
	views: number;
	bookmarks: number;
	copies: number;
	in_bundle: boolean;
	in_assignment: boolean;
	subjects: string[];
	education_levels: string[];
	collection_labels: string[];
	is_copy: boolean;
}

export type CollectionBulkAction =
	| 'publish'
	| 'depublish'
	| 'delete'
	| 'change_author'
	| 'change_labels';
