import React, { FunctionComponent } from 'react';

import { AlignOptions, BlockImageGrid, ButtonAction, GridItem } from '@viaa/avo2-components';

import { BlockGridFormatOption, FillOption } from '../../../../shared/types';

export interface BlockImageGridWrapperProps {
	elements: GridItem[];
	format: BlockGridFormatOption;
	fill?: FillOption;
	textAlign?: AlignOptions;
	className?: string;
	navigate?: (buttonAction: ButtonAction) => void;
}

export const formatLookup: {
	/* eslint-disable @typescript-eslint/no-unused-vars */
	[format in BlockGridFormatOption]: {
		/* eslint-enable @typescript-eslint/no-unused-vars */
		imageWidth: number;
		imageHeight: number;
		itemWidth: number;
	};
} = {
	squareSmall: { imageWidth: 200, imageHeight: 200, itemWidth: 200 },
	squareLarge: { imageWidth: 275, imageHeight: 275, itemWidth: 275 },
	'4:3': { imageWidth: 400, imageHeight: 300, itemWidth: 400 },
	'2:1': { imageWidth: 200, imageHeight: 100, itemWidth: 200 },
	'6:9': { imageWidth: 400, imageHeight: 225, itemWidth: 400 },
	'400x150': { imageWidth: 400, imageHeight: 150, itemWidth: 400 },
};

const BlockImageGridWrapper: FunctionComponent<BlockImageGridWrapperProps> = ({
	format = 'squareLarge',
	...rest
}) => {
	return <BlockImageGrid {...formatLookup[format]} {...rest} />;
};

export default BlockImageGridWrapper;
