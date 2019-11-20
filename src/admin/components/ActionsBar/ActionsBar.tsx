import classnames from 'classnames';
import React, { FunctionComponent, ReactNode } from 'react';

import {
	ButtonToolbar,
	Container,
	Navbar,
	Toolbar,
	ToolbarItem,
	ToolbarRight,
} from '@viaa/avo2-components';

import './ActionsBar.scss';

interface ActionsBarprops {
	children?: ReactNode;
	fixed?: boolean;
}

const ActionsBar: FunctionComponent<ActionsBarprops> = ({ children, fixed }) => {
	return (
		<Navbar
			autoHeight
			className={classnames('c-actions-bar', { 'c-actions-bar--fixed': fixed })}
			background="alt"
			placement="bottom"
		>
			<Container mode="vertical" size="small">
				<Container mode="horizontal">
					<Toolbar>
						<ToolbarRight>
							<ToolbarItem>
								<ButtonToolbar>{children}</ButtonToolbar>
							</ToolbarItem>
						</ToolbarRight>
					</Toolbar>
				</Container>
			</Container>
		</Navbar>
	);
};

export default ActionsBar;