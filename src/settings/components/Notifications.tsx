import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import { GENERATE_SITE_TITLE } from '../../constants';

export interface NotificationsProps {}

const Notifications: FunctionComponent<NotificationsProps> = () => {
	const [t] = useTranslation();

	return (
		<>
			<MetaTags>
				<title>{GENERATE_SITE_TITLE(t('Notificatie voorkeuren pagina titel'))}</title>
				<meta
					name="description"
					content={t('Notificatie voorkeuren pagina beschrijving')}
				/>
			</MetaTags>
			<span>TODO notificaties</span>
		</>
	);
};

export default Notifications;
