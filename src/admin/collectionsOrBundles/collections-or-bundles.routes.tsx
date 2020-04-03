import React, { ReactNode } from 'react';

import { SecuredRoute } from '../../authentication/components';

import { COLLECTIONS_OR_BUNDLES_PATH } from './collections-or-bundles.const';
import { CollectionsOrBundlesOverview } from './views';

export const renderCollectionOrBundleRoutes = (userPermissions: string[]): ReactNode[] => [
	...(userPermissions.includes('VIEW_COLLECTIONS_OVERVIEW')
		? [
				<SecuredRoute
					key={COLLECTIONS_OR_BUNDLES_PATH.COLLECTIONS_OVERVIEW}
					component={CollectionsOrBundlesOverview}
					exact
					path={COLLECTIONS_OR_BUNDLES_PATH.COLLECTIONS_OVERVIEW}
				/>,
		  ]
		: []),
	...(userPermissions.includes('VIEW_BUNDLES_OVERVIEW')
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
