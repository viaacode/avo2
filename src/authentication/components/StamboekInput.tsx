import React, { FunctionComponent, ReactNode, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
	Alert,
	Button,
	Icon,
	Spacer,
	TextInput,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { APP_PATH } from '../../constants';
import Html from '../../shared/components/Html/Html';
import { ToastType } from '../../shared/services';
import { verifyStamboekNumber } from '../authentication.service';
import { StamboekValidationStatus } from '../views/registration-flow/r3-stamboek';

import './StamboekInput.scss';

export interface StamboekInputProps {
	value?: string;
	onChange: (validStamboekNumber: string) => void;
}

export const StamboekInput: FunctionComponent<StamboekInputProps> = ({ onChange, value = '' }) => {
	const [t] = useTranslation();

	const [stamboekValidationStatus, setStamboekValidationStatus] = useState<
		StamboekValidationStatus
	>('INCOMPLETE');
	const [rawStamboekNumber, setRawStamboekNumber] = useState<string>(value);

	const STAMBOEK_MESSAGES: {
		/* eslint-disable @typescript-eslint/no-unused-vars */
		[status in StamboekValidationStatus]: {
			/* eslint-enable @typescript-eslint/no-unused-vars */
			message: string | ReactNode;
			status: ToastType | undefined;
		};
	} = {
		INCOMPLETE: {
			message: '',
			status: undefined,
		},
		INVALID_FORMAT: {
			message: t(
				'authentication/components/stamboek-input___het-stamboek-nummer-heeft-een-ongeldig-formaat-geldige-formaten-00000000000-of-00000000000-000000'
			),
			status: ToastType.DANGER,
		},
		INVALID_NUMBER: {
			message: (
				<span>
					<Trans i18nKey="authentication/components/stamboek-input___het-stamboek-nummer-is-niet-geldig-of-nog-niet-geactiveerd">
						Het stamboek nummer is niet geldig, of nog niet geactiveerd. Indien u nog
						maar recent uw kaart heeft ontvangen kan u via een manuele aanvraag toch al
						toegang krijgen.
					</Trans>
					<br />
					<Spacer margin="top-small">
						<Link to={APP_PATH.MANUAL_ACCESS_REQUEST.route}>
							<Button
								label={t(
									'authentication/components/stamboek-input___manuele-aanvraag-indienen'
								)}
							/>
						</Link>
					</Spacer>
				</span>
			),
			status: ToastType.DANGER,
		},
		VALID_FORMAT: {
			message: t('authentication/components/stamboek-input___bezig-met-valideren'),
			status: ToastType.SPINNER,
		},
		VALID: {
			message: t('authentication/components/stamboek-input___het-stamboek-nummer-is-geldig'),
			status: ToastType.SUCCESS,
		},
		ALREADY_IN_USE: {
			message: (
				<Html
					content={t(
						'authentication/components/stamboek-input___dit-stamboek-nummer-is-reeds-in-gebruik'
					)}
					type="span"
					sanitizePreset="link"
				/>
			),
			status: ToastType.DANGER,
		},
		SERVER_ERROR: {
			message: t(
				'authentication/components/stamboek-input___er-ging-iets-mis-bij-het-valideren-van-het-stamboek-nummer-probeer-later-eens-opnieuw'
			),
			status: ToastType.DANGER,
		},
	};

	const setStamboekNumber = async (rawStamboekNumber: string) => {
		try {
			setRawStamboekNumber(rawStamboekNumber);
			const cleanedStamboekNumber = rawStamboekNumber.replace(/[^0-9-]+/, '');
			// Check if stamboek number is incomplete
			// eg: 3256
			// or: 43457876543-34
			if (/^[0-9]{0,10}$/g.test(cleanedStamboekNumber)) {
				onChange('');
				setStamboekValidationStatus('INCOMPLETE');
				return;
			}
			if (/^[0-9]{11}(-[0-9]*)?$/g.test(cleanedStamboekNumber)) {
				const stamboekNumber = cleanedStamboekNumber.substring(0, 11);
				setStamboekValidationStatus('VALID_FORMAT');
				const validationStatus: Avo.Stamboek.ValidationStatuses = await verifyStamboekNumber(
					stamboekNumber
				);
				if (validationStatus === 'VALID') {
					onChange(stamboekNumber);
					setStamboekValidationStatus('VALID');
				} else if (validationStatus === 'ALREADY_IN_USE') {
					onChange('');
					setStamboekValidationStatus('ALREADY_IN_USE');
				} else {
					// 'INVALID' server response
					onChange('');
					setStamboekValidationStatus('INVALID_NUMBER');
				}
			} else {
				onChange('');
				setStamboekValidationStatus('INVALID_FORMAT');
			}
		} catch (err) {
			onChange('');
			setStamboekValidationStatus('SERVER_ERROR');
		}
	};

	return (
		<Spacer className="m-stamboek-input" margin={['bottom-large']}>
			<TextInput
				placeholder={t('authentication/components/stamboek-input___00000000000-000000')}
				value={rawStamboekNumber}
				onChange={setStamboekNumber}
			/>
			<Tooltip position="bottom" contentClassName="m-stamboek-tooltip">
				<TooltipTrigger>
					<span>
						<Icon className="a-info-icon" name="info" size="small" />
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<Spacer margin={'small'}>
						<Spacer margin="bottom-small">
							<span>
								<Trans i18nKey="authentication/components/stamboek-input___je-stamboek-nummer-staat-op-je-lerarenkaart">
									Je stamboek nummer staat op je lerarenkaart
								</Trans>
							</span>
						</Spacer>
						<img
							alt={t(
								'authentication/components/stamboek-input___voorbeeld-leeraren-kaart'
							)}
							className="a-stamboek-image"
							src="/images/leerkrachten-kaart-voorbeeld-nummer.png"
						/>
					</Spacer>
				</TooltipContent>
			</Tooltip>
			<Spacer margin="top-small">
				{STAMBOEK_MESSAGES[stamboekValidationStatus].status && (
					<Alert type={STAMBOEK_MESSAGES[stamboekValidationStatus].status}>
						<Spacer margin="bottom-small">
							{STAMBOEK_MESSAGES[stamboekValidationStatus].message}
						</Spacer>
					</Alert>
				)}
			</Spacer>
		</Spacer>
	);
};
