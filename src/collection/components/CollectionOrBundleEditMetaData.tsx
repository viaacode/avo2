import { StringMap } from 'i18next';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
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
import { RichEditorState } from '@viaa/avo2-components/dist/esm/wysiwyg';
import { Avo } from '@viaa/avo2-types';

import { SettingsService } from '../../settings/settings.service';
import { FileUpload } from '../../shared/components';
import WYSIWYGWrapper from '../../shared/components/WYSIWYGWrapper/WYSIWYGWrapper';
import {
	WYSIWYG_OPTIONS_BUNDLE_DESCRIPTION,
	WYSIWYG_OPTIONS_DEFAULT_NO_TITLES,
} from '../../shared/constants/wysiwyg';
import { CustomError, sanitizeHtml, stripHtml } from '../../shared/helpers';
import { stringToSelectOption } from '../../shared/helpers/string-to-select-options';
import i18n from '../../shared/translations/i18n';
import { MAX_LONG_DESCRIPTION_LENGTH, MAX_SEARCH_DESCRIPTION_LENGTH } from '../collection.const';
import { getValidationFeedbackForDescription } from '../collection.helpers';
import { CollectionStillsModal } from '../components';

import { CollectionAction } from './CollectionOrBundleEdit';

interface CollectionOrBundleEditMetaDataProps {
	type: 'collection' | 'bundle';
	collection: Avo.Collection.Collection;
	changeCollectionState: (action: CollectionAction) => void;
}

const CollectionOrBundleEditMetaData: FunctionComponent<CollectionOrBundleEditMetaDataProps> = ({
	type,
	collection,
	changeCollectionState,
}) => {
	const [t] = useTranslation();

	// State
	const [isCollectionsStillsModalOpen, setCollectionsStillsModalOpen] = useState<boolean>(false);
	const [subjects, setSubjects] = useState<TagInfo[]>([]);
	const [educationLevels, setEducationLevels] = useState<TagInfo[]>([]);
	const [descriptionLongEditorState, setDescriptionLongEditorState] = useState<
		RichEditorState | undefined
	>(undefined);

	const isCollection = type === 'collection';

	useEffect(() => {
		Promise.all([SettingsService.fetchSubjects(), SettingsService.fetchEducationLevels()])
			.then((response: [string[], string[]]) => {
				setSubjects(response[0].map(stringToSelectOption));
				setEducationLevels(response[1].map(stringToSelectOption));
			})
			.catch((err) => {
				console.error(
					new CustomError(
						'Failed to get education levels and subjects from the database',
						err
					)
				);
			});
	}, [setEducationLevels, setSubjects]);

	const updateCollectionMultiProperty = (
		selectedTagOptions: TagInfo[],
		collectionProp: keyof Avo.Collection.Collection
	) => {
		changeCollectionState({
			collectionProp,
			type: 'UPDATE_COLLECTION_PROP',
			collectionPropValue: (selectedTagOptions || []).map((tag) => tag.value as string),
		});
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
											'collection/views/collection-edit-meta-data___onderwijsniveau'
										)}
										labelFor="classificationId"
									>
										<TagsInput
											options={educationLevels}
											value={(collection.lom_context || []).map(
												stringToSelectOption
											)}
											onChange={(values: TagInfo[]) =>
												updateCollectionMultiProperty(values, 'lom_context')
											}
										/>
									</FormGroup>
									<FormGroup
										label={t(
											'collection/views/collection-edit-meta-data___vakken'
										)}
										labelFor="subjectsId"
									>
										<TagsInput
											options={subjects}
											value={(collection.lom_classification || []).map(
												stringToSelectOption
											)}
											onChange={(values: TagInfo[]) =>
												updateCollectionMultiProperty(
													values,
													'lom_classification'
												)
											}
										/>
									</FormGroup>
									<FormGroup
										label={t(
											'collection/views/collection-edit-meta-data___korte-omschrijving'
										)}
										labelFor="shortDescriptionId"
										error={getValidationFeedbackForDescription(
											collection.description,
											MAX_SEARCH_DESCRIPTION_LENGTH,
											(count) =>
												i18n.t(
													'collection/collection___de-korte-omschrijving-is-te-lang-count',
													{ count } as StringMap
												),
											true
										)}
									>
										<TextArea
											name="shortDescriptionId"
											value={collection.description || ''}
											id="shortDescriptionId"
											height="medium"
											placeholder={t(
												'collection/components/collection-or-bundle-edit-meta-data___omschrijf-je-collectie-in-enkele-kernzinnen-dit-is-de-tekst-die-andere-gebruikers-naast-jouw-collectie-of-bundel-te-zien-krijgen-in-de-zoekresultaten'
											)}
											onChange={(value: string) =>
												changeCollectionState({
													type: 'UPDATE_COLLECTION_PROP',
													collectionProp: 'description',
													collectionPropValue: value,
												})
											}
										/>
										<label>
											{getValidationFeedbackForDescription(
												collection.description,
												MAX_SEARCH_DESCRIPTION_LENGTH,
												(count) =>
													t(
														'collection/collection___de-korte-omschrijving-is-te-lang-count',
														{ count } as StringMap
													)
											)}
										</label>
									</FormGroup>
									{!isCollection && (
										<FormGroup
											label={t(
												'collection/components/collection-or-bundle-edit-meta-data___beschrijving'
											)}
											labelFor="longDescriptionId"
											error={getValidationFeedbackForDescription(
												stripHtml(
													descriptionLongEditorState
														? descriptionLongEditorState.toHTML()
														: collection.description_long || ''
												),
												MAX_LONG_DESCRIPTION_LENGTH,
												(count) => {
													return t(
														'collection/components/collection-or-bundle-edit-meta-data___de-beschrijving-is-te-lang-count',
														{
															count,
														} as StringMap
													);
												},
												true
											)}
										>
											<WYSIWYGWrapper
												id="longDescriptionId"
												controls={
													isCollection
														? WYSIWYG_OPTIONS_DEFAULT_NO_TITLES
														: WYSIWYG_OPTIONS_BUNDLE_DESCRIPTION
												}
												initialHtml={collection.description_long || ''}
												state={descriptionLongEditorState}
												onChange={setDescriptionLongEditorState}
												onBlur={() =>
													changeCollectionState({
														type: 'UPDATE_COLLECTION_PROP',
														collectionProp: 'description_long',
														collectionPropValue: sanitizeHtml(
															descriptionLongEditorState
																? descriptionLongEditorState.toHTML()
																: collection.description_long || '',
															'link'
														),
													})
												}
											/>
											<label>
												{getValidationFeedbackForDescription(
													stripHtml(
														descriptionLongEditorState
															? descriptionLongEditorState.toHTML()
															: collection.description_long || ''
													),
													MAX_LONG_DESCRIPTION_LENGTH,
													(count) =>
														t(
															'collection/components/collection-or-bundle-edit-meta-data___de-beschrijving-is-te-lang-count',
															{
																count,
															} as StringMap
														)
												)}
											</label>
										</FormGroup>
									)}
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
									<FormGroup
										label={t(
											'collection/views/collection-edit-meta-data___cover-afbeelding'
										)}
										labelFor="coverImageId"
									>
										{isCollection ? (
											<Button
												type="secondary"
												label={t(
													'collection/views/collection-edit-meta-data___stel-een-afbeelding-in'
												)}
												title={
													isCollection
														? t(
																'collection/components/collection-or-bundle-edit-meta-data___kies-een-afbeelding-om-te-gebruiken-als-de-cover-van-deze-collectie'
														  )
														: t(
																'collection/components/collection-or-bundle-edit-meta-data___kies-een-afbeelding-om-te-gebruiken-als-de-cover-van-deze-bundel'
														  )
												}
												onClick={() => setCollectionsStillsModalOpen(true)}
											/>
										) : (
											<FileUpload
												label={t(
													'collection/components/collection-or-bundle-edit-meta-data___upload-een-cover-afbeelding'
												)}
												urls={
													collection.thumbnail_path
														? [collection.thumbnail_path]
														: []
												}
												allowMulti={false}
												assetType="BUNDLE_COVER"
												ownerId={collection.id}
												onChange={(urls) =>
													changeCollectionState({
														type: 'UPDATE_COLLECTION_PROP',
														collectionProp: 'thumbnail_path',
														collectionPropValue: urls[0] || null,
													})
												}
											/>
										)}
									</FormGroup>
									{/* TODO: DISABLED FEATURE
											{ isCollection &&
												<FormGroup label={t('collection/views/collection-edit-meta-data___map')} labelFor="mapId">
													<Button type="secondary" icon="add" label={t('collection/views/collection-edit-meta-data___voeg-toe-aan-een-map')} />
												</FormGroup>
											}
										*/}
								</Column>
							</Grid>
						</Spacer>
					</Form>
				</Container>
			</Container>
			<CollectionStillsModal
				isOpen={isCollectionsStillsModalOpen}
				onClose={() => setCollectionsStillsModalOpen(false)}
				collection={collection}
			/>
		</>
	);
};

export default CollectionOrBundleEditMetaData;
