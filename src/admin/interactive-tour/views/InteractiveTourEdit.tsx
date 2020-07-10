import { cloneDeep, compact, get, isEmpty, isEqual, map, orderBy } from 'lodash-es';
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

import {
	BlockHeading,
	Box,
	Button,
	ButtonToolbar,
	Container,
	Flex,
	FlexItem,
	Form,
	FormGroup,
	Icon,
	IconName,
	Panel,
	PanelBody,
	PanelHeader,
	Select,
	SelectOption,
	Spacer,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../../constants';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../shared/components';
import Html from '../../../shared/components/Html/Html';
import WYSIWYGWrapper from '../../../shared/components/WYSIWYGWrapper/WYSIWYGWrapper';
import { ROUTE_PARTS, WYSIWYG_OPTIONS_FULL } from '../../../shared/constants';
import { buildLink, CustomError, navigate, sanitizeHtml, stripHtml } from '../../../shared/helpers';
import { dataService, ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { ContentPicker } from '../../shared/components/ContentPicker/ContentPicker';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { PickerItem } from '../../shared/types';
import InteractiveTourAdd from '../components/InteractiveTourStepAdd';
import {
	INTERACTIVE_TOUR_EDIT_INITIAL_STATE,
	InteractiveTourAction,
	interactiveTourEditReducer,
} from '../helpers/reducers';
import {
	getInitialInteractiveTour,
	INTERACTIVE_TOUR_PATH,
	MAX_STEP_TEXT_LENGTH,
	MAX_STEP_TITLE_LENGTH,
} from '../interactive-tour.const';
import { GET_INTERACTIVE_TOUR_BY_ID } from '../interactive-tour.gql';
import { InteractiveTourService } from '../interactive-tour.service';
import {
	EditableInteractiveTour,
	EditableStep,
	InteractiveTourEditActionType,
	InteractiveTourEditFormErrorState,
	InteractiveTourPageType,
	InteractiveTourState,
} from '../interactive-tour.types';

import './InteractiveTourEdit.scss';

export interface InteractiveTourEditProps extends DefaultSecureRouteProps<{ id: string }> {}

const InteractiveTourEdit: FunctionComponent<InteractiveTourEditProps> = ({
	history,
	match,
	location,
}) => {
	const [t] = useTranslation();

	// Hooks
	const [formErrors, setFormErrors] = useState<InteractiveTourEditFormErrorState>({});
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [selectedPageType, setSelectedPageType] = useState<InteractiveTourPageType>('static');

	const isCreatePage: boolean = location.pathname.includes(`/${ROUTE_PARTS.create}`);

	const [interactiveTourState, changeInteractiveTourState] = useReducer<
		Reducer<InteractiveTourState, InteractiveTourAction>
	>(interactiveTourEditReducer, INTERACTIVE_TOUR_EDIT_INITIAL_STATE());

	/**
	 * Returns a list op select options for all pages that can have an interactive tour sorted by label
	 */
	const getPageOptions = useCallback((): SelectOption<string>[] => {
		return orderBy(
			compact(
				map(APP_PATH, (routeInfo, routeId): SelectOption<string> | null => {
					if (routeInfo.showForInteractiveTour) {
						return {
							label: routeInfo.route,
							value: routeId,
						};
					}
					return null;
				})
			),
			['label'],
			['asc']
		);
	}, []);

	const getPageType = useCallback(
		(pageId: string): InteractiveTourPageType => {
			const staticPageIds = getPageOptions().map(pageOption => pageOption.value);
			return staticPageIds.includes(pageId) ? 'static' : 'content';
		},
		[getPageOptions]
	);

	const initOrFetchInteractiveTour = useCallback(async () => {
		if (isCreatePage) {
			changeInteractiveTourState({
				type: InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR,
				newInteractiveTour: getInitialInteractiveTour(),
				updateInitialInteractiveTour: true,
			});
		} else {
			try {
				const response = await dataService.query({
					query: GET_INTERACTIVE_TOUR_BY_ID,
					variables: { id: match.params.id },
				});

				const interactiveTourObj: EditableInteractiveTour | undefined = get(
					response,
					'data.app_interactive_tour[0]'
				);

				if (!interactiveTourObj) {
					setLoadingInfo({
						state: 'error',
						icon: 'search',
						message: t(
							'admin/interactive-tour/views/interactive-tour-edit___deze-interactieve-tour-werd-niet-gevonden'
						),
					});
					return;
				}

				changeInteractiveTourState({
					type: InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR,
					newInteractiveTour: interactiveTourObj,
					updateInitialInteractiveTour: true,
				});
				setSelectedPageType(getPageType(interactiveTourObj.page_id));
			} catch (err) {
				console.error(
					new CustomError('Failed to get interactive tour by id', err, {
						query: 'GET_INTERACTIVE_TOUR_BY_ID',
						variables: { id: match.params.id },
					})
				);
				setLoadingInfo({
					state: 'error',
					message: t(
						'admin/interactive-tour/views/interactive-tour-edit___het-ophalen-van-de-interactive-tour-is-mislukt'
					),
				});
			}
		}
	}, [setLoadingInfo, changeInteractiveTourState, t, isCreatePage, getPageType, match.params.id]);

	useEffect(() => {
		initOrFetchInteractiveTour();
	}, [initOrFetchInteractiveTour]);

	useEffect(() => {
		if (interactiveTourState.currentInteractiveTour) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [interactiveTourState.currentInteractiveTour, setLoadingInfo]);

	const navigateBack = () => {
		if (isCreatePage) {
			history.push(INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_OVERVIEW);
		} else {
			navigate(history, INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_DETAIL, {
				id: match.params.id,
			});
		}
	};

	const getFormErrors = (): InteractiveTourEditFormErrorState | null => {
		const errors: InteractiveTourEditFormErrorState = {};
		if (
			!interactiveTourState.currentInteractiveTour ||
			!interactiveTourState.currentInteractiveTour.name
		) {
			errors.name = t(
				'admin/interactive-tour/views/interactive-tour-edit___een-naam-is-verplicht'
			);
		}
		if (
			!interactiveTourState.currentInteractiveTour ||
			!interactiveTourState.currentInteractiveTour.page_id
		) {
			errors.page_id = t(
				'admin/interactive-tour/views/interactive-tour-edit___een-pagina-is-verplicht'
			);
		}
		get(interactiveTourState.currentInteractiveTour, 'steps', []).forEach((step, index) => {
			if (step.title.length > MAX_STEP_TITLE_LENGTH) {
				errors.steps = errors.steps || [];
				errors.steps[index] = {
					...(errors.steps[index] || {}),
					title: t(
						'admin/interactive-tour/views/interactive-tour-edit___de-titel-is-te-lang'
					),
				};
			}
			if (step.title.length > MAX_STEP_TEXT_LENGTH) {
				errors.steps = errors.steps || [];
				errors.steps[index] = {
					...(errors.steps[index] || {}),
					content: t(
						'admin/interactive-tour/views/interactive-tour-edit___de-tekst-is-te-lang'
					),
				};
			}
		});
		return isEmpty(errors) ? null : errors;
	};

	const convertTourContentToHtml = (
		tour: EditableInteractiveTour
	): Avo.InteractiveTour.InteractiveTour => {
		const clonedTour = cloneDeep(tour);
		clonedTour.steps.forEach((step: EditableStep) => {
			if (step.contentState) {
				step.content = sanitizeHtml(step.contentState.toHTML(), 'link');
				delete step.contentState;
			}
		});
		return clonedTour;
	};

	const handleSave = async () => {
		try {
			const errors = getFormErrors();
			setFormErrors(errors || {});
			if (errors) {
				ToastService.danger(
					t('admin/interactive-tour/views/interactive-tour-edit___de-invoer-is-ongeldig'),
					false
				);
				return;
			}

			if (
				!interactiveTourState.initialInteractiveTour ||
				!interactiveTourState.currentInteractiveTour
			) {
				ToastService.danger(
					t(
						'admin/interactive-tour/views/interactive-tour-edit___het-opslaan-van-de-interactive-tour-is-mislukt-omdat-de-interactive-tour-nog-niet-is-geladen'
					),
					false
				);
				return;
			}

			setIsSaving(true);

			// Convert rich text editor state back to html before we save to database
			const tour = convertTourContentToHtml(interactiveTourState.currentInteractiveTour);

			let interactiveTourId: number | string;
			if (isCreatePage) {
				// insert the interactive tour
				interactiveTourId = await InteractiveTourService.insertInteractiveTour(tour);
			} else {
				// Update existing interactive tour
				await InteractiveTourService.updateInteractiveTour(tour);
				interactiveTourId = match.params.id;
			}

			redirectToClientPage(
				buildLink(INTERACTIVE_TOUR_PATH.INTERACTIVE_TOUR_DETAIL, {
					id: interactiveTourId,
				}),
				history
			);
			ToastService.success(
				t(
					'admin/interactive-tour/views/interactive-tour-edit___de-interactive-tour-is-opgeslagen'
				),
				false
			);
		} catch (err) {
			console.error(
				new CustomError('Failed to save interactive tour', err, {
					currentInteractiveTour: interactiveTourState.currentInteractiveTour,
					initialInteractiveTour: interactiveTourState.initialInteractiveTour,
				})
			);
			ToastService.danger(
				t(
					'admin/interactive-tour/views/interactive-tour-edit___het-opslaan-van-de-interactive-tour-is-mislukt'
				),
				false
			);
		}
		setIsSaving(false);
	};

	const handleContentPageSelect = (item: PickerItem | null) => {
		if (!item) {
			return;
		}
		changeInteractiveTourState({
			type: InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR_PROP,
			interactiveTourProp: 'page_id',
			interactiveTourPropValue: item.value,
		});
	};

	const handleStaticPageSelect = (newPageId: string) => {
		changeInteractiveTourState({
			type: InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR_PROP,
			interactiveTourProp: 'page_id',
			interactiveTourPropValue: newPageId,
		});
	};

	const getContentPickerInitialValue = (): PickerItem | undefined => {
		if (selectedPageType === 'content' && interactiveTourState.currentInteractiveTour) {
			return {
				value: interactiveTourState.currentInteractiveTour.page_id,
				label: interactiveTourState.currentInteractiveTour.page_id,
				type: 'CONTENT_PAGE',
			};
		}
		return undefined;
	};

	const renderReorderButton = (index: number, direction: 'up' | 'down', disabled: boolean) => (
		<Button
			type="secondary"
			icon={`chevron-${direction}` as IconName}
			title={
				direction === 'up'
					? t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-boven')
					: t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-onder')
			}
			ariaLabel={
				direction === 'up'
					? t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-boven')
					: t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-onder')
			}
			onClick={() => {
				changeInteractiveTourState({
					direction,
					index,
					type: InteractiveTourEditActionType.SWAP_STEPS,
				});
			}}
			disabled={disabled}
		/>
	);

	const renderStep = (step: EditableStep, index: number) => {
		if (!interactiveTourState.currentInteractiveTour) {
			return null;
		}

		return (
			<div key={`step_${step.id}`}>
				<Panel>
					<PanelHeader>
						<Toolbar>
							<ToolbarLeft>
								<ToolbarItem>
									<div className="c-button-toolbar">
										{renderReorderButton(index, 'up', index === 0)}
										{renderReorderButton(
											index,
											'down',
											index ===
												(
													interactiveTourState.currentInteractiveTour
														.steps || []
												).length -
													1
										)}
									</div>
								</ToolbarItem>
							</ToolbarLeft>
							<ToolbarRight>
								<ToolbarItem>
									<Button
										icon="trash-2"
										type="danger"
										onClick={() => {
											changeInteractiveTourState({
												index,
												type: InteractiveTourEditActionType.REMOVE_STEP,
											});
										}}
										ariaLabel={t(
											'admin/interactive-tour/views/interactive-tour-edit___verwijder-stap'
										)}
										title={t(
											'admin/interactive-tour/views/interactive-tour-edit___verwijder-stap'
										)}
									/>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</PanelHeader>
					<PanelBody>
						<Form>
							<FormGroup
								label={t(
									'admin/interactive-tour/views/interactive-tour-edit___titel'
								)}
								error={get(formErrors, `steps[${index}].title`)}
							>
								<TextInput
									value={(step.title || '').toString()}
									onChange={newTitle => {
										changeInteractiveTourState({
											type: InteractiveTourEditActionType.UPDATE_STEP_PROP,
											stepIndex: index,
											stepProp: 'title',
											stepPropValue: newTitle,
										});
									}}
								/>
								<Spacer margin="top-small">{step.title.length} / 28</Spacer>
							</FormGroup>
							<FormGroup
								label={t(
									'admin/interactive-tour/views/interactive-tour-edit___tekst'
								)}
								error={get(formErrors, `steps[${index}].content`)}
							>
								<WYSIWYGWrapper
									initialHtml={(step.content || '').toString()}
									state={step.contentState}
									onChange={newContentState => {
										if (!isEqual(newContentState, step.contentState)) {
											changeInteractiveTourState({
												type:
													InteractiveTourEditActionType.UPDATE_STEP_PROP,
												stepIndex: index,
												stepProp: 'contentState',
												stepPropValue: newContentState,
											});
										}
									}}
									controls={WYSIWYG_OPTIONS_FULL}
									fileType="INTERACTIVE_TOUR_IMAGE"
									id={`content_editor_${index}`}
									placeholder={t(
										'admin/interactive-tour/views/interactive-tour-edit___vul-een-stap-tekst-in'
									)}
								/>
								<Spacer margin="top-small">
									{
										(step.contentState
											? stripHtml(
													sanitizeHtml(step.contentState.toHTML(), 'link')
											  )
											: step.content || ''
										).length
									}{' '}
									/ 200
								</Spacer>
							</FormGroup>

							<FormGroup
								label={t(
									'admin/interactive-tour/views/interactive-tour-edit___element-css-selector'
								)}
							>
								<TextInput
									value={(step.target || '').toString()}
									onChange={newTarget => {
										changeInteractiveTourState({
											type: InteractiveTourEditActionType.UPDATE_STEP_PROP,
											stepIndex: index,
											stepProp: 'target',
											stepPropValue: newTarget,
										});
									}}
									className="c-text-input__selector"
								/>
								<Tooltip position="top">
									<TooltipTrigger>
										<span>
											<Icon
												className="a-info-icon"
												name="info"
												size="small"
											/>
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<Spacer padding="small">
											<Html
												content={t(
													'admin/interactive-tour/views/interactive-tour-edit___hoe-kopieer-je-een-css-selector'
												)}
												type="div"
											/>
										</Spacer>
									</TooltipContent>
								</Tooltip>
							</FormGroup>
						</Form>
					</PanelBody>
				</Panel>
				<InteractiveTourAdd
					index={index + 1}
					interactiveTour={interactiveTourState.currentInteractiveTour}
					changeInteractiveTourState={changeInteractiveTourState}
				/>
			</div>
		);
	};

	const renderEditPage = () => {
		if (!interactiveTourState.currentInteractiveTour) {
			return;
		}
		return (
			<>
				<Container size="medium">
					<Spacer margin="bottom-extra-large">
						<Box backgroundColor="gray">
							<Form>
								<FormGroup
									label={t(
										'admin/interactive-tour/views/interactive-tour-edit___naam'
									)}
									error={formErrors.name}
									required
								>
									<TextInput
										value={
											interactiveTourState.currentInteractiveTour.name || ''
										}
										onChange={newName =>
											changeInteractiveTourState({
												type:
													InteractiveTourEditActionType.UPDATE_INTERACTIVE_TOUR_PROP,
												interactiveTourProp: 'name',
												interactiveTourPropValue: newName,
											})
										}
									/>
								</FormGroup>
								<FormGroup
									label={t(
										'admin/interactive-tour/views/interactive-tour-edit___pagina'
									)}
									error={formErrors.page_id}
									required
								>
									<Flex>
										<FlexItem>
											<Select
												options={[
													{
														value: 'static',
														label: t(
															'admin/interactive-tour/views/interactive-tour-edit___statische-pagina'
														),
													},
													{
														value: 'content',
														label: t(
															'admin/interactive-tour/views/interactive-tour-edit___content-pagina'
														),
													},
												]}
												value={selectedPageType}
												onChange={value =>
													setSelectedPageType(
														value as InteractiveTourPageType
													)
												}
											/>
										</FlexItem>
										<FlexItem>
											<Spacer margin="left-small">
												{selectedPageType === 'static' && (
													<Select
														options={getPageOptions()}
														value={
															interactiveTourState
																.currentInteractiveTour.page_id ||
															''
														}
														onChange={handleStaticPageSelect}
													/>
												)}
												{selectedPageType === 'content' && (
													<ContentPicker
														initialValue={getContentPickerInitialValue()}
														onSelect={handleContentPageSelect}
														allowedTypes={['CONTENT_PAGE']}
														hideTypeDropdown
													/>
												)}
											</Spacer>
										</FlexItem>
									</Flex>
								</FormGroup>
							</Form>
						</Box>
					</Spacer>
				</Container>
				<BlockHeading type="h3">
					{t('admin/interactive-tour/views/interactive-tour-edit___stappen')}
				</BlockHeading>
				<InteractiveTourAdd
					index={0}
					interactiveTour={interactiveTourState.currentInteractiveTour}
					changeInteractiveTourState={changeInteractiveTourState}
				/>
				{(interactiveTourState.currentInteractiveTour.steps || []).map(renderStep)}
			</>
		);
	};

	// Render
	const renderPage = () => (
		<AdminLayout
			onClickBackButton={() => navigate(history, ADMIN_PATH.INTERACTIVE_TOUR_OVERVIEW)}
			pageTitle={t(
				'admin/interactive-tour/views/interactive-tour-edit___interactive-tour-aanpassen'
			)}
		>
			<AdminLayoutTopBarRight>
				<ButtonToolbar>
					<Button
						label={t('admin/interactive-tour/views/interactive-tour-edit___annuleer')}
						onClick={navigateBack}
						type="tertiary"
					/>
					<Button
						disabled={isSaving}
						label={t('admin/interactive-tour/views/interactive-tour-edit___opslaan')}
						onClick={handleSave}
					/>
				</ButtonToolbar>
			</AdminLayoutTopBarRight>
			<AdminLayoutBody>
				<Container mode="vertical" size="small" className="m-interactive-tour-edit-view">
					<Container mode="horizontal">{renderEditPage()}</Container>
				</Container>
			</AdminLayoutBody>
		</AdminLayout>
	);

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						get(interactiveTourState.currentInteractiveTour, 'name'),
						isCreatePage
							? t(
									'admin/interactive-tour/views/interactive-tour-edit___interactieve-rondleiding-beheer-aanmaak-pagina-titel'
							  )
							: t(
									'admin/interactive-tour/views/interactive-tour-edit___interactieve-rondleiding-beheer-bewerk-pagina-titel'
							  )
					)}
				</title>
				<meta
					name="description"
					content={
						isCreatePage
							? t(
									'admin/interactive-tour/views/interactive-tour-edit___interactieve-rondleiding-beheer-aanmaak-pagina-beschrijving'
							  )
							: t(
									'admin/interactive-tour/views/interactive-tour-edit___interactieve-rondleiding-beheer-bewerk-pagina-beschrijving'
							  )
					}
				/>
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={interactiveTourState.currentInteractiveTour}
				render={renderPage}
			/>
		</>
	);
};

export default InteractiveTourEdit;
