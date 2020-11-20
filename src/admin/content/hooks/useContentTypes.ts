import { useEffect, useState } from 'react';

import { SelectOption } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ContentService } from '../content.service';

type UseContentTypesTuple = [SelectOption<Avo.ContentPage.Type>[], boolean];

export const useContentTypes = (): UseContentTypesTuple => {
	const [contentTypeOptions, setContentTypeOptions] = useState<
		SelectOption<Avo.ContentPage.Type>[]
	>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		setIsLoading(true);

		ContentService.getContentTypes()
			.then((types) => {
				if (types) {
					setContentTypeOptions(types);
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	return [contentTypeOptions, isLoading];
};
