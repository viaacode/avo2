import React, { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';

import {
	BlockHeading,
	Button,
	Container,
	Flex,
	Navbar,
	Spacer,
	Toolbar,
	ToolbarCenter,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';

interface TopbarProps extends RouteComponentProps {
	onClickBackButton?: () => void;
	title?: string;
	center?: ReactNode;
	right?: ReactNode;
}

export const TopBarComponent: FunctionComponent<TopbarProps> = ({
	onClickBackButton,
	title,
	center,
	right,
}) => {
	const [t] = useTranslation();

	return (
		<Navbar className="c-top-bar">
			<Container mode="horizontal">
				<Toolbar>
					<ToolbarLeft>
						<ToolbarItem>
							<Flex center>
								{!!onClickBackButton && (
									<Spacer margin="right">
										<Button
											className="c-top-bar__back"
											icon="chevron-left"
											ariaLabel={t(
												'admin/shared/components/top-bar/top-bar___ga-terug-naar-het-vorig-scherm'
											)}
											title={t(
												'admin/shared/components/top-bar/top-bar___ga-terug-naar-het-vorig-scherm'
											)}
											onClick={onClickBackButton}
											type="borderless"
										/>
									</Spacer>
								)}
								<BlockHeading type={'h1'}>{title}</BlockHeading>
							</Flex>
						</ToolbarItem>
					</ToolbarLeft>
					{!!center && <ToolbarCenter>{center}</ToolbarCenter>}
					{!!right && <ToolbarRight>{right}</ToolbarRight>}
				</Toolbar>
			</Container>
		</Navbar>
	);
};

export const TopBar = withRouter(TopBarComponent);
