import React, { FunctionComponent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps } from 'react-router';

import {
	BlockHeading,
	Button,
	Column,
	Container,
	Flex,
	FlexItem,
	Grid,
	Modal,
	ModalBody,
	Spacer,
} from '@viaa/avo2-components';

import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import LoginOptions from '../components/LoginOptions';
import { getFromPath, redirectToClientPage } from '../helpers/redirects';

import './RegisterOrLogin.scss';

export interface RegisterOrLoginProps extends RouteComponentProps {}

const RegisterOrRegisterOrLogin: FunctionComponent<RegisterOrLoginProps> = ({
	history,
	location,
	match,
}) => {
	const [t] = useTranslation();

	return (
		<Container className="c-register-login-view" mode="horizontal">
			<Container mode="vertical">
				<MetaTags>
					<title>{GENERATE_SITE_TITLE(t('Registratie of login pagina titel'))}</title>
					<meta
						name="description"
						content={t('Registratie of login pagina beschrijving')}
					/>
				</MetaTags>
				<Modal className="c-register-login-view__modal" isOpen size="medium">
					<ModalBody>
						<Grid>
							<Column size="3-6">
								<Flex center orientation="horizontal">
									<FlexItem>
										<h2 className="c-h2 u-m-0">
											<Trans i18nKey="authentication/views/register-or-login___welkom-op-het-archief-voor-onderwijs">
												Welkom op Het Archief voor Onderwijs
											</Trans>
										</h2>
										<Spacer margin={['top-small', 'bottom']}>
											<p>
												<Trans i18nKey="authentication/views/register-or-login___maak-een-gratis-account-aan-en-verrijk-je-lessen-met-beeld-en-geluid-op-maat-van-de-klas">
													Maak een gratis account aan en verrijk je lessen
													met beeld en geluid op maat van de klas.
												</Trans>
											</p>
										</Spacer>
										<Spacer margin={['top-small', 'bottom-small']}>
											<Button
												block
												label={t(
													'authentication/views/register-or-login___account-aanmaken-als-lesgever'
												)}
												type="primary"
												onClick={() =>
													redirectToClientPage(
														APP_PATH.STAMBOEK.route,
														history
													)
												}
											/>
										</Spacer>
										<Button
											block
											label={t(
												'authentication/views/register-or-login___krijg-toegang-als-leerling'
											)}
											type="primary"
											onClick={() =>
												redirectToClientPage(
													APP_PATH.FOR_PUPILS.route,
													history
												)
											}
										/>
									</FlexItem>
								</Flex>
							</Column>
							<Column size="3-6">
								<Flex center orientation="horizontal">
									<FlexItem>
										<BlockHeading type="h2" className="u-m-0">
											<Trans i18nKey="authentication/views/register-or-login___reeds-een-account">
												Reeds een account?
											</Trans>
											<br />
											<Trans i18nKey="authentication/views/register-or-login___log-dan-hier-in">
												Log dan hier in.
											</Trans>
										</BlockHeading>
										<LoginOptions
											history={history}
											location={location}
											match={match}
											redirectAfterLogin={getFromPath(location)}
										/>
									</FlexItem>
								</Flex>
							</Column>
						</Grid>
					</ModalBody>
				</Modal>
			</Container>
		</Container>
	);
};

export default RegisterOrRegisterOrLogin;
