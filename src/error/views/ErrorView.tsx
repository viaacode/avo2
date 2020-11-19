import { isArray, isNil, isString, omit, uniq } from 'lodash-es';
import queryString from 'query-string';
import React, { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { compose } from 'redux';

import {
	Blankslate,
	Button,
	ButtonToolbar,
	Container,
	Flex,
	IconName,
	Spacer,
	Spinner,
	Toolbar,
	ToolbarCenter,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import {
	redirectToLoggedInHome,
	redirectToLoggedOutHome,
	redirectToServerLogoutPage,
} from '../../authentication/helpers/redirects';
import { CustomError } from '../../shared/helpers';
import withUser, { UserProps } from '../../shared/hocs/withUser';
import i18n from '../../shared/translations/i18n';

export interface ErrorViewQueryParams {
	message?: string;
	icon?: IconName;
	actionButtons?: Avo.Auth.ErrorActionButton[];
}

interface ErrorViewProps {
	message?: string;
	icon?: IconName;
	actionButtons?: Avo.Auth.ErrorActionButton[];
	children?: ReactNode;
}

const ErrorView: FunctionComponent<ErrorViewProps & RouteComponentProps & UserProps> = ({
	message,
	icon,
	children = null,
	location,
	actionButtons = [],
	user,
}) => {
	const [t] = useTranslation();

	const queryParams = queryString.parse((location.search || '').substring(1));

	if (queryParams.logout) {
		// redirect to logout route and afterwards redirect back to the error page
		redirectToServerLogoutPage(
			location,
			`/error?${queryString.stringify(omit(queryParams, 'logout'))}`
		);
		return (
			<Spacer margin={['top-large', 'bottom-large']}>
				<Flex center>
					<Spinner size="large" />
				</Flex>
			</Spacer>
		);
	}

	const messageText = (queryParams.message as string) || message || '';
	const errorMessage: string = isNil(messageText)
		? i18n.t('error/views/error-view___de-pagina-werd-niet-gevonden')
		: messageText;
	const errorIcon = (queryParams.icon || icon || 'search') as IconName;
	const buttons = uniq([
		...actionButtons,
		...(isArray(queryParams.actionButtons) ? queryParams.actionButtons : []),
		...(isString(queryParams.actionButtons)
			? queryParams.actionButtons
					.split(',')
					.map((button) => button.trim())
					.filter((button) => !!button)
			: []),
	]);

	if (!(queryParams.message || message)) {
		console.error(
			new CustomError('Error view without error message', null, {
				queryParams,
				message,
				icon,
				actionButtons,
			})
		);
	}

	const goToHome = () => {
		if (user) {
			redirectToLoggedInHome(location);
		} else {
			redirectToLoggedOutHome(location);
		}
	};

	return (
		<Container mode="vertical" background="alt">
			<Container size="medium" mode="horizontal">
				<Blankslate body="" icon={errorIcon} title={errorMessage}>
					{children}
					<Toolbar>
						<ToolbarCenter>
							<ButtonToolbar>
								{buttons.includes('home') && (
									<Button
										onClick={goToHome}
										label={t(
											'error/views/error-view___ga-terug-naar-de-homepagina'
										)}
									/>
								)}
								{buttons.includes('helpdesk') && (
									<Button
										type="danger"
										onClick={() => window.zE('webWidget', 'toggle')}
										label={t('error/views/error-view___contacteer-de-helpdesk')}
									/>
								)}
							</ButtonToolbar>
						</ToolbarCenter>
					</Toolbar>
				</Blankslate>
			</Container>
		</Container>
	);
};

export default compose(withRouter, withUser)(ErrorView) as FunctionComponent<ErrorViewProps>;
