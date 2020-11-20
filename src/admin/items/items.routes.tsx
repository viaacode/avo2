import React, { ReactNode } from 'react';

import { SecuredRoute } from '../../authentication/components';

import { ITEMS_PATH } from './items.const';
import { ItemDetail, ItemsOverview } from './views';
import PublishItemsOverview from './views/PublishItemsOverview';

export const renderItemRoutes = (): ReactNode[] => [
	<SecuredRoute
		key={ITEMS_PATH.ITEMS_OVERVIEW}
		component={ItemsOverview}
		exact
		path={ITEMS_PATH.ITEMS_OVERVIEW}
	/>,
	<SecuredRoute
		key={ITEMS_PATH.ITEM_DETAIL}
		component={ItemDetail}
		exact
		path={ITEMS_PATH.ITEM_DETAIL}
	/>,
];

export const renderPublishItemRoutes = (): ReactNode[] => [
	<SecuredRoute
		key={ITEMS_PATH.PUBLISH_ITEMS_OVERVIEW}
		component={PublishItemsOverview}
		exact
		path={ITEMS_PATH.PUBLISH_ITEMS_OVERVIEW}
	/>,
];
