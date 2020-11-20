import React, { FC, FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
	BlockHeading,
	Button,
	ButtonAction,
	ButtonType,
	Column,
	Grid,
	IconName,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import {
	PermissionName,
	PermissionService,
} from '../../../../../authentication/helpers/permission-service';
import { navigateToContentType } from '../../../../../shared/helpers';
import withUser, { UserProps } from '../../../../../shared/hocs/withUser';
import { AlignOption, HeadingTypeOption } from '../../../../shared/types';
import MediaPlayerWrapper from '../MediaPlayerWrapper/MediaPlayerWrapper';
import RichTextWrapper from '../RichTextWrapper/RichTextWrapper';

interface MediaPlayerTitleTextButtonWrapperProps {
	mediaItem: ButtonAction;
	mediaSrc?: string;
	mediaPoster?: string;
	mediaTitle: string;
	mediaIssued?: string;
	mediaOrganisation?: Avo.Organization.Organization;
	mediaAutoplay?: boolean;
	headingType: HeadingTypeOption;
	headingTitle: string;
	content: string;
	buttonLabel: string;
	buttonIcon?: IconName;
	buttonType?: ButtonType;
	buttonAction?: ButtonAction;
	align: AlignOption;
}

export const MediaPlayerTitleTextButtonWrapper: FC<
	MediaPlayerTitleTextButtonWrapperProps & RouteComponentProps & UserProps
> = ({
	mediaItem,
	mediaSrc,
	mediaPoster,
	mediaTitle,
	mediaIssued,
	mediaOrganisation,
	headingTitle,
	headingType,
	content,
	buttonIcon,
	buttonLabel,
	buttonType,
	buttonAction,
	history,
	align,
	mediaAutoplay,
	user,
}) => {
	const shouldTitleLink =
		PermissionService.hasPerm(user, PermissionName.VIEW_ANY_PUBLISHED_ITEMS) && !!mediaItem;

	return (
		<Grid className="c-item-video-description">
			<Column size="2-7">
				<MediaPlayerWrapper
					item={mediaItem}
					title={mediaTitle}
					autoplay={mediaAutoplay}
					src={mediaSrc}
					poster={mediaPoster}
					issued={mediaIssued}
					organisation={mediaOrganisation}
				/>
			</Column>
			<Column size="2-5" className={`u-text-${align}`}>
				<BlockHeading
					type={headingType}
					onClick={
						shouldTitleLink
							? () => navigateToContentType(mediaItem, history)
							: undefined
					}
					className={shouldTitleLink ? 'u-clickable' : ''}
				>
					{headingTitle}
				</BlockHeading>
				<RichTextWrapper elements={{ content }} />
				{buttonAction && (
					<Button
						icon={buttonIcon}
						label={buttonLabel}
						type={buttonType}
						onClick={() => {
							navigateToContentType(buttonAction, history);
						}}
					/>
				)}
			</Column>
		</Grid>
	);
};

export default compose(
	withRouter,
	withUser
)(MediaPlayerTitleTextButtonWrapper) as FunctionComponent<MediaPlayerTitleTextButtonWrapperProps>;
