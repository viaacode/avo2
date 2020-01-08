import { ContentBlockConfig } from '../content-block/content-block.types';

export enum PageType {
	Create = 'create',
	Edit = 'edit',
}

export type ContentOverviewTableCols =
	| 'title'
	| 'content_type'
	| 'author'
	| 'role'
	| 'publish_at'
	| 'depublish_at'
	| 'created_at'
	| 'updated_at'
	| 'actions';

export type ContentParams = { id: string };

export interface ContentEditFormState {
	title: string;
	description: string;
	contentType: string;
	publishAt: string;
	depublishAt: string;
}

export interface ContentTypesResponse {
	value: string;
}

export interface ContentEditState {
	contentBlockConfigs: ContentBlockConfig[];
}

export enum ContentEditActionType {
	ADD_CB_CONFIG = '@@admin-content-edit/ADD_CB_CONFIG',
	SET_CB_CONFIGS = '@@admin-content-edit/SET_CB_CONFIGS',
	ADD_COMPONENTS_STATE = '@@admin-content-edit/ADD_COMPONENTS_STATE',
	SET_COMPONENTS_STATE = '@@admin-content-edit/SET_COMPONENTS_STATE',
	SET_BLOCK_STATE = '@@admin-content-edit/SET_BLOCK_STATE',
}

export interface ContentEditAction {
	type: ContentEditActionType;
	payload: any;
}
