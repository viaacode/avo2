import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsService } from '../../settings/settings.service';
import { CustomError } from '../helpers';
import { ToastService } from '../services';

type UseSubjectsTuple = [string[], boolean];

export const useSubjects = (): UseSubjectsTuple => {
	const [t] = useTranslation();

	const [subjects, setSubjects] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		setIsLoading(true);

		SettingsService.fetchSubjects()
			.then((subjects: string[]) => {
				setSubjects(subjects);
			})
			.catch((err) => {
				console.error(new CustomError('Failed to get subjects from the database', err));
				ToastService.danger(
					t('settings/components/profile___het-ophalen-van-de-vakken-is-mislukt')
				);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [t]);

	return [subjects, isLoading];
};
