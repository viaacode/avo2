import { useMutation } from '@apollo/react-hooks';
import React, { FunctionComponent, Reducer, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	ButtonToolbar,
	Container,
	Flex,
	Header,
	HeaderButtons,
	Navbar,
	Spinner,
	Tabs,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { getProfileId } from '../../../authentication/helpers/get-profile-info';
import { navigate } from '../../../shared/helpers';
import { useTabs } from '../../../shared/hooks';
import toastService from '../../../shared/services/toast-service';
import { ValueOf } from '../../../shared/types';
import { CONTENT_BLOCK_INITIAL_STATE_MAP } from '../../content-block/content-block.const';
import { parseContentBlocks } from '../../content-block/content-block.services';
import {
	ContentBlockConfig,
	ContentBlockStateOptions,
	ContentBlockStateType,
	ContentBlockType,
} from '../../content-block/content-block.types';
import { useContentBlocksByContentId } from '../../content-block/hooks';
import { AdminLayout, AdminLayoutBody, AdminLayoutHeader } from '../../shared/layouts';

import { ContentEditForm } from '../components';
import { CONTENT_DETAIL_TABS, CONTENT_PATH } from '../content.const';
import { INSERT_CONTENT, UPDATE_CONTENT_BY_ID } from '../content.gql';
import * as ContentService from '../content.services';
import {
	ContentEditAction,
	ContentEditActionType,
	ContentEditFormState,
	ContentEditState,
	PageType,
} from '../content.types';
import { CONTENT_EDIT_INITIAL_STATE, contentEditReducer } from '../helpers/reducer';
import { useContentItem, useContentTypes } from '../hooks';
import ContentEditContentBlocks from './ContentEditContentBlocks';

import './ContentEdit.scss';

interface ContentEditProps extends DefaultSecureRouteProps<{ id?: string }> {}

const ContentEdit: FunctionComponent<ContentEditProps> = ({ history, match, user }) => {
	const [t] = useTranslation();

	const { id } = match.params;
	const initialState = CONTENT_EDIT_INITIAL_STATE();

	// Hooks
	const [{ contentBlockConfigs }, dispatch] = useReducer<
		Reducer<ContentEditState, ContentEditAction>
	>(contentEditReducer(initialState), initialState);

	const [formErrors, setFormErrors] = useState<Partial<ContentEditFormState>>({});
	const [isSaving, setIsSaving] = useState<boolean>(false);

	const [contentForm, setContentForm, isLoading] = useContentItem(history, id);
	const [contentTypes, isLoadingContentTypes] = useContentTypes();
	const [contentBlocks, isLoadingContentBlocks] = useContentBlocksByContentId(id);
	const [currentTab, setCurrentTab, tabs] = useTabs(CONTENT_DETAIL_TABS, 'inhoud');

	useEffect(() => {
		if (contentBlocks.length) {
			dispatch({
				type: ContentEditActionType.SET_CONTENT_BLOCK_CONFIGS,
				payload: parseContentBlocks(contentBlocks),
			});
		}
	}, [contentBlocks]);

	const [triggerContentInsert] = useMutation(INSERT_CONTENT);
	const [triggerContentUpdate] = useMutation(UPDATE_CONTENT_BY_ID);

	// Computed
	const pageType = id ? PageType.Edit : PageType.Create;
	const pageTitle = `Content ${pageType === PageType.Create ? 'toevoegen' : 'aanpassen'}`;
	const contentTypeOptions = [
		{ label: 'Kies een content type', value: '', disabled: true },
		...contentTypes.map(contentType => ({
			label: contentType.value,
			value: contentType.value,
		})),
	];

	// Methods
	const addContentBlockConfig = (newConfig: ContentBlockConfig) => {
		dispatch({
			type: ContentEditActionType.ADD_CONTENT_BLOCK_CONFIG,
			payload: newConfig,
		});
	};

	const handleChange = (key: keyof ContentEditFormState, value: ValueOf<ContentEditFormState>) => {
		setContentForm({
			...contentForm,
			[key]: value,
		});
	};

	const handleResponse = (response: Partial<Avo.Content.Content> | null) => {
		setIsSaving(false);

		if (response) {
			toastService.success('Het content item is succesvol opgeslagen', false);
			navigate(history, CONTENT_PATH.CONTENT_DETAIL, { id: response.id });
		}
	};

	const handleSave = async () => {
		setIsSaving(true);

		// Validate form
		const isFormValid = handleValidation();

		if (!isFormValid) {
			setIsSaving(false);
			toastService.danger('Er zijn nog fouten in het metadata formulier', false);

			return;
		}

		const contentItem: Partial<Avo.Content.Content> = {
			title: contentForm.title,
			description: contentForm.description || null,
			content_type: contentForm.contentType,
			publish_at: contentForm.publishAt || null,
			depublish_at: contentForm.depublishAt || null,
		};

		if (pageType === PageType.Create) {
			const contentBody = { ...contentItem, user_profile_id: getProfileId(user) };
			const insertedContent = await ContentService.insertContent(
				contentBody,
				contentBlockConfigs,
				triggerContentInsert
			);

			handleResponse(insertedContent);
		} else {
			if (id) {
				const contentBody = {
					...contentItem,
					updated_at: new Date().toISOString(),
					id: parseInt(id, 10),
				};
				const updatedContent = await ContentService.updateContent(
					contentBody,
					contentBlockConfigs,
					triggerContentUpdate
				);

				handleResponse(updatedContent);
			} else {
				toastService.danger(`Het content id: ${id} is ongeldig.`, false);
				history.push(CONTENT_PATH.CONTENT);
			}
		}
	};

	const handleValidation = () => {
		const errors: Partial<ContentEditFormState> = {};
		const hasPublicationAndDePublicationDates = contentForm.publishAt && contentForm.depublishAt;

		if (!contentForm.title) {
			errors.title = 'Titel is verplicht';
		}

		if (!contentForm.contentType) {
			errors.contentType = 'Content type is verplicht';
		}

		if (
			hasPublicationAndDePublicationDates &&
			new Date(contentForm.depublishAt) < new Date(contentForm.publishAt)
		) {
			errors.depublishAt = 'Depublicatie moet na publicatie datum';
		}

		setFormErrors(errors);

		return Object.keys(errors).length === 0;
	};

	const navigateBack = () => {
		if (pageType === PageType.Create) {
			history.push(CONTENT_PATH.CONTENT);
		} else {
			navigate(history, CONTENT_PATH.CONTENT_DETAIL, { id });
		}
	};

	const addComponentToState = (index: number, blockType: ContentBlockType) => {
		dispatch({
			type: ContentEditActionType.ADD_COMPONENTS_STATE,
			payload: {
				index,
				formGroupState: CONTENT_BLOCK_INITIAL_STATE_MAP[blockType],
			},
		});
	};

	const removeComponentFromState = (index: number, stateIndex: number) => {
		dispatch({
			type: ContentEditActionType.REMOVE_COMPONENTS_STATE,
			payload: {
				index,
				stateIndex,
			},
		});
	};

	const handleCSave = (
		// TODO: FIX NAME
		index: number,
		formGroupType: ContentBlockStateType,
		formGroupState: ContentBlockStateOptions,
		stateIndex?: number
	) => {
		dispatch({
			type:
				formGroupType === 'block'
					? ContentEditActionType.SET_BLOCK_STATE
					: ContentEditActionType.SET_COMPONENTS_STATE,
			payload: {
				index,
				stateIndex,
				formGroupType,
				formGroupState: Array.isArray(formGroupState) ? formGroupState[0] : formGroupState,
			},
		});
	};

	// Render
	const renderTabContent = () => {
		switch (currentTab) {
			case 'inhoud':
				return (
					<ContentEditContentBlocks
						contentBlockConfigs={contentBlockConfigs}
						onAdd={addContentBlockConfig}
						onSave={handleCSave}
						addComponentToState={addComponentToState}
						removeComponentFromState={removeComponentFromState}
					/>
				);
			case 'metadata':
				return (
					<ContentEditForm
						contentTypeOptions={contentTypeOptions}
						formErrors={formErrors}
						formState={contentForm}
						onChange={handleChange}
					/>
				);
			default:
				return null;
		}
	};

	return isLoading || isLoadingContentTypes || isLoadingContentBlocks ? (
		<Flex orientation="horizontal" center>
			<Spinner size="large" />
		</Flex>
	) : (
		<AdminLayout navigateBack={navigateBack}>
			<AdminLayoutHeader>
				<Header category="audio" title={pageTitle} showMetaData={false}>
					<HeaderButtons>
						<ButtonToolbar>
							<Button
								disabled={isSaving}
								label={t('admin/content/views/content-edit___opslaan')}
								onClick={handleSave}
							/>
							<Button
								label={t('admin/content/views/content-edit___annuleer')}
								onClick={navigateBack}
								type="tertiary"
							/>
						</ButtonToolbar>
					</HeaderButtons>
				</Header>
				<Navbar background="alt" placement="top" autoHeight>
					<Container mode="horizontal">
						<Tabs tabs={tabs} onClick={setCurrentTab} />
					</Container>
				</Navbar>
			</AdminLayoutHeader>
			<AdminLayoutBody>{renderTabContent()}</AdminLayoutBody>
		</AdminLayout>
	);
};

export default ContentEdit;
