import { get, has, isFunction, isNil, without } from 'lodash-es';
import React, {
	FunctionComponent,
	Reducer,
	useCallback,
	useEffect,
	useReducer,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import { Button, ButtonToolbar, Container, Navbar, Tabs } from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { getProfileId } from '../../../authentication/helpers/get-profile-id';
import {
	PermissionName,
	PermissionService,
} from '../../../authentication/helpers/permission-service';
import { GENERATE_SITE_TITLE } from '../../../constants';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { CustomError, navigate } from '../../../shared/helpers';
import { useTabs } from '../../../shared/hooks';
import { ToastService } from '../../../shared/services';
import { ContentPageService } from '../../../shared/services/content-page-service';
import { ADMIN_PATH } from '../../admin.const';
import { CONTENT_BLOCK_INITIAL_STATE_MAP } from '../../content-block/content-block.const';
import { validateContentBlockField } from '../../shared/helpers';
import {
	AdminLayout,
	AdminLayoutBody,
	AdminLayoutHeader,
	AdminLayoutTopBarRight,
} from '../../shared/layouts';
import {
	ContentBlockComponentState,
	ContentBlockConfig,
	ContentBlockErrors,
	ContentBlockStateOption,
	ContentBlockStateType,
	ContentBlockType,
	RepeatedContentBlockComponentState,
	SingleContentBlockComponentState,
} from '../../shared/types';
import { ContentEditForm } from '../components';
import { CONTENT_PATH, GET_CONTENT_DETAIL_TABS } from '../content.const';
import { ContentService } from '../content.service';
import {
	ContentEditActionType,
	ContentEditFormErrors,
	ContentPageInfo,
	PageType,
} from '../content.types';
import {
	CONTENT_PAGE_INITIAL_STATE,
	ContentEditAction,
	contentEditReducer,
	ContentPageEditState,
} from '../helpers/reducers';
import { useContentTypes } from '../hooks';

import './ContentEdit.scss';
import ContentEditContentBlocks from './ContentEditContentBlocks';

interface ContentEditProps extends DefaultSecureRouteProps<{ id?: string }> {}

const { EDIT_ANY_CONTENT_PAGES, EDIT_OWN_CONTENT_PAGES } = PermissionName;

const ContentEdit: FunctionComponent<ContentEditProps> = ({ history, match, user }) => {
	const { id } = match.params;

	// Hooks
	const [contentPageState, changeContentPageState] = useReducer<
		Reducer<ContentPageEditState, ContentEditAction>
	>(contentEditReducer, {
		currentContentPageInfo: CONTENT_PAGE_INITIAL_STATE(),
		initialContentPageInfo: CONTENT_PAGE_INITIAL_STATE(),
	});

	const [formErrors, setFormErrors] = useState<ContentEditFormErrors>({});
	const [configToDelete, setConfigToDelete] = useState<number>();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

	const [t] = useTranslation();

	const [contentTypes, isLoadingContentTypes] = useContentTypes();
	const [currentTab, setCurrentTab, tabs] = useTabs(GET_CONTENT_DETAIL_TABS(), 'inhoud');

	const hasPerm = useCallback(
		(permission: PermissionName) => PermissionService.hasPerm(user, permission),
		[user]
	);

	const fetchContentPage = useCallback(async () => {
		try {
			if (isNil(id)) {
				return;
			}
			if (
				!hasPerm(PermissionName.EDIT_ANY_CONTENT_PAGES) &&
				!hasPerm(PermissionName.EDIT_OWN_CONTENT_PAGES)
			) {
				setLoadingInfo({
					state: 'error',
					message: t(
						'admin/content/views/content-edit___je-hebt-geen-rechten-om-deze-content-pagina-te-bekijken'
					),
					icon: 'lock',
				});
				return;
			}
			const contentPageObj = await ContentService.getContentPageById(id);
			if (
				!hasPerm(PermissionName.EDIT_ANY_CONTENT_PAGES) &&
				contentPageObj.user_profile_id !== getProfileId(user)
			) {
				setLoadingInfo({
					state: 'error',
					message: t(
						'admin/content/views/content-edit___je-hebt-geen-rechten-om-deze-content-pagina-te-bekijken'
					),
					icon: 'lock',
				});
				return;
			}
			changeContentPageState({
				type: ContentEditActionType.SET_CONTENT_PAGE,
				payload: {
					contentPageInfo: contentPageObj,
					replaceInitial: true,
				},
			});
		} catch (err) {
			console.error(new CustomError('Failed to load content page', err, { id }));
			ToastService.danger(
				t('admin/content/views/content-edit___het-laden-van-deze-content-pagina-is-mislukt')
			);
		}
	}, [id, user, hasPerm, t]);

	const onPasteContentBlock = useCallback(
		(evt: ClipboardEvent) => {
			try {
				if (evt.clipboardData && evt.clipboardData.getData) {
					const pastedText = evt.clipboardData.getData('text/plain');

					if (pastedText.startsWith('{"block":')) {
						const newConfig = JSON.parse(pastedText).block;
						delete newConfig.id;
						// Ensure block is added at the bottom of the page
						newConfig.position = (
							contentPageState.currentContentPageInfo.contentBlockConfigs || []
						).length;
						changeContentPageState({
							type: ContentEditActionType.ADD_CONTENT_BLOCK_CONFIG,
							payload: newConfig,
						});

						ToastService.success(
							t('admin/content/views/content-edit___de-blok-is-toegevoegd')
						);
					}
				}
			} catch (err) {
				console.error(new CustomError('Failed to paste content block', err));
				ToastService.danger(
					t(
						'admin/content/views/content-edit___het-plakken-van-het-content-blok-is-mislukt'
					)
				);
			}
		},
		[changeContentPageState, contentPageState.currentContentPageInfo.contentBlockConfigs, t]
	);

	useEffect(() => {
		fetchContentPage();
	}, [fetchContentPage]);

	useEffect(() => {
		if (contentPageState.currentContentPageInfo && !isLoadingContentTypes) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [contentPageState.currentContentPageInfo, isLoadingContentTypes]);

	useEffect(() => {
		document.body.addEventListener('paste', onPasteContentBlock);

		return () => {
			document.body.removeEventListener('paste', onPasteContentBlock);
		};
	}, [onPasteContentBlock]);

	// Computed
	const pageType = id ? PageType.Edit : PageType.Create;
	let pageTitle = t('admin/content/views/content-edit___content-toevoegen');
	if (pageType !== PageType.Create) {
		pageTitle = `${t('admin/content/views/content-edit___content-aanpassen')}: ${get(
			contentPageState.currentContentPageInfo,
			'title',
			''
		)}`;
	}

	// Methods
	const openDeleteModal = (configIndex: number) => {
		setIsDeleteModalOpen(true);
		setConfigToDelete(configIndex);
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setHasSubmitted(true);

			// Validate form
			const isFormValid = await handleValidation();
			let areConfigsValid = true;

			if (!hasSubmitted) {
				setHasSubmitted(true);
			}

			// Remove rich text editor states, since they are also saved as html,
			// and we don't want those states to end up in the database
			const blockConfigs: ContentBlockConfig[] = contentPageState.currentContentPageInfo
				.contentBlockConfigs
				? ContentService.convertRichTextEditorStatesToHtml(
						contentPageState.currentContentPageInfo.contentBlockConfigs
				  )
				: [];

			// Run validators on to check untouched inputs
			blockConfigs.forEach((config, configIndex) => {
				const { fields, state } = config.components;
				const keysToValidate = Object.keys(fields).filter((key) => fields[key].validator);
				let newErrors: ContentBlockErrors = {};

				if (keysToValidate.length > 0) {
					keysToValidate.forEach((key) => {
						const validator = fields[key].validator;

						if (validator && isFunction(validator)) {
							if (Array.isArray(state) && state.length > 0) {
								state.forEach(
									(
										singleState: ContentBlockComponentState,
										stateIndex: number
									) => {
										newErrors = validateContentBlockField(
											key,
											validator,
											newErrors,
											singleState[key as keyof ContentBlockComponentState],
											stateIndex
										);
									}
								);
							} else if (has(state, key)) {
								newErrors = validateContentBlockField(
									key,
									validator,
									newErrors,
									state[key as keyof ContentBlockComponentState]
								);
							}
						}
					});
					areConfigsValid = Object.keys(newErrors).length === 0;
					changeContentPageState({
						type: ContentEditActionType.SET_CONTENT_BLOCK_ERROR,
						payload: { configIndex, errors: newErrors },
					});
				}
			});

			if (!isFormValid || !areConfigsValid) {
				setIsSaving(false);
				if (!isFormValid) {
					ToastService.danger(
						t(
							'admin/content/views/content-edit___er-zijn-nog-fouten-in-het-metadata-formulier'
						)
					);
				}
				if (!areConfigsValid) {
					ToastService.danger(
						t(
							'admin/content/views/content-edit___er-zijn-nog-fouten-in-de-content-blocks'
						)
					);
				}

				return;
			}

			let insertedOrUpdatedContent: Partial<ContentPageInfo> | null;
			if (pageType === PageType.Create) {
				const contentBody = {
					...contentPageState.currentContentPageInfo,
					user_profile_id: getProfileId(user),
					contentBlockConfigs: blockConfigs,
					path: ContentService.getPathOrDefault(contentPageState.currentContentPageInfo),
				};
				insertedOrUpdatedContent = await ContentService.insertContentPage(contentBody);
			} else {
				if (!isNil(id)) {
					const contentBody = {
						...contentPageState.currentContentPageInfo,
						updated_at: new Date().toISOString(),
						id: parseInt(id, 10),
						contentBlockConfigs: blockConfigs,
						path: ContentService.getPathOrDefault(
							contentPageState.currentContentPageInfo
						),
					};
					insertedOrUpdatedContent = await ContentService.updateContentPage(
						contentBody,
						contentPageState.initialContentPageInfo
					);
				} else {
					throw new CustomError(
						'failed to update content page because the id is undefined',
						null,
						{
							id,
							contentPageInfo: contentPageState.currentContentPageInfo,
						}
					);
				}
			}

			if (!insertedOrUpdatedContent || isNil(insertedOrUpdatedContent.id)) {
				throw new CustomError(
					'Failed to save labels because no response or response does not contain a valid id',
					null,
					{
						insertedOrUpdatedContent,
						contentPageInfo: contentPageState.currentContentPageInfo,
						isCreatePage: pageType === PageType.Create,
					}
				);
			}

			// Save content labels
			const initialLabelIds = (contentPageState.initialContentPageInfo.labels || []).map(
				(label: any) => label.id as number
			);
			const labelIds = (contentPageState.currentContentPageInfo.labels || []).map(
				(label: any) => label.id as number
			);
			const addedLabelIds = without(labelIds, ...initialLabelIds);
			const removedLabelIds = without(initialLabelIds, ...labelIds);
			await Promise.all([
				ContentService.insertContentLabelsLinks(insertedOrUpdatedContent.id, addedLabelIds),
				ContentService.deleteContentLabelsLinks(
					insertedOrUpdatedContent.id,
					removedLabelIds
				),
			]);

			ToastService.success(
				t('admin/content/views/content-edit___het-content-item-is-succesvol-opgeslagen')
			);
			navigate(history, CONTENT_PATH.CONTENT_PAGE_DETAIL, {
				id: insertedOrUpdatedContent.id,
			});
		} catch (err) {
			console.error(new CustomError('Failed to save content page ', err));
			ToastService.danger(
				t('admin/content/views/content-edit___het-opslaan-van-de-content-pagina-is-mislukt')
			);
		}

		setIsSaving(false);
	};

	const handleValidation = async (): Promise<boolean> => {
		const errors: ContentEditFormErrors = {};

		if (!contentPageState.currentContentPageInfo.title) {
			errors.title = t('admin/content/views/content-edit___titel-is-verplicht');
		}

		if (!contentPageState.currentContentPageInfo.content_type) {
			errors.content_type = t('admin/content/views/content-edit___content-type-is-verplicht');
		}

		// check if the path is unique
		const path = ContentService.getPathOrDefault(contentPageState.currentContentPageInfo);

		try {
			const page: ContentPageInfo | null = await ContentPageService.getContentPageByPath(
				path
			);
			if (page && String(page.id) !== id) {
				errors.path = t(
					'admin/content/views/content-edit___dit-path-is-reeds-gebruikt-door-pagina-page-title',
					{
						pageTitle: page.title,
					}
				);
			} else {
				delete errors.path;
			}
		} catch (err) {
			// ignore error if content page does not exist yet, since we're trying to save it
		}

		if (
			contentPageState.currentContentPageInfo.publish_at &&
			contentPageState.currentContentPageInfo.depublish_at &&
			new Date(contentPageState.currentContentPageInfo.depublish_at) <
				new Date(contentPageState.currentContentPageInfo.publish_at)
		) {
			errors.depublish_at = t(
				'admin/content/views/content-edit___depublicatie-moet-na-publicatie-datum'
			);
		}

		setFormErrors(errors);

		return Object.keys(errors).length === 0;
	};

	const navigateBack = () => {
		if (pageType === PageType.Create) {
			history.push(CONTENT_PATH.CONTENT_PAGE_OVERVIEW);
		} else {
			navigate(history, CONTENT_PATH.CONTENT_PAGE_DETAIL, { id });
		}
	};

	const addComponentToState = (index: number, blockType: ContentBlockType) => {
		changeContentPageState({
			type: ContentEditActionType.ADD_COMPONENTS_STATE,
			payload: {
				index,
				formGroupState: CONTENT_BLOCK_INITIAL_STATE_MAP[blockType](),
			},
		});
	};

	const removeComponentFromState = (index: number, stateIndex: number) => {
		changeContentPageState({
			type: ContentEditActionType.REMOVE_COMPONENTS_STATE,
			payload: {
				index,
				stateIndex,
			},
		});
	};

	const handleStateSave = (
		index: number,
		formGroupType: ContentBlockStateType,
		formGroupState: ContentBlockStateOption,
		stateIndex?: number
	) => {
		if (formGroupType === 'block') {
			changeContentPageState({
				type: ContentEditActionType.SET_BLOCK_STATE,
				payload: {
					index,
					formGroupState: (Array.isArray(formGroupState)
						? formGroupState[0]
						: formGroupState) as
						| SingleContentBlockComponentState
						| RepeatedContentBlockComponentState,
				},
			});
		} else {
			changeContentPageState({
				type: ContentEditActionType.SET_COMPONENTS_STATE,
				payload: {
					index,
					stateIndex,
					formGroupState: Array.isArray(formGroupState)
						? (formGroupState[0] as Partial<ContentBlockComponentState>)
						: formGroupState,
				},
			});
		}
	};

	// Render
	const renderTabContent = () => {
		switch (currentTab) {
			case 'inhoud':
				return (
					<ContentEditContentBlocks
						contentPageInfo={contentPageState.currentContentPageInfo}
						hasSubmitted={hasSubmitted}
						addComponentToState={addComponentToState}
						removeComponentFromState={removeComponentFromState}
						changeContentPageState={changeContentPageState}
						onRemove={openDeleteModal}
						onSave={handleStateSave}
					/>
				);
			case 'metadata':
				return (
					<ContentEditForm
						contentTypes={contentTypes}
						formErrors={formErrors}
						contentPageInfo={contentPageState.currentContentPageInfo}
						changeContentPageState={changeContentPageState}
						user={user}
					/>
				);
			default:
				return null;
		}
	};

	const renderEditContentPage = () => {
		const contentPageOwner = contentPageState.initialContentPageInfo.user_profile_id;
		const isOwner = contentPageOwner ? get(user, 'profile.id') === contentPageOwner : true;
		const isAllowedToSave =
			hasPerm(EDIT_ANY_CONTENT_PAGES) || (hasPerm(EDIT_OWN_CONTENT_PAGES) && isOwner);

		return (
			<div>
				<AdminLayout
					onClickBackButton={() => navigate(history, ADMIN_PATH.CONTENT_PAGE_OVERVIEW)}
					pageTitle={pageTitle}
					size="no-margin"
				>
					<AdminLayoutTopBarRight>
						<ButtonToolbar>
							<Button
								label={t('admin/content/views/content-edit___annuleer')}
								onClick={navigateBack}
								type="tertiary"
							/>
							{isAllowedToSave && (
								<Button
									disabled={isSaving}
									label={t('admin/content/views/content-edit___opslaan')}
									onClick={handleSave}
								/>
							)}
						</ButtonToolbar>
					</AdminLayoutTopBarRight>
					<AdminLayoutHeader>
						<Navbar background="alt" placement="top" autoHeight>
							<Container mode="horizontal">
								<Tabs tabs={tabs} onClick={setCurrentTab} />
							</Container>
						</Navbar>
					</AdminLayoutHeader>
					<AdminLayoutBody>
						<MetaTags>
							<title>
								{GENERATE_SITE_TITLE(
									get(contentPageState.currentContentPageInfo, 'title'),
									pageType === PageType.Create
										? t(
												'admin/content/views/content-edit___content-beheer-aanmaak-pagina-titel'
										  )
										: t(
												'admin/content/views/content-edit___content-beheer-bewerk-pagina-titel'
										  )
								)}
							</title>
							<meta
								name="description"
								content={get(
									contentPageState.currentContentPageInfo,
									'description'
								)}
							/>
						</MetaTags>
						{renderTabContent()}
						<DeleteObjectModal
							deleteObjectCallback={() => {
								if (!isNil(configToDelete)) {
									changeContentPageState({
										type: ContentEditActionType.REMOVE_CONTENT_BLOCK_CONFIG,
										payload: configToDelete,
									});
								}
							}}
							isOpen={isDeleteModalOpen}
							onClose={() => setIsDeleteModalOpen(false)}
						/>
					</AdminLayoutBody>
				</AdminLayout>
			</div>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={contentPageState.currentContentPageInfo}
			render={renderEditContentPage}
		/>
	);
};

export default ContentEdit;
