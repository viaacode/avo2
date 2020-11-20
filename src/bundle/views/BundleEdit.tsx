import React, { FunctionComponent } from 'react';
import { withRouter } from 'react-router';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import CollectionOrBundleEdit from '../../collection/components/CollectionOrBundleEdit';

interface CollectionEditProps extends DefaultSecureRouteProps<{ id: string }> {}

const BundleEdit: FunctionComponent<CollectionEditProps> = (props) => {
	return <CollectionOrBundleEdit {...props} type="bundle" />;
};

export default withRouter(BundleEdit);
