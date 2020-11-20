import React, { ReactNode } from 'react';

import { SecuredRoute } from '../../authentication/components';
import { PermissionName } from '../../authentication/helpers/permission-names';

import { COLLECTIONS_OR_BUNDLES_PATH } from './collections-or-bundles.const';
import { CollectionsOrBundlesOverview } from './views';

export const renderCollectionOrBundleRoutes = (userPermissions: string[]): ReactNode[] => [
	...(userPermissions.includes(PermissionName.VIEW_COLLECTIONS_OVERVIEW) &&
	(userPermissions.includes(PermissionName.VIEW_ANY_PUBLISHED_COLLECTIONS) ||
		userPermissions.includes(PermissionName.VIEW_ANY_UNPUBLISHED_COLLECTIONS))
		? [
				<SecuredRoute
					key={COLLECTIONS_OR_BUNDLES_PATH.COLLECTIONS_OVERVIEW}
					component={CollectionsOrBundlesOverview}
					exact
					path={COLLECTIONS_OR_BUNDLES_PATH.COLLECTIONS_OVERVIEW}
				/>,
		  ]
		: []),
	...(userPermissions.includes(PermissionName.VIEW_BUNDLES_OVERVIEW) &&
	(userPermissions.includes(PermissionName.VIEW_ANY_PUBLISHED_BUNDLES) ||
		userPermissions.includes(PermissionName.VIEW_ANY_UNPUBLISHED_BUNDLES))
		? [
				<SecuredRoute
					key={COLLECTIONS_OR_BUNDLES_PATH.BUNDLES_OVERVIEW}
					component={CollectionsOrBundlesOverview}
					exact
					path={COLLECTIONS_OR_BUNDLES_PATH.BUNDLES_OVERVIEW}
				/>,
		  ]
		: []),
];
