import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UserService } from '../../admin/users/user.service';
import { CustomError } from '../helpers';
import { ToastService } from '../services';

type UseBusinessCategoriesTuple = [string[], boolean];

export const useBusinessCategories = (): UseBusinessCategoriesTuple => {
	const [t] = useTranslation();

	const [businessCategories, setBusinessCategories] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		setIsLoading(true);

		UserService.fetchDistinctBusinessCategories()
			.then(setBusinessCategories)
			.catch((err) => {
				console.error(
					new CustomError('Failed to get distinct business categories from database', err)
				);
				ToastService.danger(
					t(
						'shared/hooks/use-business-category___het-ophalen-van-de-oormerken-is-mislukt'
					)
				);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [t]);

	return [businessCategories, isLoading];
};
