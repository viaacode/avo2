import React, { FunctionComponent, useState } from 'react';

import {
	BlockImage,
	BlockImageProps,
	BlockImageTitleTextButton,
	BlockImageTitleTextButtonProps,
	BlockIntro,
	BlockIntroProps,
	BlockLinks,
	BlockLinksProps,
	BlockQuote,
	BlockQuoteProps,
	BlockSubtitle,
	BlockSubtitleProps,
	BlockText,
	BlockTextProps,
	BlockTitle,
	BlockTitleImageText,
	BlockTitleImageTextProps,
	BlockTitleProps,
	BlockVideo,
	BlockVideoProps,
	BlockVideoTitleTextButton,
	BlockVideoTitleTextButtonProps,
} from '@viaa/avo2-components';

import { Avo } from '@viaa/avo2-types';
import { orderBy } from 'lodash-es';
import { generateContentLinkString } from '../../shared/helpers/generateLink';
import { fetchPlayerTicket } from '../../shared/services/player-ticket-service';
import toastService, { TOAST_TYPE } from '../../shared/services/toast-service';
import { isVideoFragment } from '../helpers';
import { ContentBlockInfo, ContentBlockType, ContentTypeString } from '../types';

interface CollectionFragmentsDetailProps {
	collectionFragments: Avo.Collection.Fragment[];
}

/**
 * Renders the collection body with all of its fragments for the detail page
 * The bottom meta data is not included in the component
 * @param props CollectionFragmentsDetailProps
 * @constructor
 */
const CollectionFragmentsDetail: FunctionComponent<CollectionFragmentsDetailProps> = ({
	collectionFragments,
}) => {
	const [playerTicket, setPlayerTicket] = useState<string | undefined>();

	const getFragmentField = (fragment: Avo.Collection.Fragment, field: string) =>
		fragment.use_custom_fields
			? (fragment as any)[`custom_${field}`]
			: (fragment as any).item_meta[field];

	const getCollectionFragmentInfos = (): ContentBlockInfo[] => {
		const collectionFragmentInfos: ContentBlockInfo[] = [];

		const fragments = orderBy([...collectionFragments], 'position', 'asc') || [];

		fragments.forEach((fragment: Avo.Collection.Fragment) => {
			const initFlowPlayer = () =>
				!playerTicket &&
				fetchPlayerTicket(fragment.external_id)
					.then(data => setPlayerTicket(data))
					.catch(() => toastService('Play ticket kon niet opgehaald worden.', TOAST_TYPE.DANGER));

			if (isVideoFragment(fragment)) {
				initFlowPlayer();
			}

			const contentBlocks: {
				[contentBlockName: string]: {
					type: ContentBlockType;
					content: BlockVideoTitleTextButtonProps | BlockIntroProps;
				};
			} = {
				videoTitleText: {
					type: ContentBlockType.VideoTitleTextButton,
					content: {
						title: getFragmentField(fragment, 'title'),
						text: getFragmentField(fragment, 'description'),
						titleLink: generateContentLinkString(ContentTypeString.video, fragment.external_id),
						videoSource: playerTicket,
					},
				},
				titleText: {
					type: ContentBlockType.Intro,
					content: {
						subtitle: getFragmentField(fragment, 'title'),
						text: getFragmentField(fragment, 'description'),
					},
				},
			};

			const currentContentBlock = isVideoFragment(fragment)
				? contentBlocks.videoTitleText
				: contentBlocks.titleText;

			collectionFragmentInfos.push({
				blockType: currentContentBlock.type,
				content: currentContentBlock.content,
			});
		});
		return collectionFragmentInfos;
	};

	const renderCollectionFragments = () => {
		return getCollectionFragmentInfos().map((contentBlock: ContentBlockInfo, index: number) => {
			return (
				<li className="c-collection-list__item" key={`content-block-${index}`}>
					{renderCollectionFragment(contentBlock)}
				</li>
			);
		});
	};

	const renderCollectionFragment = (collectionFragment: ContentBlockInfo) => {
		const {
			Image,
			ImageTitleTextButton,
			Intro,
			Links,
			Quote,
			RichText,
			Subtitle,
			Title,
			Video,
			TitleImageText,
			VideoTitleTextButton,
		} = ContentBlockType;
		const { content, blockType } = collectionFragment;

		switch (blockType) {
			case Image:
				return <BlockImage {...content as BlockImageProps} />;
			case ImageTitleTextButton:
				return <BlockImageTitleTextButton {...content as BlockImageTitleTextButtonProps} />;
			case Intro:
				return <BlockIntro {...content as BlockIntroProps} />;
			case Links:
				return <BlockLinks {...content as BlockLinksProps} />;
			case Quote:
				return <BlockQuote {...content as BlockQuoteProps} />;
			case RichText:
				return <BlockText {...content as BlockTextProps} />;
			case Subtitle:
				return <BlockSubtitle {...content as BlockSubtitleProps} />;
			case Title:
				return <BlockTitle {...content as BlockTitleProps} />;
			case TitleImageText:
				return <BlockTitleImageText {...content as BlockTitleImageTextProps} />;
			case Video:
				return <BlockVideo {...content as BlockVideoProps} />;
			case VideoTitleTextButton:
				return <BlockVideoTitleTextButton {...content as BlockVideoTitleTextButtonProps} />;
			default:
				toastService(`Failed to find contentBlock type: ${blockType}`, TOAST_TYPE.DANGER);
				return null;
		}
	};

	return <ul className="c-collection-list">{renderCollectionFragments()}</ul>;
};

export default CollectionFragmentsDetail;
