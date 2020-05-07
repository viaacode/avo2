import { omit, uniq } from 'lodash-es';
import queryString from 'query-string';
import React, { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';

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
	redirectToClientPage,
	redirectToServerLogoutPage,
} from '../../authentication/helpers/redirects';
import { APP_PATH } from '../../constants';
import { CustomError } from '../../shared/helpers';
import i18n from '../../shared/translations/i18n';

export interface ErrorViewQueryParams {
	message?: string;
	icon?: IconName;
	actionButtons?: Avo.Auth.ErrorActionButton[];
}

interface ErrorViewProps
	extends RouteComponentProps<{
		message?: string;
		icon?: IconName;
		actionButtons?: string;
	}> {
	message?: string;
	icon?: IconName;
	actionButtons?: Avo.Auth.ErrorActionButton[];
	children?: ReactNode;
}

const ErrorView: FunctionComponent<ErrorViewProps> = ({
	message,
	icon,
	children = null,
	history,
	location,
	actionButtons = [],
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

	const errorMessage: string =
		(queryParams.message as string) ||
		message ||
		i18n.t('error/views/error-view___de-pagina-werd-niet-gevonden');
	const errorIcon = (queryParams.icon || icon || 'search') as IconName;
	const buttons = uniq([
		...actionButtons,
		...(queryParams.actionButtons
			? (queryParams.actionButtons as string).split(',').map(button => button.trim())
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
		redirectToClientPage(APP_PATH.LOGGED_OUT_HOME.route, history);
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

export default withRouter(ErrorView);
