import { IconName } from '@viaa/avo2-components';
import { ReactElement } from 'react';

export enum KeyCode {
	Enter = 13,
}

export type NavigationItemInfo = {
	label: string | ReactElement;
	key: string;
	location?: string;
	exact?: boolean;
	target?: string;
	component?: ReactElement;
	icon?: IconName;
	subLinks?: NavigationItemInfo[];
};

export type ReactSelectOption<T = any> = {
	label: string;
	value: T;
};

export type ReactAction<T, P = any> = {
	type: T;
	payload: P;
};

// Helpers

// Get all possible values from object
export type ValueOf<T> = T[keyof T];
