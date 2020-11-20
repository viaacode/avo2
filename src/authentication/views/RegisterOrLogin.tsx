import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps, withRouter } from 'react-router';

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
import { ROUTE_PARTS } from '../../shared/constants';
import LoginOptions from '../components/LoginOptions';
import { redirectToClientPage } from '../helpers/redirects';

import './RegisterOrLogin.scss';

export interface RegisterOrLoginProps {}

const RegisterOrRegisterOrLogin: FunctionComponent<RegisterOrLoginProps & RouteComponentProps> = ({
	history,
	location,
	match,
}) => {
	const [t] = useTranslation();

	return (
		<Container className="c-register-login-view" mode="horizontal">
			<Container mode="vertical">
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							t(
								'authentication/views/register-or-login___registratie-of-login-pagina-titel'
							)
						)}
					</title>
					<meta
						name="description"
						content={t(
							'authentication/views/register-or-login___registratie-of-login-pagina-beschrijving'
						)}
					/>
				</MetaTags>
				<Modal className="c-register-login-view__modal" isOpen size="medium">
					<ModalBody>
						<Grid>
							<Column size="3-6">
								<Spacer margin="bottom-extra-large">
									<Flex center orientation="horizontal">
										<FlexItem>
											<h2 className="c-h2 u-m-0">
												{t(
													'authentication/views/register-or-login___welkom-op-het-archief-voor-onderwijs'
												)}
											</h2>
											<Spacer margin={['top-small', 'bottom']}>
												<p>
													{t(
														'authentication/views/register-or-login___maak-een-gratis-account-aan-en-verrijk-je-lessen-met-beeld-en-geluid-op-maat-van-de-klas'
													)}
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
														`/${ROUTE_PARTS.pupils}`,
														history
													)
												}
											/>
										</FlexItem>
									</Flex>
								</Spacer>
							</Column>
							<Column size="3-6">
								<Flex center orientation="horizontal">
									<FlexItem>
										<BlockHeading type="h2" className="u-m-0">
											{t(
												'authentication/views/register-or-login___reeds-een-account'
											)}
											<br />
											{t(
												'authentication/views/register-or-login___log-dan-hier-in'
											)}
										</BlockHeading>
										<LoginOptions
											history={history}
											location={location}
											match={match}
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

export default withRouter(RegisterOrRegisterOrLogin);
