import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { Container, Flex, FlexItem } from '@viaa/avo2-components';

import LoginOptions from './LoginOptions';
import './LoginOptionsDropdown.scss';

export interface LoginOptionsDropdownProps {
	closeDropdown?: () => void;
}

const LoginOptionsDropdown: FunctionComponent<LoginOptionsDropdownProps & RouteComponentProps> = ({
	history,
	location,
	match,
	closeDropdown = () => {},
}) => {
	return (
		<Container className="m-login-options-dropdown" mode="horizontal">
			<Container mode="vertical">
				<Flex center>
					<FlexItem>
						<LoginOptions
							history={history}
							location={location}
							match={match}
							onOptionClicked={closeDropdown}
						/>
					</FlexItem>
				</Flex>
			</Container>
		</Container>
	);
};

export default withRouter(LoginOptionsDropdown);
