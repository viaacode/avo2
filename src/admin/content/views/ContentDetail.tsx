import { useMutation } from '@apollo/react-hooks';
import { compact, flatten, get } from 'lodash-es';
import React, { FunctionComponent, ReactElement, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
	Avatar,
	BlockHeading,
	Button,
	ButtonToolbar,
	Container,
	Header,
	HeaderAvatar,
	HeaderButtons,
	Navbar,
	Spacer,
	Table,
	Tabs,
	TagInfo,
	TagList,
	TagOption,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import {
	CustomError,
	getAvatarProps,
	navigate,
	sanitize,
	sanitizePresets,
} from '../../../shared/helpers';
import { useTabs } from '../../../shared/hooks';
import { ApolloCacheManager, ToastService } from '../../../shared/services';
import { fetchAllUserGroups } from '../../../shared/services/user-groups-service';
import { ContentBlockPreview } from '../../content-block/components';
import { parseContentBlocks } from '../../content-block/helpers';
import { useContentBlocksByContentId } from '../../content-block/hooks';
import {
	renderDateDetailRows,
	renderDetailRow,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutHeader } from '../../shared/layouts';

import { CONTENT_DETAIL_TABS, CONTENT_PATH, CONTENT_WIDTH_OPTIONS } from '../content.const';
import { DELETE_CONTENT } from '../content.gql';
import { ContentService } from '../content.service';
import { ContentDetailParams, DbContent } from '../content.types';

interface ContentDetailProps extends DefaultSecureRouteProps<ContentDetailParams> {}

const ContentDetail: FunctionComponent<ContentDetailProps> = ({ history, match, user }) => {
	const { id } = match.params;

	// Hooks
	const [contentPage, setContentPage] = useState<DbContent | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
	const [allUserGroups, setAllUserGroups] = useState<TagInfo[]>([]);

	const [triggerContentDelete] = useMutation(DELETE_CONTENT);
	const [t] = useTranslation();

	const [contentBlocks] = useContentBlocksByContentId(id);
	const [currentTab, setCurrentTab, tabs] = useTabs(
		CONTENT_DETAIL_TABS,
		CONTENT_DETAIL_TABS[0].id
	);

	// Computed
	const avatarProps = getAvatarProps(get(contentPage, 'profile', null));
	const contentBlockConfigs = parseContentBlocks(contentBlocks);
	const isAdminUser = get(user, 'role.name', null) === 'admin';
	const isContentProtected = get(contentPage, 'is_protected', false);
	const pageTitle = `Content: ${get(contentPage, 'title', '')}`;

	const fetchContentPageById = useCallback(async () => {
		try {
			setContentPage(await ContentService.getContentPageById(id));
		} catch (err) {
			console.error(
				new CustomError('Failed to get content page by id', err, {
					query: 'GET_CONTENT_PAGE_BY_ID',
					variables: {
						id,
					},
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t('Het ophalen van de content pagina is mislukt'),
			});
		}
	}, [setContentPage, setLoadingInfo, t, id]);

	useEffect(() => {
		fetchContentPageById();
	}, [fetchContentPageById]);

	useEffect(() => {
		if (contentPage) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [contentPage, setLoadingInfo]);

	// Get labels of the contentPages, so we can show a readable error message
	useEffect(() => {
		fetchAllUserGroups()
			.then(userGroups => {
				setAllUserGroups(userGroups);
			})
			.catch((err: any) => {
				console.error('Failed to get user groups', err);
				ToastService.danger(
					t(
						'admin/shared/components/user-group-select/user-group-select___het-controleren-van-je-account-rechten-is-mislukt'
					),
					false
				);
			});
	}, [setAllUserGroups, t]);

	// Methods
	const getUserGroups = (contentPage: Avo.Content.Content): TagOption[] => {
		const tagInfos: TagInfo[] = compact(
			(contentPage.user_group_ids || []).map((userGroupId: number): TagInfo | undefined => {
				return allUserGroups.find(userGroupOption => userGroupOption.value === userGroupId);
			})
		);
		const tagOptions = tagInfos.map(
			(ug: TagInfo): TagOption => ({
				id: ug.value,
				label: ug.label,
			})
		);
		if (tagOptions && tagOptions.length) {
			return tagOptions;
		}
		return [
			{
				id: -3,
				label: t('admin/menu/components/menu-edit-form/menu-edit-form___niemand'),
			},
		];
	};

	const getLabels = (contentPage: DbContent): TagOption[] => {
		return flatten(
			(contentPage.content_content_labels || []).map(
				(contentLabelLink: Avo.Content.ContentLabelLink) => {
					return contentLabelLink.content_label;
				}
			)
		);
	};

	const getContentPageWidthLabel = (contentPage: Avo.Content.Content): string => {
		return (
			get(
				CONTENT_WIDTH_OPTIONS.find(option => option.value === contentPage.content_width),
				'label'
			) || '-'
		);
	};

	const handleDelete = () => {
		triggerContentDelete({
			variables: { id },
			update: ApolloCacheManager.clearContentCache,
		})
			.then(() => {
				history.push(CONTENT_PATH.CONTENT);
				ToastService.success(
					t(
						'admin/content/views/content-detail___het-content-item-is-succesvol-verwijderd'
					),
					false
				);
			})
			.catch(err => {
				console.error(err);
				ToastService.danger(
					t(
						'admin/content/views/content-detail___het-verwijderen-van-het-content-item-is-mislukt'
					),
					false
				);
			});
	};

	// Render
	const renderContentDetail = (): ReactElement | null => {
		if (!contentPage) {
			return null;
		}
		// TODO: Move tab contents to separate views
		switch (currentTab) {
			case 'inhoud':
				return (
					<>
						{contentBlockConfigs.map((contentBlockConfig, index) => (
							<ContentBlockPreview
								key={contentBlocks[index].id}
								componentState={contentBlockConfig.components.state}
								contentWidth={get(contentPage, 'content_width')}
								blockState={contentBlockConfig.block.state}
							/>
						))}
					</>
				);
			case 'metadata':
				return (
					<Container mode="vertical" size="small">
						<Container mode="horizontal">
							{!!contentPage.description && (
								<Spacer margin="bottom-large">
									<BlockHeading type="h4">
										<Trans i18nKey="admin/content/views/content-detail___omschrijving">
											Omschrijving:
										</Trans>
									</BlockHeading>
									<p
										dangerouslySetInnerHTML={{
											__html: sanitize(
												contentPage.description,
												sanitizePresets.link
											),
										}}
									/>
								</Spacer>
							)}

							<Table horizontal variant="invisible" className="c-table_detail-page">
								<tbody>
									{renderSimpleDetailRows(contentPage, [
										['title', t('Titel:')],
										['description', t('Beschrijving:')],
										[
											'content_type',
											t('admin/content/views/content-detail___content-type'),
										],
										['path', t('Pad:')],
										[
											'is_protected',
											t(
												'admin/content/views/content-detail___beschermde-pagina'
											),
										],
									])}
									{renderDetailRow(
										getContentPageWidthLabel(contentPage),
										t('Breedte:')
									)}
									{renderDetailRow(
										`${get(contentPage, 'profile.user.first_name')} ${get(
											contentPage,
											'profile.user.last_name'
										)}`,
										t('Auteur:')
									)}
									{renderDetailRow(
										get(contentPage, 'profile.user.role.label'),
										t('Auteur rol:')
									)}
									{renderDateDetailRows(contentPage, [
										[
											'created_at',
											t('admin/content/views/content-detail___aangemaakt'),
										],
										[
											'updated_at',
											t(
												'admin/content/views/content-detail___laatst-bewerkt'
											),
										],
										[
											'publish_at',
											t('admin/content/views/content-detail___gepubliceerd'),
										],
										[
											'depublish_at',
											t(
												'admin/content/views/content-detail___gedepubliceerd'
											),
										],
									])}
									{renderDetailRow(
										<TagList
											swatches={false}
											selectable={false}
											closable={false}
											tags={getUserGroups(contentPage)}
										/>,
										t('admin/content/views/content-detail___toegankelijk-voor')
									)}
									{renderDetailRow(
										<TagList
											swatches={false}
											selectable={false}
											closable={false}
											tags={getLabels(contentPage)}
										/>,
										t('Labels:')
									)}
								</tbody>
							</Table>
						</Container>
					</Container>
				);

			default:
				return null;
		}
	};

	return (
		<AdminLayout showBackButton>
			<AdminLayoutHeader>
				<Header category="audio" title={pageTitle} showMetaData={false}>
					{(avatarProps.name || avatarProps.initials) && (
						<HeaderAvatar>
							<Avatar {...avatarProps} dark />
						</HeaderAvatar>
					)}
					<HeaderButtons>
						<ButtonToolbar>
							<Button
								label={t('admin/content/views/content-detail___bewerken')}
								onClick={() => navigate(history, CONTENT_PATH.CONTENT_EDIT, { id })}
							/>
							{/* TODO: also check permissions */}
							{(!isContentProtected || (isContentProtected && isAdminUser)) && (
								<Button
									label={t('admin/content/views/content-detail___verwijderen')}
									onClick={() => setIsConfirmModalOpen(true)}
									type="danger-hover"
								/>
							)}
						</ButtonToolbar>
					</HeaderButtons>
				</Header>
				<Navbar background="alt" placement="top" autoHeight>
					<Container mode="horizontal">
						<Tabs tabs={tabs} onClick={setCurrentTab} />
					</Container>
				</Navbar>
			</AdminLayoutHeader>
			<AdminLayoutBody>
				<LoadingErrorLoadedComponent
					loadingInfo={loadingInfo}
					dataObject={contentPage}
					render={renderContentDetail}
				/>
				<DeleteObjectModal
					deleteObjectCallback={handleDelete}
					isOpen={isConfirmModalOpen}
					onClose={() => setIsConfirmModalOpen(false)}
					body={
						isContentProtected
							? t(
									'admin/content/views/content-detail___opgelet-dit-is-een-beschermde-pagina'
							  )
							: ''
					}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default ContentDetail;
