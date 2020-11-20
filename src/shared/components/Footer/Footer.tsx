import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';

import { Container, Spacer } from '@viaa/avo2-components';

import { BooleanDictionary, mapNavElementsToNavigationItems } from '../../helpers/navigation';
import withUser, { UserProps } from '../../hocs/withUser';
import {
	AppContentNavElement,
	getNavigationItems,
	NavItemMap,
} from '../../services/navigation-items-service';
import { NavigationItemInfo } from '../../types';
import NavigationItem from '../Navigation/NavigationItem';

import './Footer.scss';

export const Footer: FunctionComponent<RouteComponentProps & UserProps> = ({
	history,
	location,
	match,
	user,
}) => {
	const [t] = useTranslation();

	const [areDropdownsOpen, setDropdownsOpen] = useState<BooleanDictionary>({});
	const [primaryNavItems, setPrimaryNavItems] = useState<AppContentNavElement[]>([]);
	const [secondaryNavItems, setSecondaryNavItems] = useState<AppContentNavElement[]>([]);

	useEffect(() => {
		getNavigationItems()
			.then((navItems: NavItemMap) => {
				setPrimaryNavItems(navItems['footer-links']);
				setSecondaryNavItems(navItems['footer-rechts']);
			})
			.catch((err) => {
				console.error('Failed to get navigation items', err);
				// Do not notify the user, since this will happen in the header navigation component already
				// And we don't want to show 2 error toast messages
			});
	}, [history, t, user]);

	const getPrimaryNavigationItems = (): NavigationItemInfo[] => {
		return mapNavElementsToNavigationItems(primaryNavItems, t);
	};

	const getSecondaryNavigationItems = (): NavigationItemInfo[] => {
		return mapNavElementsToNavigationItems(secondaryNavItems, t);
	};

	const mapNavItems = (navItems: NavigationItemInfo[]) => {
		return navItems.map((item) => (
			<NavigationItem
				key={item.key}
				item={item}
				className="c-nav__item c-nav__item--i"
				exact={item.location === '/'}
				showActive={false}
				areDropdownsOpen={areDropdownsOpen}
				setDropdownsOpen={setDropdownsOpen}
				history={history}
				location={location}
				match={match}
			/>
		));
	};

	return (
		<footer className="c-global-footer">
			<Container mode="horizontal" className="c-global-footer__inner">
				<ul>
					<li>
						<a
							href="https://meemoo.be/nl"
							title={t('shared/components/footer/footer___meemoo')}
						>
							<span className="c-nav__item-label">
								{t('shared/components/footer/footer___een-initiatief-van')}
							</span>
							<Spacer margin="left-small">
								<img
									src="/images/meemoo-logo.png"
									alt={t('shared/components/footer/footer___logo-van-meemoo')}
								/>
							</Spacer>
						</a>
					</li>
					{mapNavItems(getPrimaryNavigationItems())}
				</ul>
				<ul>
					{mapNavItems(getSecondaryNavigationItems())}
					<li>
						<a
							href="https://www.vlaanderen.be/"
							title={t('shared/components/footer/footer___vlaamse-overheid')}
						>
							<span className="c-nav__item-label">
								{t('shared/components/footer/footer___gesteund-door')}
							</span>
							<Spacer margin="left-small">
								<img
									src="/images/vlaanderen-logo.png"
									alt={t(
										'shared/components/footer/footer___logo-van-vlaamse-overheid'
									)}
								/>
							</Spacer>
						</a>
					</li>
				</ul>
			</Container>
		</footer>
	);
};

export default withUser(Footer) as FunctionComponent<RouteComponentProps>;
