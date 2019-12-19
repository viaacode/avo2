import React, { FunctionComponent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';

import {
	Alert,
	Button,
	Checkbox,
	Container,
	FormGroup,
	Heading,
	Spacer,
} from '@viaa/avo2-components';

import toastService from '../../../shared/services/toast-service';
import { StamboekInput } from '../../components/StamboekInput';
import { redirectToServerArchiefRegistrationIdp } from '../../helpers/redirects';

export interface RegisterStamboekProps extends RouteComponentProps {}

export type StamboekValidationStatus =
	| 'INCOMPLETE'
	| 'INVALID_FORMAT'
	| 'INVALID_NUMBER'
	| 'VALID_FORMAT'
	| 'VALID'
	| 'ALREADY_IN_USE'
	| 'SERVER_ERROR';

export const STAMBOEK_LOCAL_STORAGE_KEY = 'AVO.stamboek';

const RegisterStamboek: FunctionComponent<RegisterStamboekProps> = ({
	history,
	location,
	...props
}) => {
	const [t] = useTranslation();

	const [hasAcceptedConditions, setHasAcceptedConditions] = useState<boolean>(false);
	const [validStamboekNumber, setValidStamboekNumber] = useState<string>('');

	return (
		<Container className="c-register-stamboek-view" mode="vertical">
			<Container mode="horizontal" size="medium">
				<div className="c-content">
					<Heading type="h2">Geef hieronder je lerarenkaart- of stamboeknummer in.</Heading>
					<p>
						Zo gaan wij na of jij een actieve lesgever bent aan een Vlaamse erkende
						onderwijsinstelling.
					</p>
					<Spacer margin="top-small">
						{/* TODO add links to help article */}
						<Alert type="info">
							{/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
							<a onClick={() => toastService.info('Nog niet geimplementeerd')}>
								Waarom hebben jullie mijn stamboeknummer nodig?
							</a>
						</Alert>
					</Spacer>
				</div>
				<Spacer margin="top-large">
					<FormGroup label={t('Lerarenkaart- of stamboeknummer')} labelFor="stamboekInput">
						<StamboekInput
							onChange={setValidStamboekNumber}
							history={history}
							location={location}
							{...props}
						/>
					</FormGroup>
				</Spacer>
				<Spacer margin={['bottom-large', 'top-large']}>
					<FormGroup>
						<Checkbox
							label={t('Ik aanvaard de gebruiksvoorwaarden en privacyverklaring.')}
							checked={hasAcceptedConditions}
							onChange={setHasAcceptedConditions}
						/>
					</FormGroup>
				</Spacer>
				<FormGroup>
					<Button
						label="Account aanmaken"
						type="primary"
						disabled={!validStamboekNumber || !hasAcceptedConditions}
						onClick={() => redirectToServerArchiefRegistrationIdp(location, validStamboekNumber)}
					/>
				</FormGroup>

				<Spacer margin="top-large">
					{/* TODO add links to help article */}
					<Alert type="info">
						{/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
						<a onClick={() => toastService.info('Nog niet geimplementeerd')}>
							Ik ben lesgever en heb (nog) geen lerarenkaart of stamboeknummer.
						</a>
					</Alert>
				</Spacer>
			</Container>
		</Container>
	);
};

export default RegisterStamboek;
