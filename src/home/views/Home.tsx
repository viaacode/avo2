import { get } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { RouteComponentProps, withRouter } from 'react-router';
import { compose } from 'redux';

import { SpecialUserGroup } from '../../admin/user-groups/user-group.const';
import { getUserGroupId } from '../../authentication/helpers/get-profile-info';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import { ContentPage } from '../../content-page/views';
import { ROUTE_PARTS } from '../../shared/constants';
import withUser, { UserProps } from '../../shared/hocs/withUser';

const Home: FunctionComponent<UserProps & RouteComponentProps> = ({ history, user }) => {
	const [t] = useTranslation();

	// /start when user is a pupil => should be redirected to /werkruimte/opdrachten
	if (getUserGroupId(get(user, 'profile')) === SpecialUserGroup.Pupil) {
		history.push(APP_PATH.WORKSPACE_ASSIGNMENTS.route);
		return null;
	}
	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(t('home/views/home___ingelogde-start-pagina-titel'))}
				</title>
				<meta
					name="description"
					content={t('home/views/home___ingelogde-start-pagina-beschrijving')}
				/>
			</MetaTags>
			<ContentPage path={`/${ROUTE_PARTS.loggedInHome}`} />
		</>
	);
};

export default compose(withRouter, withUser)(Home) as FunctionComponent;
