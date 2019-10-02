import { Blankslate, Container } from '@viaa/avo2-components';
import React, { FunctionComponent, ReactNode } from 'react';

interface NotFoundProps {
	message?: string;
	icon?: string;
	children?: ReactNode;
}

const NotFound: FunctionComponent<NotFoundProps> = ({
	message = 'De pagina werd niet gevonden',
	icon = 'search',
	children = null,
}) => (
	<Container mode="vertical" background={'alt'}>
		<Container size="medium" mode="horizontal">
			<Blankslate body="" icon={icon} title={message}>
				{children}
			</Blankslate>
		</Container>
	</Container>
);

export default NotFound;
