import React, { FunctionComponent } from 'react';

import { AlignOptions, BlockImageGrid, ButtonAction, GridItem } from '@viaa/avo2-components';

export interface BlockUspGridWrapperProps {
	elements: GridItem[];
	textAlign?: AlignOptions;
	className?: string;
	navigate?: (buttonAction: ButtonAction) => void;
}

const BlockUspGridWrapper: FunctionComponent<BlockUspGridWrapperProps> = ({ ...rest }) => {
	return (
		<div style={{ width: 'calc(100% + 124px)', marginLeft: '-62px' }}>
			<BlockImageGrid
				imageWidth={325}
				imageHeight={86}
				itemWidth={325}
				horizontalMargin={124}
				verticalMargin={82}
				textSize={21}
				textMargin={20}
				textWeight={500}
				fill="contain"
				{...rest}
			/>
		</div>
	);
};

export default BlockUspGridWrapper;
