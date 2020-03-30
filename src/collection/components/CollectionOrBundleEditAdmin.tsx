import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Column,
	Container,
	Form,
	FormGroup,
	Grid,
	Spacer,
	TagInfo,
	TagsInput,
	TextArea,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';
import { CollectionLabelSchema } from '@viaa/avo2-types/types/collection/index'; // TODO fix after typings update 2.15

import { CustomError } from '../../shared/helpers';
import { ToastService } from '../../shared/services';

import { CollectionService } from '../collection.service';
import { QualityLabel } from '../collection.types';
import { CollectionAction } from './CollectionOrBundleEdit';

interface CollectionOrBundleEditAdminProps {
	collection: Avo.Collection.Collection;
	changeCollectionState: (action: CollectionAction) => void;
}

const CollectionOrBundleEditAdmin: FunctionComponent<CollectionOrBundleEditAdminProps> = ({
	collection,
	changeCollectionState,
}) => {
	const [t] = useTranslation();

	// State
	const [qualityLabels, setQualityLabels] = useState<TagInfo[] | null>(null);

	useEffect(() => {
		CollectionService.fetchQualityLabels()
			.then(dbLabels =>
				setQualityLabels(
					dbLabels.map((dbLabel: QualityLabel) => ({
						label: dbLabel.description,
						value: dbLabel.value,
					}))
				)
			)
			.catch(err => {
				console.error(new CustomError('Failed to fetch quality labels', err));
				ToastService.danger(
					t(
						'collection/components/collection-or-bundle-edit-admin___het-ophalen-van-de-kwaliteitslabels-is-mislukt'
					)
				);
			});
	}, [setQualityLabels, t]);

	const updateCollectionMultiProperty = (
		selectedTagOptions: TagInfo[],
		collectionProp: keyof Avo.Collection.Collection
	) => {
		changeCollectionState({
			collectionProp,
			type: 'UPDATE_COLLECTION_PROP',
			collectionPropValue: (selectedTagOptions || []).map(tag => ({
				label: tag.value as string,
			})) as any,
		});
	};

	const getCollectionLabels = (): TagInfo[] => {
		if (!qualityLabels) {
			return [];
		}
		const labelIds = ((collection.collection_labels || []) as CollectionLabelSchema[]).map(
			(item: any) => item.label
		);
		return qualityLabels.filter(qualityLabel => labelIds.includes(qualityLabel.value));
	};

	return (
		<>
			<Container mode="vertical">
				<Container mode="horizontal">
					<Form>
						<Spacer margin="bottom">
							<Grid>
								<Column size="3-7">
									<FormGroup
										label={t(
											'collection/components/collection-or-bundle-edit-admin___kwaliteitslabels'
										)}
									>
										{!!qualityLabels && (
											<TagsInput
												options={qualityLabels}
												value={getCollectionLabels()}
												onChange={(values: TagInfo[]) =>
													updateCollectionMultiProperty(
														values,
														'collection_labels'
													)
												}
											/>
										)}
									</FormGroup>
									<FormGroup
										label={t(
											'collection/views/collection-edit-meta-data___persoonlijke-opmerkingen-notities'
										)}
										labelFor="personalRemarkId"
									>
										<TextArea
											name="personalRemarkId"
											value={collection.note || ''}
											id="personalRemarkId"
											height="medium"
											placeholder={t(
												'collection/views/collection-edit-meta-data___geef-hier-je-persoonlijke-opmerkingen-notities-in'
											)}
											onChange={(value: string) =>
												changeCollectionState({
													type: 'UPDATE_COLLECTION_PROP',
													collectionProp: 'note',
													collectionPropValue: value,
												})
											}
										/>
									</FormGroup>
								</Column>
								<Column size="3-5">
									<></>
								</Column>
							</Grid>
						</Spacer>
					</Form>
				</Container>
			</Container>
		</>
	);
};

export default CollectionOrBundleEditAdmin;