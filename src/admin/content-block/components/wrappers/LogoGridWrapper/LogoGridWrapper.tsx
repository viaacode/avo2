import React, { FunctionComponent } from 'react';

import { AlignOptions, BlockImageGrid, ButtonAction, GridItem } from '@viaa/avo2-components';

import { BlockGridFormatOption, FillOption } from '../../../../shared/types';
import { formatLookup } from '../ImageGridWrapper/ImageGridWrapper';

export interface BlockLogoGridWrapperProps {
	elements: GridItem[];
	format: BlockGridFormatOption;
	itemWidth: number;
	fill?: FillOption;
	textAlign?: AlignOptions;
	className?: string;
	navigate?: (buttonAction: ButtonAction) => void;
}

const BlockLogoGridWrapper: FunctionComponent<BlockLogoGridWrapperProps> = ({
	format = '2:1',
	itemWidth = 400,
	...rest
}) => {
	return <BlockImageGrid {...formatLookup[format]} itemWidth={itemWidth} {...rest} />;
};

export default BlockLogoGridWrapper;
