import React, { FunctionComponent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import {
	Alert,
	BlockHeading,
	Button,
	Checkbox,
	Container,
	FormGroup,
	Spacer,
} from '@viaa/avo2-components';

import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import { ToastService } from '../../../shared/services';
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

const RegisterStamboek: FunctionComponent<RegisterStamboekProps> = ({ location }) => {
	const [t] = useTranslation();

	const [validStamboekNumber, setValidStamboekNumber] = useState<string>('');
	const [acceptedPrivacyConditions, setAcceptedPrivacyConditions] = useState<boolean>(false);

	const handleCreateAccountButtonClicked = () => {
		if (acceptedPrivacyConditions) {
			redirectToServerArchiefRegistrationIdp(location, validStamboekNumber);
		} else {
			ToastService.danger(
				t(
					'authentication/views/registration-flow/r-3-stamboek___je-moet-de-privacy-voorwaarden-accepteren-om-een-account-te-kunnen-aanmaken'
				)
			);
		}
	};

	return (
		<Container className="c-register-stamboek-view" mode="vertical">
			<Container mode="horizontal" size="medium">
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							t(
								'authentication/views/registration-flow/r-3-stamboek___stamboek-pagina-titel'
							)
						)}
					</title>
					<meta
						name="description"
						content={t(
							'authentication/views/registration-flow/r-3-stamboek___stamboek-pagina-beschrijving'
						)}
					/>
				</MetaTags>
				<div className="c-content">
					<BlockHeading type="h2">
						<Trans i18nKey="authentication/views/registration-flow/r-3-stamboek___geef-hieronder-je-lerarenkaart-of-stamboeknummer-in">
							Geef hieronder je lerarenkaart- of stamboeknummer in.
						</Trans>
					</BlockHeading>
					<p>
						<Trans i18nKey="authentication/views/registration-flow/r-3-stamboek___zo-gaan-wij-na-of-jij-een-actieve-lesgever-bent-aan-een-vlaamse-erkende-onderwijsinstelling">
							Zo gaan wij na of jij een actieve lesgever bent aan een Vlaamse erkende
							onderwijsinstelling.
						</Trans>
					</p>
					<Spacer margin="top-small">
						<Alert type="info">
							<a
								href="/faq-lesgever/waarom-lerarenkaart-of-stamboeknummer"
								target="_blank"
							>
								<Trans i18nKey="authentication/views/registration-flow/r-3-stamboek___waarom-hebben-jullie-mijn-stamboeknummer-nodig">
									Waarom hebben jullie mijn stamboeknummer nodig?
								</Trans>
							</a>
						</Alert>
					</Spacer>
				</div>
				<Spacer margin={['top-large', 'bottom']}>
					<FormGroup
						label={t(
							'authentication/views/registration-flow/r-3-stamboek___lerarenkaart-of-stamboeknummer'
						)}
						labelFor="stamboekInput"
						required
					>
						<StamboekInput onChange={setValidStamboekNumber} />
					</FormGroup>
					<FormGroup>
						<Checkbox
							label={
								<Trans i18nKey="authentication/views/registration-flow/r-3-stamboek___ik-aanvaard-de-privacyverklaring">
									Ik aanvaard de&nbsp;
									<a
										href="//meemoo.be/nl/privacybeleid"
										target="_blank"
										title={t(
											'authentication/views/registration-flow/r-3-stamboek___bekijk-de-privacy-voorwaarden'
										)}
										rel="noopener noreferrer"
									>
										privacyverklaring
									</a>
									.
								</Trans>
							}
							checked={acceptedPrivacyConditions}
							onChange={setAcceptedPrivacyConditions}
						/>
					</FormGroup>
				</Spacer>
				<FormGroup>
					<Button
						label={t(
							'authentication/views/registration-flow/r-3-stamboek___account-aanmaken'
						)}
						type="primary"
						disabled={!validStamboekNumber}
						onClick={handleCreateAccountButtonClicked}
					/>
				</FormGroup>

				<Spacer margin="top-large">
					{/* TODO add links to help article */}
					<Alert type="info">
						<Link to={APP_PATH.MANUAL_ACCESS_REQUEST.route}>
							Ik ben lesgever en heb (nog) geen lerarenkaart of stamboeknummer.
						</Link>
					</Alert>
				</Spacer>
			</Container>
		</Container>
	);
};

export default RegisterStamboek;
