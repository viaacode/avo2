import classnames from 'classnames';
import React, { FunctionComponent } from 'react';

import { BlockButtons, BlockHeading, BlockIntro, BlockRichText } from '@viaa/avo2-components';

import {
	ContentBlockBackgroundColor,
	ContentBlockComponentState,
	ContentBlockState,
	ContentBlockType,
	RichTextTwoColumnsBlockComponentState,
} from '../../content-block.types';

interface ContentBlockPreviewProps {
	componentState: ContentBlockComponentState | ContentBlockComponentState[];
	blockState: ContentBlockState;
}

const COMPONENT_PREVIEW_MAP = Object.freeze({
	[ContentBlockType.CTAs]: BlockButtons, // TODO: Change to BlockCTAs
	[ContentBlockType.Buttons]: BlockButtons,
	[ContentBlockType.Heading]: BlockHeading,
	[ContentBlockType.Intro]: BlockIntro,
	[ContentBlockType.RichText]: BlockRichText,
	[ContentBlockType.RichTextTwoColumns]: BlockRichText,
});

const ContentBlockPreview: FunctionComponent<ContentBlockPreviewProps> = ({
	componentState,
	blockState,
}) => {
	const PreviewComponent = COMPONENT_PREVIEW_MAP[blockState.blockType];

	// TODO: Make more generic and reusable for other components
	if (blockState.blockType === ContentBlockType.CTAs) {
		return null;
	}

	// TODO: Not sure this is the best place to do this
	if (blockState.blockType === ContentBlockType.RichTextTwoColumns) {
		// Map componentState values correctly for preview component
		const {
			firstColumnContent,
			secondColumnContent,
		} = componentState as RichTextTwoColumnsBlockComponentState;
		(componentState as any).content = [firstColumnContent, secondColumnContent];
	}

	// TODO: Make more generic and reusable for other components
	const renderPreview = () => {
		if (blockState.blockType === ContentBlockType.Buttons) {
			return <PreviewComponent {...({ buttons: componentState } as any)} />;
		}

		return <PreviewComponent {...(componentState as any)} />;
	};

	return (
		// TODO: Extend spacer with paddings in components lib
		// This way we can easily set paddings from a content-blocks componentState
		<div
			className={classnames(`u-bg-${blockState.backgroundColor} u-padding`, {
				'u-color-white': blockState.backgroundColor === ContentBlockBackgroundColor.NightBlue,
			})}
		>
			{renderPreview()}
		</div>
	);
};

export default ContentBlockPreview;