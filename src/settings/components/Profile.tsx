import { compact, get, pullAllBy, remove, uniq } from 'lodash-es';
import React, { FunctionComponent, ReactNode, ReactText, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Dispatch } from 'redux';

import {
	Alert,
	BlockHeading,
	Box,
	Button,
	Checkbox,
	Column,
	Container,
	Form,
	FormGroup,
	Grid,
	Select,
	Spacer,
	TagInfo,
	TagList,
	TagOption,
	TagsInput,
	TextArea,
	TextInput,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import {
	getProfileAlias,
	getProfileFromUser,
	getProfileId,
} from '../../authentication/helpers/get-profile-info';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { redirectToClientPage } from '../../authentication/helpers/redirects';
import {
	getLoginResponse,
	getLoginStateAction,
	setLoginSuccess,
} from '../../authentication/store/actions';
import { selectUser } from '../../authentication/store/selectors';
import { APP_PATH, GENERATE_SITE_TITLE } from '../../constants';
import { FileUpload } from '../../shared/components';
import { ROUTE_PARTS } from '../../shared/constants';
import { CustomError } from '../../shared/helpers';
import { ToastService } from '../../shared/services';
import { CampaignMonitorService } from '../../shared/services/campaign-monitor-service';
import { EducationOrganisationService } from '../../shared/services/education-organizations-service';
import { OrganisationService } from '../../shared/services/organizations-service';
import store, { AppState } from '../../store';
import { SettingsService } from '../settings.service';
import { UpdateProfileValues } from '../settings.types';

import './Profile.scss';

type FieldPermissionKey =
	| 'SUBJECTS'
	| 'EDUCATION_LEVEL'
	| 'EDUCATIONAL_ORGANISATION'
	| 'ORGANISATION';

interface FieldPermission {
	VIEW: boolean;
	EDIT: boolean;
	REQUIRED: boolean;
}

interface FieldPermissions {
	SUBJECTS: FieldPermission;
	EDUCATION_LEVEL: FieldPermission;
	EDUCATIONAL_ORGANISATION: FieldPermission;
	ORGANISATION: FieldPermission;
}

export interface ProfileProps extends DefaultSecureRouteProps {
	redirectTo?: string;
}

const Profile: FunctionComponent<ProfileProps & {
	getLoginState: () => Dispatch;
}> = ({ redirectTo = APP_PATH.LOGGED_IN_HOME.route, history, location, user, getLoginState }) => {
	const [t] = useTranslation();
	const isCompleteProfileStep = location.pathname.includes(ROUTE_PARTS.completeProfile);

	const gqlEnumToSelectOption = (enumLabel: string): TagInfo => ({
		label: enumLabel,
		value: enumLabel,
	});
	const gqlOrganizationToSelectOption = (
		org: Avo.EducationOrganization.Organization
	): TagInfo => ({
		label: `${org.label}`,
		value: `${org.organizationId}:${org.unitId || ''}`,
	});
	const [cities, setCities] = useState<string[]>([]);
	const [selectedCity, setSelectedCity] = useState<string>('');
	const [organizations, setOrganizations] = useState<Avo.EducationOrganization.Organization[]>(
		[]
	);
	const [organizationsLoadingState, setOrganizationsLoadingState] = useState<
		'loading' | 'loaded' | 'error'
	>('loaded');
	// Cache organizations since the user will probably select multiple schools in the same city
	const [organizationsCache, setOrganizationsCache] = useState<{
		[cityAndZipCode: string]: Avo.EducationOrganization.Organization[];
	}>({});
	const [selectedEducationLevels, setSelectedEducationLevels] = useState<TagInfo[]>(
		get(user, 'profile.educationLevels', []).map(gqlEnumToSelectOption)
	);
	const [selectedSubjects, setSelectedSubjects] = useState<TagInfo[]>(
		get(user, 'profile.subjects', []).map(gqlEnumToSelectOption)
	);
	const [selectedOrganizations, setSelectedOrganizations] = useState<TagInfo[]>(
		get(user, 'profile.organizations', []).map(gqlOrganizationToSelectOption)
	);
	const [alias, setAlias] = useState<string>(user ? getProfileAlias(user) : '');
	const [avatar, setAvatar] = useState<string | null>(
		get(getProfileFromUser(user, true), 'avatar', null)
	);
	const [bio, setBio] = useState<string | null>(get(getProfileFromUser(user, true), 'bio', null));
	const [func, setFunc] = useState<string | null>(
		get(getProfileFromUser(user, true), 'function', null)
	);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [subscribeToNewsletter, setSubscribeToNewsletter] = useState<boolean>(false);
	const [allEducationLevels, setAllEducationLevels] = useState<string[] | null>(null);
	const [allSubjects, setAllSubjects] = useState<string[] | null>(null);
	const [allOrganisations, setAllOrganisations] = useState<
		Partial<Avo.Organization.Organization>[] | null
	>(null);
	const [companyId, setCompanyId] = useState<string | null>(
		get(getProfileFromUser(user, true), 'company_id', null)
	);
	const [permissions, setPermissions] = useState<FieldPermissions | null>(null);

	useEffect(() => {
		setPermissions({
			SUBJECTS: {
				VIEW: PermissionService.hasPerm(user, PermissionName.VIEW_SUBJECTS_ON_PROFILE_PAGE),
				EDIT: PermissionService.hasPerm(user, PermissionName.EDIT_SUBJECTS_ON_PROFILE_PAGE),
				REQUIRED: PermissionService.hasPerm(
					user,
					PermissionName.REQUIRED_SUBJECTS_ON_PROFILE_PAGE
				),
			},
			EDUCATION_LEVEL: {
				VIEW: PermissionService.hasPerm(
					user,
					PermissionName.VIEW_EDUCATION_LEVEL_ON_PROFILE_PAGE
				),
				EDIT: PermissionService.hasPerm(
					user,
					PermissionName.EDIT_EDUCATION_LEVEL_ON_PROFILE_PAGE
				),
				REQUIRED: PermissionService.hasPerm(
					user,
					PermissionName.REQUIRED_EDUCATION_LEVEL_ON_PROFILE_PAGE
				),
			},
			EDUCATIONAL_ORGANISATION: {
				VIEW: PermissionService.hasPerm(
					user,
					PermissionName.VIEW_EDUCATIONAL_ORGANISATION_ON_PROFILE_PAGE
				),
				EDIT: PermissionService.hasPerm(
					user,
					PermissionName.EDIT_EDUCATIONAL_ORGANISATION_ON_PROFILE_PAGE
				),
				REQUIRED: PermissionService.hasPerm(
					user,
					PermissionName.REQUIRED_EDUCATIONAL_ORGANISATION_ON_PROFILE_PAGE
				),
			},
			ORGANISATION: {
				VIEW: PermissionService.hasPerm(
					user,
					PermissionName.VIEW_ORGANISATION_ON_PROFILE_PAGE
				),
				EDIT: PermissionService.hasPerm(
					user,
					PermissionName.EDIT_ORGANISATION_ON_PROFILE_PAGE
				),
				REQUIRED: PermissionService.hasPerm(
					user,
					PermissionName.REQUIRED_ORGANISATION_ON_PROFILE_PAGE
				),
			},
		});
	}, [user]);

	useEffect(() => {
		if (!permissions) {
			return;
		}
		if (permissions.EDUCATIONAL_ORGANISATION.EDIT || isCompleteProfileStep) {
			EducationOrganisationService.fetchCities()
				.then(setCities)
				.catch(err => {
					console.error(new CustomError('Failed to get cities', err));
					ToastService.danger(
						t('settings/components/profile___het-ophalen-van-de-steden-is-mislukt')
					);
				});
		}
		if (permissions.SUBJECTS.EDIT || isCompleteProfileStep) {
			SettingsService.fetchSubjects()
				.then((subjects: string[]) => {
					setAllSubjects(subjects);
				})
				.catch(err => {
					console.error(new CustomError('Failed to get subjects from the database', err));
					ToastService.danger(
						t('settings/components/profile___het-ophalen-van-de-vakken-is-mislukt')
					);
				});
		}
		if (permissions.EDUCATION_LEVEL.EDIT || isCompleteProfileStep) {
			SettingsService.fetchEducationLevels()
				.then((educationLevels: string[]) => {
					setAllEducationLevels(educationLevels);
				})
				.catch(err => {
					console.error(
						new CustomError('Failed to get education levels from database', err)
					);
					ToastService.danger(
						t(
							'settings/components/profile___het-ophalen-van-de-opleidingsniveaus-is-mislukt'
						)
					);
				});
		}

		// TODO for view we should use the company name from the profile object instead of the company_id and lookup in the list
		// Waiting for: https://meemoo.atlassian.net/browse/DEV-985
		if (permissions.ORGANISATION.VIEW || permissions.ORGANISATION.EDIT) {
			OrganisationService.fetchAllOrganisations()
				.then(setAllOrganisations)
				.catch(err => {
					console.error(
						new CustomError('Failed to get organisations from database', err)
					);
					ToastService.danger(
						t(
							'settings/components/profile___het-ophalen-van-de-organisaties-is-mislukt'
						)
					);
				});
		}
	}, [
		permissions,
		isCompleteProfileStep,
		t,
		user,
		setCities,
		setAllSubjects,
		setAllEducationLevels,
		setAllOrganisations,
	]);

	useEffect(() => {
		(async () => {
			try {
				if (!selectedCity) {
					setOrganizations([]);
					return;
				}
				setOrganizationsLoadingState('loading');
				const [city, zipCode] = selectedCity.split(/[()]/g).map(s => s.trim());
				let orgs: Avo.EducationOrganization.Organization[];
				if (organizationsCache[selectedCity]) {
					// get from cache
					orgs = [...organizationsCache[selectedCity]];
				} else {
					// fetch from server
					orgs = await EducationOrganisationService.fetchEducationOrganizations(
						city,
						zipCode
					);
					setOrganizationsCache({
						...organizationsCache,
						...{ [selectedCity]: orgs },
					});
				}
				pullAllBy(orgs, selectedOrganizations, 'label');
				setOrganizations(orgs);
				setOrganizationsLoadingState('loaded');
			} catch (err) {
				setOrganizations([]);
				setOrganizationsLoadingState('loaded');
				console.error('Failed to get educational organizations', err, {
					selectedCity,
				});
			}
		})();
	}, [organizationsCache, selectedOrganizations, selectedCity]);

	const areRequiredFieldsFilledIn = (profileInfo: Partial<UpdateProfileValues>) => {
		if (!permissions) {
			return false;
		}
		const errors = [];
		let filledIn = true;
		if (
			(permissions.SUBJECTS.REQUIRED || isCompleteProfileStep) &&
			(!profileInfo.subjects || !profileInfo.subjects.length)
		) {
			errors.push(t('settings/components/profile___vakken-zijn-verplicht'));
			filledIn = false;
		}
		if (
			(permissions.EDUCATION_LEVEL.REQUIRED || isCompleteProfileStep) &&
			(!profileInfo.educationLevels || !profileInfo.educationLevels.length)
		) {
			errors.push(t('settings/components/profile___opleidingsniveau-is-verplicht'));
			filledIn = false;
		}
		if (
			(permissions.EDUCATIONAL_ORGANISATION.REQUIRED || isCompleteProfileStep) &&
			(!profileInfo.organizations || !profileInfo.organizations.length)
		) {
			errors.push(t('settings/components/profile___educatieve-organisatie-is-verplicht'));
			filledIn = false;
		}
		if (
			permissions.ORGANISATION.REQUIRED &&
			!profileInfo.company_id &&
			!isCompleteProfileStep
		) {
			errors.push(t('settings/components/profile___organisatie-is-verplicht'));
			filledIn = false;
		}
		if (errors.length) {
			ToastService.danger(errors);
		}
		return filledIn;
	};

	const saveProfileChanges = async () => {
		try {
			setIsSaving(true);
			const profileId: string = getProfileId(user);
			const newProfileInfo = {
				alias,
				avatar,
				bio,
				educationLevels: (selectedEducationLevels || []).map(option => ({
					profile_id: profileId,
					key: option.value.toString(),
				})),
				subjects: (selectedSubjects || []).map(option => ({
					profile_id: profileId,
					key: option.value.toString(),
				})),
				organizations: (selectedOrganizations || []).map(option => ({
					profile_id: profileId,
					organization_id: option.value.toString().split(':')[0],
					unit_id: option.value.toString().split(':')[1] || null,
				})),
				company_id: companyId || undefined,
			};
			if (!areRequiredFieldsFilledIn(newProfileInfo)) {
				setIsSaving(false);
				return;
			}
			await SettingsService.updateProfileInfo(getProfileFromUser(user), newProfileInfo);

			if (isCompleteProfileStep) {
				// Refetch user permissions since education level can change user group
				getLoginState();
			}

			const preferences: Partial<Avo.Newsletter.Preferences> = {
				allActiveUsers: true, // Update user info in campaign monitor after changes to profile have been saved
			} as any;
			if (subscribeToNewsletter) {
				// subscribe to newsletter if checked
				preferences.newsletter = true;
			}
			try {
				await CampaignMonitorService.updateNewsletterPreferences(preferences);
			} catch (err) {
				console.error(
					new CustomError('Failed to updateNewsletterPreferences', err, {
						preferences,
						user,
					})
				);
				ToastService.danger(
					t(
						'settings/components/profile___het-updaten-van-de-nieuwsbrief-voorkeuren-is-mislukt'
					)
				);
			}

			// Refresh the login state, so the profile info will be up to date
			const loginResponse: Avo.Auth.LoginResponse = await getLoginResponse();
			store.dispatch(setLoginSuccess(loginResponse));

			if (isCompleteProfileStep) {
				// Wait for login response to be set into the store before redirecting
				setTimeout(() => {
					redirectToClientPage(redirectTo, history);
					setIsSaving(false);
				}, 0);
			} else {
				getLoginState();
				ToastService.success(t('settings/components/profile___opgeslagen'));
				setIsSaving(false);
			}
		} catch (err) {
			console.error(err);
			ToastService.danger(
				t('settings/components/profile___het-opslaan-van-de-profiel-information-is-mislukt')
			);
			setIsSaving(false);
		}
	};

	const onSelectedCityChanged = async (cityAndZipCode: string) => {
		setSelectedCity(cityAndZipCode);
	};

	const onSelectedOrganizationChanged = (orgLabel: string) => {
		const selectedOrg = organizations.find(org => org.label === orgLabel);
		if (!selectedOrg) {
			ToastService.danger(
				t(
					'settings/components/profile___de-geselecteerde-instelling-kon-niet-worden-gevonden'
				)
			);
			return;
		}
		setSelectedOrganizations(
			uniq([...selectedOrganizations, ...[selectedOrg].map(gqlOrganizationToSelectOption)])
		);
	};

	const removeOrganization = async (orgLabel: ReactText) => {
		const newOrganizations = [...selectedOrganizations];
		remove(newOrganizations, org => org.label === orgLabel);
		setSelectedOrganizations(newOrganizations);
	};

	const getOrganizationOptions = () => {
		if (organizations.length === 0 && organizationsLoadingState === 'loaded') {
			return [
				{
					label: t(
						'settings/components/profile___er-zijn-geen-andere-organisaties-gekend-in-deze-gemeente'
					),
					value: '',
					disabled: true,
				},
			];
		}
		return [
			{
				label: t('settings/components/profile___selecteer-een-instelling'),
				value: '',
				disabled: true,
			},
			...organizations.map((org: Avo.EducationOrganization.Organization) => ({
				label: org.label,
				value: org.label,
			})),
		];
	};

	const renderSubjectsField = (editable: boolean, required: boolean) => {
		return (
			<FormGroup
				label={t('settings/components/profile___vakken')}
				labelFor="subjects"
				required={required}
			>
				{editable ? (
					<TagsInput
						id="subjects"
						placeholder={t(
							'settings/components/profile___selecteer-de-vakken-die-u-geeft'
						)}
						options={(allSubjects || []).map(subject => ({
							label: subject,
							value: subject,
						}))}
						value={selectedSubjects}
						onChange={selectedValues => setSelectedSubjects(selectedValues || [])}
					/>
				) : (
					<TagList
						tags={selectedSubjects.map(
							(subject): TagOption => ({ id: subject.value, label: subject.label })
						)}
						swatches={false}
						closable={false}
					/>
				)}
			</FormGroup>
		);
	};

	const renderEducationLevelsField = (editable: boolean, required: boolean) => {
		return (
			<FormGroup
				label={t('settings/components/profile___onderwijsniveau')}
				labelFor="educationLevel"
				required={required}
			>
				{editable ? (
					<TagsInput
						id="educationLevel"
						placeholder={t(
							'settings/components/profile___selecteer-een-opleidingsniveau'
						)}
						options={(allEducationLevels || []).map(edLevel => ({
							label: edLevel,
							value: edLevel,
						}))}
						value={selectedEducationLevels}
						onChange={selectedValues =>
							setSelectedEducationLevels(selectedValues || [])
						}
					/>
				) : (
					<>
						<TagList
							tags={selectedEducationLevels.map(
								(subject): TagOption => ({
									id: subject.value,
									label: subject.label,
								})
							)}
							swatches={false}
							closable={false}
						/>
						<Spacer margin="top-small">
							<Alert
								type="info"
								message={t(
									'settings/components/profile___wil-je-jouw-onderwijsniveau-aanpassen-neem-dan-contact-op-via-de-feedbackknop'
								)}
							/>
						</Spacer>
					</>
				)}
			</FormGroup>
		);
	};

	const renderOrganisationField = (editable: boolean, required: boolean) => {
		return (
			<FormGroup
				label={t('settings/components/profile___organisatie')}
				labelFor="organisation"
				required={required}
			>
				{editable ? (
					<Select
						options={compact(
							(allOrganisations || []).map(org => {
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
						onChange={setCompanyId}
					/>
				) : !companyId ? (
					'-'
				) : (
					get(
						(allOrganisations || []).find(org => org.or_id === companyId),
						'name'
					) || t('settings/components/profile___onbekende-organisatie')
				)}
			</FormGroup>
		);
	};

	const renderEducationOrganisationsField = (editable: boolean, required: boolean) => {
		return (
			<FormGroup
				label={t('settings/components/profile___school-organisatie')}
				labelFor="educationalOrganizations"
				required={required}
			>
				{editable ? (
					<>
						<TagList
							closable
							swatches={false}
							tags={selectedOrganizations.map(org => ({
								label: org.label,
								id: org.label,
							}))}
							onTagClosed={removeOrganization}
						/>
						<Spacer margin="top-small">
							<Select
								options={[
									{
										label: t(
											'settings/components/profile___voeg-een-organisatie-toe'
										),
										value: '',
									},
									...cities.map(c => ({ label: c, value: c })),
								]}
								value={selectedCity || ''}
								onChange={onSelectedCityChanged}
							/>
						</Spacer>
						<Spacer margin={['top-small', 'bottom-small']}>
							{organizationsLoadingState === 'loading' && (
								<Alert
									type="spinner"
									message={t(
										'settings/components/profile___bezig-met-ophalen-van-organisaties'
									)}
								/>
							)}
							{!!selectedCity && organizationsLoadingState === 'loaded' && (
								<Select
									options={getOrganizationOptions()}
									value={''}
									onChange={onSelectedOrganizationChanged}
								/>
							)}
						</Spacer>
						<Alert
							type="info"
							message={t(
								'settings/components/profile___vind-je-je-onderwijsinstelling-niet-contacteer-ons-via-de-feedback-knop'
							)}
						/>
					</>
				) : (
					<TagList
						closable={false}
						swatches={false}
						tags={selectedOrganizations.map(org => ({
							label: org.label,
							id: org.label,
						}))}
					/>
				)}
			</FormGroup>
		);
	};

	const renderCompleteProfilePage = () => {
		return (
			<Container mode="horizontal" size="medium">
				<Container mode="vertical">
					<BlockHeading type="h1">
						<Trans i18nKey="settings/components/profile___je-bent-er-bijna-vervolledig-nog-je-profiel">
							Je bent er bijna. Vervolledig nog je profiel.
						</Trans>
					</BlockHeading>
					<Spacer margin="top-large">
						<Alert type="info">
							<Trans i18nKey="settings/components/profile___we-gebruiken-deze-info-om-je-gepersonaliseerde-content-te-tonen">
								We gebruiken deze info om je gepersonaliseerde content te tonen.
							</Trans>
						</Alert>
					</Spacer>
					<Form type="standard">
						<Spacer margin={['top-large', 'bottom-large']}>
							{renderSubjectsField(true, true)}
							{renderEducationLevelsField(true, true)}
							{renderEducationOrganisationsField(true, true)}
						</Spacer>
						{get(user, 'role.name') === 'lesgever' && (
							<Spacer margin="bottom">
								<FormGroup>
									<Checkbox
										label={t(
											'settings/components/profile___ik-ontvang-graag-per-e-mail-tips-en-inspiratie-voor-mijn-lessen-vacatures-gratis-workshops-en-nieuws-van-partners'
										)}
										checked={subscribeToNewsletter}
										onChange={setSubscribeToNewsletter}
									/>
								</FormGroup>
							</Spacer>
						)}
					</Form>
					<Button
						label={t('settings/components/profile___inloggen')}
						type="primary"
						disabled={isSaving}
						onClick={saveProfileChanges}
					/>
				</Container>
			</Container>
		);
	};

	const renderFieldVisibleOrRequired = (
		permissionName: FieldPermissionKey,
		renderFunc: (editable: boolean, required: boolean) => ReactNode
	) => {
		if (!permissions) {
			return null;
		}
		if (permissions[permissionName].VIEW) {
			return renderFunc(
				permissions[permissionName].EDIT,
				permissions[permissionName].REQUIRED
			);
		}
		return null;
	};

	const renderProfilePage = () => {
		return (
			<Container mode="vertical">
				<Spacer margin="bottom">
					<Grid>
						<Column size="3-7">
							<Form type="standard">
								<>
									<FormGroup
										label={t('settings/components/profile___nickname')}
										labelFor="alias"
									>
										<TextInput
											id="alias"
											placeholder={t(
												'settings/components/profile___een-unieke-gebruikersnaam'
											)}
											value={alias || ''}
											onChange={setAlias}
										/>
									</FormGroup>
									<FormGroup
										label={t('settings/components/profile___functie')}
										labelFor="func"
									>
										<TextInput
											id="func"
											placeholder={t(
												'settings/components/profile___bv-leerkracht-basis-onderwijs'
											)}
											value={func || ''}
											onChange={setFunc}
										/>
									</FormGroup>
									{!get(user, 'profile.organisation') && (
										<FormGroup
											label={t('settings/components/profile___profielfoto')}
											labelFor="profilePicture"
										>
											<FileUpload
												label={t(
													'settings/components/profile___upload-een-profiel-foto'
												)}
												urls={compact([avatar])}
												allowMulti={false}
												assetType="PROFILE_AVATAR"
												ownerId={get(user, 'profile.id')}
												onChange={urls => setAvatar(urls[0])}
											/>
										</FormGroup>
									)}
									{!!get(user, 'profile.organisation.logo_url') && (
										<div
											className="c-logo-preview"
											style={{
												backgroundImage: `url(${get(
													user,
													'profile.organisation.logo_url'
												)})`,
											}}
										/>
									)}
									<FormGroup
										label={t('settings/components/profile___bio')}
										labelFor="bio"
									>
										<TextArea
											name="bio"
											id="bio"
											height="medium"
											placeholder={t(
												'settings/components/profile___een-korte-beschrijving-van-jezelf'
											)}
											value={bio || ''}
											onChange={setBio}
										/>
									</FormGroup>
								</>
								{renderFieldVisibleOrRequired('SUBJECTS', renderSubjectsField)}
								{renderFieldVisibleOrRequired(
									'EDUCATION_LEVEL',
									renderEducationLevelsField
								)}
								{renderFieldVisibleOrRequired(
									'EDUCATIONAL_ORGANISATION',
									renderEducationOrganisationsField
								)}
								{renderFieldVisibleOrRequired(
									'ORGANISATION',
									renderOrganisationField
								)}
								<Button
									label={t('settings/components/profile___opslaan')}
									type="primary"
									disabled={isSaving}
									onClick={saveProfileChanges}
								/>
							</Form>
						</Column>
						<Column size="3-5">
							<>
								{/*<Box>*/}
								{/*	<BlockHeading type="h4"><Trans i18nKey="settings/components/profile___volledigheid-profiel">Volledigheid profiel</Trans></BlockHeading>*/}
								{/*	/!* TODO replace with components from component repo *!/*/}
								{/*	<div className="c-progress-bar" />*/}
								{/*</Box>*/}
								<Spacer margin={['top', 'bottom']}>
									<Box>
										<p>
											<Trans i18nKey="settings/components/profile___profiel-sidebar-intro-tekst">
												Vul hier wat info over jezelf in! Deze informatie
												wordt getoond op jouw persoonlijk profiel. Je kan
												voor elk veld aanduiden of je deze informatie wil
												delen of niet.
											</Trans>
										</p>
									</Box>
								</Spacer>
							</>
						</Column>
					</Grid>
				</Spacer>
			</Container>
		);
	};

	const renderPage = () => {
		if (isCompleteProfileStep) {
			// Render profile for the complete profile step of the registration process
			return renderCompleteProfilePage();
		}

		// Render profile for the settings page
		return renderProfilePage();
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						t('settings/components/profile___profiel-instellingen-pagina-titel')
					)}
				</title>
				<meta
					name="description"
					content={t(
						'settings/components/profile___profiel-instellingen-pagina-beschrijving'
					)}
				/>
			</MetaTags>
			{renderPage()}
		</>
	);
};

const mapStateToProps = (state: AppState) => ({
	user: selectUser(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => {
	return {
		getLoginState: () => dispatch(getLoginStateAction() as any),
	};
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Profile));
