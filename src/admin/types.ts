import { IconName } from '@viaa/avo2-components';

// TODO: these should got to the avo2-typings repo
export interface MenuItem {
	id: number;
	label: string;
	icon_name?: IconName;
	description?: string;
	// content_id?: number;
	// group_access?: (number | string)[] | { [key: string]: string }
	// external_link?: string;
	link_target?: string;
	position: number;
	placement: string;
	// created_at: string;
	// updated_at: string;
}
