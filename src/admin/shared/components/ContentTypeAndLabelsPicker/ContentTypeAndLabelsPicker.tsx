import { get } from 'lodash';
import { compact, isNumber } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Column,
	FormGroup,
	Grid,
	LabelObj,
	Select,
	SelectOption,
	TagInfo,
	TagsInput,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../../../shared/helpers';
import { ToastService } from '../../../../shared/services';
import { ContentService } from '../../../content/content.service';
import { useContentTypes } from '../../../content/hooks';

export interface ContentTypeAndLabelsValue {
	selectedContentType: Avo.ContentPage.Type;
	selectedLabels: number[] | null;
}

export interface ContentTypeAndLabelsProps {
	value?: ContentTypeAndLabelsValue;
	onChange: (value: ContentTypeAndLabelsValue) => void;
	errors: string[];
}

export const ContentTypeAndLabelsPicker: FunctionComponent<ContentTypeAndLabelsProps> = ({
	value = {
		selectedContentType: 'PROJECT',
		selectedLabels: null,
	},
	onChange,
	errors,
}) => {
	const [t] = useTranslation();

	const [contentTypes, isLoadingContentTypes] = useContentTypes();
	const [labels, setLabels] = useState<Avo.ContentPage.Label[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		setIsLoading(true);
		ContentService.fetchLabelsByContentType(value.selectedContentType)
			.then(setLabels)
			.catch((err: any) => {
				console.error(
					new CustomError(
						'Failed to get content labels in ContentTypeAndLabelsPicker',
						err,
						{
							selectedContentType: value.selectedContentType,
						}
					)
				);
				ToastService.danger(
					t(
						'admin/shared/components/content-type-and-labels-picker/content-type-and-labels-picker___het-ophalen-van-de-content-pagina-labels-is-mislukt'
					)
				);
			})
			.finally(() => setIsLoading(false));
	}, [value.selectedContentType, setLabels, t]);

	const handleContentTypeChanged = (selectedValue: string) => {
		onChange({
			selectedContentType: selectedValue as Avo.ContentPage.Type,
			selectedLabels: null,
		});
	};

	const handleLabelsChanged = (newSelectedLabels: TagInfo[]) => {
		onChange({
			selectedContentType: get(value, 'selectedContentType') as Avo.ContentPage.Type,
			selectedLabels: (newSelectedLabels || []).map(
				(labelOption) => labelOption.value as number
			),
		});
	};

	const getSelectedLabelObjects = (): SelectOption<number>[] => {
		// new format where we save the ids of the labels instead of the full label object
		// https://meemoo.atlassian.net/browse/AVO-1410
		let selectedLabelIds: number[] = value.selectedLabels || [];
		if (!isNumber(selectedLabelIds[0])) {
			// Old format where we save the whole label object
			// TODO deprecated remove when all content pages with type overview have been resaved
			selectedLabelIds = (((value.selectedLabels || []) as unknown) as LabelObj[]).map(
				(labelObj) => labelObj.id
			);
		}
		return compact(
			selectedLabelIds.map((labelId: number): SelectOption<number> | null => {
				const labelObj = labels.find((labelObj) => labelObj.id === labelId);
				if (!labelObj) {
					return null;
				}
				return {
					label: labelObj.label,
					value: labelObj.id,
				};
			})
		);
	};

	const renderSelectPicker = () => (
		<Grid>
			<Column size="1">
				<Select
					id="content-type-and-label-picker-type"
					placeholder={t('admin/content/components/content-picker/content-picker___type')}
					options={contentTypes}
					value={get(value, 'selectedContentType')}
					loading={isLoadingContentTypes}
					onChange={handleContentTypeChanged}
				/>
			</Column>
			<Column size="3">
				{/* Force reload tagInput when content type changes */}
				<div key={(value.selectedLabels || []).length}>
					<TagsInput
						options={(labels || []).map(
							(labelObj): SelectOption<number> => ({
								label: labelObj.label,
								value: labelObj.id,
							})
						)}
						allowMulti
						allowCreate={false}
						value={getSelectedLabelObjects()}
						onChange={handleLabelsChanged}
						disabled={!value || !value.selectedContentType}
						isLoading={isLoading}
						placeholder={
							!value || !value.selectedContentType
								? t(
										'admin/shared/components/content-type-and-labels-picker/content-type-and-labels-picker___kies-eerst-een-content-type'
								  )
								: t(
										'admin/shared/components/content-type-and-labels-picker/content-type-and-labels-picker___labels'
								  )
						}
					/>
				</div>
			</Column>
		</Grid>
	);

	return <FormGroup error={errors}>{renderSelectPicker()}</FormGroup>;
};
