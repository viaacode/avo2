import { useMutation } from '@apollo/react-hooks';
import { get } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';

import { Button, Container, Flex, Header, Navbar, Spinner, Tabs } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { selectLogin } from '../../../authentication/store/selectors';
import { navigate } from '../../../shared/helpers';
import toastService from '../../../shared/services/toast-service';
import { ValueOf } from '../../../shared/types';
import { AppState } from '../../../store';
import {
	AdminLayout,
	AdminLayoutActions,
	AdminLayoutBody,
	AdminLayoutHeader,
} from '../../shared/layouts';

import { ContentEditForm } from '../components';
import { CONTENT_EDIT_TABS, CONTENT_PATH, INITIAL_CONTENT_FORM } from '../content.const';
import { INSERT_CONTENT, UPDATE_CONTENT_BY_ID } from '../content.gql';
import { fetchContentItemById, insertContent, updateContent } from '../content.services';
import { ContentEditFormState, PageType } from '../content.types';
import { useContentTypes } from '../hooks/useContentTypes';

interface ContentEditProps extends RouteComponentProps<{ id?: string }> {
	loginState: Avo.Auth.LoginResponse | null;
}

const ContentEdit: FunctionComponent<ContentEditProps> = ({ history, loginState, match }) => {
	// Hooks
	const [contentForm, setContentForm] = useState<ContentEditFormState>(INITIAL_CONTENT_FORM);
	const [formErrors, setFormErrors] = useState<Partial<ContentEditFormState>>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [pageType, setPageType] = useState<PageType | undefined>();

	const { contentTypes, isLoadingContentTypes } = useContentTypes();

	const [triggerContentInsert] = useMutation(INSERT_CONTENT);
	const [triggerContentUpdate] = useMutation(UPDATE_CONTENT_BY_ID);

	const { id } = match.params;
	const pageTitle = `Content ${pageType === PageType.Create ? 'toevoegen' : 'aanpassen'}`;
	const contentTypeOptions = [
		{ label: 'Kies een content type', value: '', disabled: true },
		...contentTypes.map(contentType => ({
			label: contentType.value,
			value: contentType.value,
		})),
	];

	useEffect(() => {
		if (id) {
			setPageType(PageType.Edit);
			setIsLoading(true);

			fetchContentItemById(Number(id))
				.then((contentItem: Avo.Content.Content | null) => {
					if (contentItem) {
						setContentForm({
							title: contentItem.title,
							description: contentItem.description || '',
							contentType: contentItem.content_type,
							publishAt: contentItem.publish_at || '',
							depublishAt: contentItem.depublish_at || '',
						});
					}
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			setPageType(PageType.Create);
		}
	}, [id]);

	// Methods
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
		} else {
			toastService.danger('Er ging iets mis tijden het opslaan van het content item', false);
		}
	};

	const handleSave = async () => {
		setIsSaving(true);

		// Validate form
		const isFormValid = handleValidation();

		if (!isFormValid) {
			setIsSaving(false);

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
			const insertedContent = await insertContent(triggerContentInsert, {
				...contentItem,
				user_profile_id: get(loginState, 'userInfo.profile.id', null),
			});

			handleResponse(insertedContent);
		} else {
			const updatedContent = await updateContent(triggerContentUpdate, {
				...contentItem,
				updated_at: new Date().toISOString(),
				id: Number(id),
			});

			handleResponse(updatedContent);
		}
	};

	const handleValidation = () => {
		const errors: Partial<ContentEditFormState> = {};

		if (!contentForm.title) {
			errors.title = 'Titel is verplicht';
		}

		if (!contentForm.contentType) {
			errors.contentType = 'Content type is verplicht';
		}

		setFormErrors(errors);

		return Object.keys(errors).length === 0;
	};

	const navigateBack = () => {
		if (pageType === PageType.Create) {
			history.push(CONTENT_PATH.CONTENT);
		} else {
			navigate(history, CONTENT_PATH.CONTENT, { id });
		}
	};

	// Render
	return isLoading || isLoadingContentTypes ? (
		<Flex orientation="horizontal" center>
			<Spinner size="large" />
		</Flex>
	) : (
		<AdminLayout navigateBack={navigateBack}>
			<AdminLayoutHeader>
				<Header category="audio" categoryLabel="" title={pageTitle} showMetaData={false} />
				<Navbar background="alt" placement="top" autoHeight>
					<Container mode="horizontal">
						<Tabs tabs={CONTENT_EDIT_TABS} onClick={() => {}} />
					</Container>
				</Navbar>
			</AdminLayoutHeader>
			<AdminLayoutBody>
				<ContentEditForm
					contentTypeOptions={contentTypeOptions}
					formErrors={formErrors}
					formState={contentForm}
					onChange={handleChange}
				/>
			</AdminLayoutBody>
			<AdminLayoutActions>
				<Button disabled={isSaving} label="Opslaan" onClick={handleSave} />
				<Button label="Annuleer" onClick={navigateBack} type="tertiary" />
			</AdminLayoutActions>
		</AdminLayout>
	);
};

const mapStateToProps = (state: AppState) => ({
	loginState: selectLogin(state),
});

export default withRouter(connect(mapStateToProps)(ContentEdit));
