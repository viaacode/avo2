import React, { ReactNode } from 'react';

import { SecuredRoute } from '../../authentication/components';

import { CONTENT_PATH } from './content.const';
import { ContentDetail, ContentEdit, ContentOverview } from './views';

export const renderAdminContentRoutes = (): ReactNode[] => [
	<SecuredRoute
		key={CONTENT_PATH.CONTENT_PAGE_OVERVIEW}
		component={ContentOverview}
		exact
		path={CONTENT_PATH.CONTENT_PAGE_OVERVIEW}
	/>,
	<SecuredRoute
		key={CONTENT_PATH.CONTENT_PAGE_CREATE}
		component={ContentEdit}
		exact
		path={CONTENT_PATH.CONTENT_PAGE_CREATE}
	/>,
	<SecuredRoute
		key={CONTENT_PATH.CONTENT_PAGE_DETAIL}
		component={ContentDetail}
		exact
		path={CONTENT_PATH.CONTENT_PAGE_DETAIL}
	/>,
	<SecuredRoute
		key={CONTENT_PATH.CONTENT_PAGE_EDIT}
		component={ContentEdit}
		exact
		path={CONTENT_PATH.CONTENT_PAGE_EDIT}
	/>,
];
