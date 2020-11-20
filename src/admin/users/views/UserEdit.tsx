import { compact, get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import {
	Button,
	ButtonToolbar,
	Container,
	Flex,
	FlexItem,
	Form,
	FormGroup,
	Select,
	Spacer,
	TagInfo,
	TagsInput,
	TextArea,
	TextInput,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { redirectToClientPage } from '../../../authentication/helpers/redirects';
import { GENERATE_SITE_TITLE } from '../../../constants';
import { SettingsService } from '../../../settings/settings.service';
import { UpdateProfileValues } from '../../../settings/settings.types';
import { FileUpload, LoadingErrorLoadedComponent, LoadingInfo } from '../../../shared/components';
import { buildLink, CustomError, navigate } from '../../../shared/helpers';
import { PHOTO_TYPES } from '../../../shared/helpers/files';
import { stringToSelectOption } from '../../../shared/helpers/string-to-select-options';
import { useCompanies } from '../../../shared/hooks/useCompanies';
import { useSubjects } from '../../../shared/hooks/useSubjects';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { USER_PATH } from '../user.const';
import { UserService } from '../user.service';

interface UserEditProps extends DefaultSecureRouteProps<{ id: string }> {}

const UserEdit: FunctionComponent<UserEditProps> = ({ history, match }) => {
	// Hooks
	const [storedProfile, setStoredProfile] = useState<Avo.User.Profile | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [profileErrors, setProfileErrors] = useState<
		Partial<{ [prop in keyof UpdateProfileValues]: string }>
	>({});

	const [selectedSubjects, setSelectedSubjects] = useState<TagInfo[]>([]);
	const [companies] = useCompanies(false);
	const [subjects] = useSubjects();
	const [firstName, setFirstName] = useState<string | undefined>();
	const [lastName, setLastName] = useState<string | undefined>();
	const [avatar, setAvatar] = useState<string | undefined>();
	const [title, setTitle] = useState<string | undefined>();
	const [bio, setBio] = useState<string | undefined>();
	const [alias, setAlias] = useState<string | undefined>();
	const [companyId, setCompanyId] = useState<string | undefined>();

	const [t] = useTranslation();

	const fetchProfileById = useCallback(async () => {
		try {
			const profile = await UserService.getProfileById(match.params.id);

			setFirstName(get(profile, 'user.first_name') || undefined);
			setLastName(get(profile, 'user.last_name') || undefined);
			setAvatar(get(profile, 'avatar') || undefined);
			setTitle(get(profile, 'title') || undefined);
			setBio(get(profile, 'bio') || undefined);
			setAlias(get(profile, 'alias') || undefined);
			setCompanyId(get(profile, 'company_id') || undefined);
			setSelectedSubjects(
				(get(profile, 'profile_classifications') || [])
					.map((classification: { key: string }) => classification.key)
					.map(stringToSelectOption)
			);

			setStoredProfile(profile);
		} catch (err) {
			console.error(
				new CustomError('Failed to get user by id', err, {
					query: 'GET_USER_BY_ID',
					variables: {
						id: match.params.id,
					},
				})
			);
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/users/views/user-detail___het-ophalen-van-de-gebruiker-info-is-mislukt'
				),
			});
		}
	}, [setStoredProfile, setLoadingInfo, t, match.params.id]);

	useEffect(() => {
		fetchProfileById();
	}, [fetchProfileById]);

	useEffect(() => {
		if (storedProfile) {
			setLoadingInfo({
				state: 'loaded',
			});
		}
	}, [storedProfile, setLoadingInfo]);

	const navigateBack = () => {
		navigate(history, USER_PATH.USER_DETAIL, {
			id: match.params.id,
		});
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);

			const profileId = match.params.id;
			const newProfileInfo = {
				userId: get(storedProfile, 'user.uid'),
				firstName,
				lastName,
				alias,
				title,
				bio,
				avatar: avatar || null,
				subjects: (selectedSubjects || []).map((option) => ({
					profile_id: profileId,
					key: option.value.toString(),
				})),
				company_id: companyId || undefined,
			};
			try {
				await SettingsService.updateProfileInfo(storedProfile, newProfileInfo);
			} catch (err) {
				setIsSaving(false);
				if (JSON.stringify(err).includes('DUPLICATE_ALIAS')) {
					ToastService.danger(
						t('settings/components/profile___deze-schermnaam-is-reeds-in-gebruik')
					);
					setProfileErrors({
						alias: t('settings/components/profile___schermnaam-is-reeds-in-gebruik'),
					});
					return;
				}
				throw err;
			}

			redirectToClientPage(
				buildLink(USER_PATH.USER_DETAIL, { id: match.params.id }),
				history
			);
			ToastService.success(t('De gebruiker is aangepast'));
		} catch (err) {
			console.error(
				new CustomError('Failed to save user', err, {
					storedProfile,
				})
			);
			ToastService.danger(
				t('admin/users/views/user-edit___het-opslaan-van-de-gebruiker-is-mislukt')
			);
		}
		setIsSaving(false);
	};

	const renderUserDetail = () => {
		if (!storedProfile) {
			console.error(
				new CustomError(
					'Failed to load user because render function is called before user was fetched'
				)
			);
			return;
		}

		return (
			<Container mode="vertical" size="small">
				<Container mode="horizontal">
					<Form>
						{!companyId && (
							<FormGroup label={t('admin/users/views/user-detail___avatar')}>
								<FileUpload
									urls={avatar ? [avatar] : []}
									onChange={(urls) => setAvatar(urls[0])}
									assetType="PROFILE_AVATAR"
									allowMulti={false}
									allowedTypes={PHOTO_TYPES}
									ownerId={match.params.id}
								/>
							</FormGroup>
						)}
						<FormGroup label={t('admin/users/views/user-detail___voornaam')}>
							<TextInput value={firstName} onChange={setFirstName} />
						</FormGroup>
						<FormGroup label={t('admin/users/views/user-detail___achternaam')}>
							<TextInput value={lastName} onChange={setLastName} />
						</FormGroup>
						<FormGroup label={t('admin/users/views/user-detail___functie')}>
							<TextInput value={title} onChange={setTitle} />
						</FormGroup>
						<FormGroup label={t('admin/users/views/user-detail___bio')}>
							<TextArea value={bio} onChange={setBio} />
						</FormGroup>
						<FormGroup
							label={t('admin/users/views/user-detail___gebruikersnaam')}
							error={profileErrors.alias}
						>
							<TextInput value={alias} onChange={setAlias} />
						</FormGroup>
						<FormGroup label={t('admin/users/views/user-detail___vakken')}>
							<TagsInput
								id="subjects"
								placeholder={t(
									'admin/users/views/user-edit___selecteer-de-vakken-die-deze-gebruiker-geeft'
								)}
								options={(subjects || []).map(stringToSelectOption)}
								value={selectedSubjects}
								onChange={(selectedValues) =>
									setSelectedSubjects(selectedValues || [])
								}
							/>
						</FormGroup>
						<FormGroup label={t('admin/users/views/user-detail___bedrijf')}>
							<Flex>
								<FlexItem>
									<Select
										options={compact(
											(companies || []).map((org) => {
												if (!org.name || !org.or_id) {
													return null;
												}
												return {
													label: org.name,
													value: org.or_id,
												};
											})
										)}
										value={companyId}
										onChange={(newCompany) => {
											setCompanyId(newCompany);
										}}
										clearable
									/>
								</FlexItem>
								<FlexItem shrink>
									<Spacer margin="left">
										<Button
											type="danger"
											size="large"
											ariaLabel={t(
												'admin/users/views/user-edit___verbreek-de-link-tussen-deze-gebruiker-en-dit-bedrijf'
											)}
											icon="trash-2"
											onClick={() => setCompanyId(undefined)}
										/>
									</Spacer>
								</FlexItem>
							</Flex>
						</FormGroup>
					</Form>
				</Container>
			</Container>
		);
	};

	const renderUserDetailPage = () => {
		return (
			<AdminLayout
				onClickBackButton={() => navigate(history, ADMIN_PATH.USER_OVERVIEW)}
				pageTitle={t('admin/users/views/user-edit___bewerk-gebruiker')}
				size="large"
			>
				<AdminLayoutTopBarRight>
					<ButtonToolbar>
						<Button
							label={t('admin/user-groups/views/user-group-edit___annuleer')}
							onClick={navigateBack}
							type="tertiary"
						/>
						<Button
							disabled={isSaving}
							label={t('admin/user-groups/views/user-group-edit___opslaan')}
							onClick={handleSave}
						/>
					</ButtonToolbar>
				</AdminLayoutTopBarRight>
				<AdminLayoutBody>{renderUserDetail()}</AdminLayoutBody>
			</AdminLayout>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						`${get(storedProfile, 'user.first_name')} ${get(
							storedProfile,
							'user.last_name'
						)}`,
						t('admin/users/views/user-detail___item-detail-pagina-titel')
					)}
				</title>
				<meta
					name="description"
					content={t(
						'admin/users/views/user-detail___gebruikersbeheer-detail-pagina-beschrijving'
					)}
				/>
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={storedProfile}
				render={renderUserDetailPage}
			/>
		</>
	);
};

export default UserEdit;
