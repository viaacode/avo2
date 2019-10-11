import React, { FunctionComponent, ReactElement, ReactNode } from 'react';

import { Flex, IconName, Spinner } from '@viaa/avo2-components';
import NotFound from '../../../404/views/NotFound';
import { LoadingState } from '../../../assignment/helpers';

export interface LoadingErrorLoadedComponentProps {
	loadingState: LoadingState;
	loadingError?: string | null;
	loadingErrorIcon?: IconName | null;
	notFoundError?: string | null;
	showSpinner?: boolean;
	dataObject: any | undefined | null;
	render: () => ReactElement | null;
}

const LoadingErrorLoadedComponent: FunctionComponent<LoadingErrorLoadedComponentProps> = ({
	loadingState = 'loading',
	loadingError,
	loadingErrorIcon,
	notFoundError,
	showSpinner = true,
	dataObject,
	render,
}) => {
	const renderSpinner = () => (
		<Flex orientation="horizontal" center>
			<Spinner size="large" />
		</Flex>
	);

	const renderError = () => (
		<NotFound
			message={loadingError || 'Er is iets mis gegaan bij het laden van de gegevens'}
			icon={loadingErrorIcon || 'alert-triangle'}
		/>
	);

	// Render
	switch (loadingState) {
		case 'error':
			return renderError();

		case 'loaded':
			if (dataObject) {
				return render();
			} else {
				return (
					<NotFound
						message={notFoundError || 'Het gevraagde object is niet gevonden'}
						icon={'search'}
					/>
				);
			}

		case 'loading':
		default:
			return showSpinner ? renderSpinner() : <></>;
	}
};

export default LoadingErrorLoadedComponent;
