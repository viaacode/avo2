import React, { FunctionComponent } from 'react';

import { BlockRichText, BlockRichTextProps } from '@viaa/avo2-components';

const RichTextWrapper: FunctionComponent<
	Omit<BlockRichTextProps, 'maxTextWidth'> & {
		limitWidth?: boolean;
	}
> = ({ limitWidth, ...rest }) => {
	return <BlockRichText {...rest} {...(limitWidth ? { maxTextWidth: '800px' } : {})} />;
};

export default RichTextWrapper;
