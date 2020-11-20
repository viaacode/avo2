import React, { FunctionComponent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
	BlockHeading,
	Box,
	Button,
	Flex,
	FlexItem,
	Modal,
	ModalBody,
	Spacer,
	TextInput,
} from '@viaa/avo2-components';

import { getProfileName } from '../../../authentication/helpers/get-profile-info';
import { toDutchContentType } from '../../../collection/collection.types';
import { copyToClipboard } from '../../helpers';
import withUser, { UserProps } from '../../hocs/withUser';
import { ToastService } from '../../services';
import { CampaignMonitorService, EmailTemplateType } from '../../services/campaign-monitor-service';
import { trackEvents } from '../../services/event-logging-service';

import './ShareThroughEmailModal.scss';

interface AddToCollectionModalProps {
	modalTitle: string;
	type: EmailTemplateType;
	emailLinkHref: string;
	emailLinkTitle: string;
	isOpen: boolean;
	onClose: () => void;
}

const ShareThroughEmailModal: FunctionComponent<AddToCollectionModalProps & UserProps> = ({
	modalTitle,
	type,
	emailLinkHref,
	emailLinkTitle,
	isOpen,
	onClose,
	user,
}) => {
	const [t] = useTranslation();

	const [emailAddress, setEmailAddress] = useState<string>('');
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	const copyLink = () => {
		copyToClipboard(emailLinkHref);

		trackEvents(
			{
				object: (emailLinkHref.split('/').pop() || '').split('?')[0] || '',
				object_type: type,
				message: `${getProfileName(user)} heeft een ${toDutchContentType(
					type
				)} url gekopieerd`,
				action: 'share',
			},
			user
		);

		ToastService.success(
			t(
				'shared/components/share-through-email-modal/share-through-email-modal___de-url-is-naar-het-klembord-gekopieerd'
			)
		);
	};

	const sendEmail = async () => {
		try {
			setIsProcessing(true);
			await CampaignMonitorService.shareThroughEmail(
				emailAddress,
				emailLinkTitle,
				emailLinkHref,
				type
			);

			trackEvents(
				{
					object: (emailLinkHref.split('/').pop() || '').split('?')[0] || '',
					object_type: type,
					message: `${getProfileName(user)} heeft een ${toDutchContentType(
						type
					)} gedeeld via email`,
					action: 'share',
				},
				user
			);

			ToastService.success(
				t(
					'shared/components/share-through-email-modal/share-through-email-modal___de-email-is-verstuurd'
				)
			);

			// close modal when email is sent
			onClose();
		} catch (err) {
			console.error('Failed to send email to share item', err, {
				emailAddress,
				emailLinkTitle,
				emailLinkHref,
				type,
			});
			ToastService.danger('Het versturen van de email is mislukt');
		}
		setIsProcessing(false);
	};

	return (
		<Modal
			className="m-share-through-email-modal"
			title={modalTitle}
			size="medium"
			isOpen={isOpen}
			onClose={onClose}
			scrollable
		>
			<ModalBody>
				<BlockHeading type="h4">
					<Trans i18nKey="shared/components/share-through-email-modal/share-through-email-modal___kopieer-deze-publieke-link">
						Kopieer deze publieke link
					</Trans>
				</BlockHeading>
				<p>
					{t(
						'shared/components/share-through-email-modal/share-through-email-modal___waarschuwing-deel-link-via-email'
					)}
				</p>
				<Spacer margin={['top-large', 'bottom-large']}>
					<Box backgroundColor="gray" condensed>
						<Flex wrap justify="between" align="baseline">
							<FlexItem className="u-truncate c-share-through-email-modal__link">
								<a href={emailLinkHref}>{emailLinkHref}</a>
							</FlexItem>
							<FlexItem shrink>
								<Spacer margin="left-small">
									<Button
										label={t(
											'shared/components/share-through-email-modal/share-through-email-modal___kopieer-link'
										)}
										onClick={copyLink}
									/>
								</Spacer>
							</FlexItem>
						</Flex>
					</Box>
				</Spacer>
				<BlockHeading type="h4">
					<Trans i18nKey="shared/components/share-through-email-modal/share-through-email-modal___stuur-een-link-via-email">
						Stuur een link via email
					</Trans>
				</BlockHeading>
				<p>
					<Trans i18nKey="shared/components/share-through-email-modal/share-through-email-modal___wij-sturen-voor-jou-een-mailtje-met-deze-link">
						Wij sturen voor jou een mailtje met deze link.
					</Trans>
				</p>
				<Spacer margin="top-large">
					<Box backgroundColor="gray" condensed>
						<Flex wrap justify="between">
							<FlexItem>
								<TextInput
									placeholder={t(
										'shared/components/share-through-email-modal/share-through-email-modal___uw-e-mailadres'
									)}
									value={emailAddress}
									onChange={setEmailAddress}
								/>
							</FlexItem>
							<FlexItem shrink>
								<Spacer margin="left-small">
									<Button
										type="primary"
										onClick={sendEmail}
										disabled={isProcessing}
										label={
											isProcessing
												? t(
														'shared/components/share-through-email-modal/share-through-email-modal___versturen'
												  )
												: t(
														'shared/components/share-through-email-modal/share-through-email-modal___verzenden'
												  )
										}
									/>
								</Spacer>
							</FlexItem>
						</Flex>
					</Box>
				</Spacer>
			</ModalBody>
		</Modal>
	);
};

export default withUser(ShareThroughEmailModal) as FunctionComponent<AddToCollectionModalProps>;
