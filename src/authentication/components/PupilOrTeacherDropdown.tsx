import React, { FunctionComponent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';

import { Button, Container, Spacer } from '@viaa/avo2-components';

import { APP_PATH } from '../../constants';
import { redirectToClientPage } from '../helpers/redirects';

export interface PupilOrTeacherDropdownProps extends RouteComponentProps {
	closeDropdown?: () => void;
}

const PupilOrTeacherDropdown: FunctionComponent<PupilOrTeacherDropdownProps> = ({
	history,
	closeDropdown = () => {},
}) => {
	const [t] = useTranslation();

	return (
		<Container className="c-register-pupil-or-teacher-dropdown" mode="horizontal">
			<Container mode="vertical">
				<h4 className="c-h4">
					<Trans i18nKey="authentication/components/pupil-or-teacher-dropdown___ben-je-lesgever">
						Ben je lesgever?
					</Trans>
				</h4>
				<p>
					<Trans i18nKey="authentication/components/pupil-or-teacher-dropdown___krijg-toegang-tot-audiovisueel-lesmateriaal-maak-eigen-collecties">
						Krijg toegang tot audiovisueel lesmateriaal, maak eigen collecties.
					</Trans>
				</p>
				<Spacer margin={['bottom-large', 'top-small']}>
					<Button
						block
						type="primary"
						label={t(
							'authentication/components/pupil-or-teacher-dropdown___maak-je-gratis-account-aan'
						)}
						onClick={() => {
							closeDropdown();
							redirectToClientPage(APP_PATH.FOR_TEACHERS, history);
						}}
					/>
				</Spacer>
				<Spacer margin="top-large">
					<h4 className="c-h4">
						<Trans i18nKey="authentication/components/pupil-or-teacher-dropdown___ben-je-leerling-secundair">
							Ben je leerling secundair?
						</Trans>
					</h4>
					<p>
						<Trans i18nKey="authentication/components/pupil-or-teacher-dropdown___krijg-toegang-tot-opdrachten-klaargezet-door-jouw-leerkrachten">
							Krijg toegang tot opdrachten klaargezet door jouw leerkrachten.
						</Trans>
					</p>
					<Spacer margin="top-small">
						<Button
							block
							type="primary"
							label={t(
								'authentication/components/pupil-or-teacher-dropdown___toegang-voor-leerlingen'
							)}
							onClick={() => {
								closeDropdown();
								redirectToClientPage(APP_PATH.FOR_PUPILS, history);
							}}
						/>
					</Spacer>
				</Spacer>
			</Container>
		</Container>
	);
};

export default PupilOrTeacherDropdown;
