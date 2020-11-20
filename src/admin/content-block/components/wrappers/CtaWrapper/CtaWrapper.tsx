import React, { FunctionComponent } from 'react';

import { BlockCTAs, BlockCTAsProps } from '@viaa/avo2-components';

import { isMobileWidth } from '../../../../../shared/helpers';

const CtaWrapper: FunctionComponent<BlockCTAsProps> = (props) => {
	return <BlockCTAs {...props} width={isMobileWidth() ? '100%' : props.width} />;
};

export default CtaWrapper;
