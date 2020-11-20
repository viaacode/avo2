import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CustomError } from '../helpers';
import { ToastService } from '../services';
import { OrganisationService } from '../services/organizations-service';

export type BasicOrganisation = {
	or_id: string;
	name: string;
};

type UseCompaniesTuple = [BasicOrganisation[], boolean];

export const useCompanies = (onlyWithItems: boolean): UseCompaniesTuple => {
	const [t] = useTranslation();

	const [companies, setCompanies] = useState<BasicOrganisation[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		setIsLoading(true);

		OrganisationService.fetchOrganisations(onlyWithItems)
			.then((orgs) => {
				if (orgs) {
					setCompanies(
						orgs.filter((org) => org.name && org.or_id) as BasicOrganisation[]
					);
				}
			})
			.catch((err) => {
				console.error(new CustomError('Failed to get organisations from database', err));
				ToastService.danger(
					t('settings/components/profile___het-ophalen-van-de-organisaties-is-mislukt')
				);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [t, onlyWithItems]);

	return [companies, isLoading];
};
