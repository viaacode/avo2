import { PermissionGroup } from '../permission-groups/permission-group.types';
import { FilterableTableState } from '../shared/components/FilterTable/FilterTable';

export interface UserGroup {
	id: number;
	label: string;
	description: string | null;
	created_at: string;
	updated_at: string;
	permissionGroups: PermissionGroup[];
}

export interface UserGroupEditFormErrorState {
	label?: string;
	description?: string;
}

export interface UserGroupTableState extends FilterableTableState {
	label: string;
	description: string;
	created_at: string;
	updated_at: string;
}

export type UserGroupOverviewTableCols =
	| 'label'
	| 'description'
	| 'created_at'
	| 'updated_at'
	| 'actions';

export type PermissionGroupTableCols =
	| 'label'
	| 'description'
	| 'created_at'
	| 'updated_at'
	| 'actions';

export interface UserGroup {
	id: number;
	label: string;
}
