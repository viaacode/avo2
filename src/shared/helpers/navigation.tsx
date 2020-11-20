import { TFunction } from 'i18next';
import { isNil, kebabCase, sortBy } from 'lodash-es';
import React from 'react';

import LoginOptionsDropdown from '../../authentication/components/LoginOptionsDropdown';
import PupilOrTeacherDropdown from '../../authentication/components/PupilOrTeacherDropdown';
import { APP_PATH } from '../../constants';
import { AppContentNavElement } from '../services/navigation-items-service';
import { NavigationItemInfo } from '../types';

import { buildLink } from './link';
import { isMobileWidth } from './media-query';

const NAVIGATION_COMPONENTS: { [componentLabel: string]: any } = {
	'<PupilOrTeacherDropdown>': PupilOrTeacherDropdown,
	'<LoginOptionsDropdown>': LoginOptionsDropdown,
};

export type BooleanDictionary = { [id: string]: boolean };

export function getLocation(navItem: AppContentNavElement, t: TFunction): string {
	if (!isNil(navItem.content_id)) {
		// Link to content block page
		return `/${navItem.content_id}/${kebabCase(navItem.label)}`;
	}

	if (navItem.content_path) {
		return navItem.content_path;
	}

	console.error('Failed to generate navigation link for navigation item', { navItem });
	return buildLink(
		APP_PATH.ERROR.route,
		{},
		{
			message: t(
				'shared/helpers/navigation___de-pagina-voor-dit-navigatie-item-kon-niet-worden-gevonden'
			),
			icon: 'search',
		}
	);
}

export function mapNavElementsToNavigationItems(
	navItems: AppContentNavElement[],
	t: TFunction
): NavigationItemInfo[] {
	return sortBy(navItems, 'position').map(
		(navItem: AppContentNavElement): NavigationItemInfo => {
			const navLocation: string = getLocation(navItem, t);

			if (NAVIGATION_COMPONENTS[navLocation]) {
				if (isMobileWidth()) {
					return {
						label: navItem.label,
						icon: navItem.icon_name,
						tooltip: navItem.tooltip,
						location: APP_PATH.REGISTER_OR_LOGIN.route,
						target: '_self',
						key: `nav-item-${navItem.id}`,
					};
				}

				// Show component when clicking this nav item
				const Component = NAVIGATION_COMPONENTS[navLocation];

				return {
					label: navItem.label,
					icon: navItem.icon_name,
					tooltip: navItem.tooltip,
					component: <Component />,
					key: `nav-item-${navItem.id}`,
				};
			}

			// Navigate to link
			return {
				label: navItem.label,
				icon: navItem.icon_name,
				tooltip: navItem.tooltip,
				location: getLocation(navItem, t),
				target: navItem.link_target,
				key: `nav-item-${navItem.id}`,
			};
		}
	);
}
