import { compact, get, sortBy } from 'lodash-es';
import React, { FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';
import { Link } from 'react-router-dom';

import {
	Accordion,
	Button,
	ButtonToolbar,
	Container,
	Spacer,
	Table,
	TagList,
	TagOption,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import {
	PermissionName,
	PermissionService,
} from '../../../authentication/helpers/permission-service';
import {
	redirectToClientPage,
	redirectToExternalPage,
} from '../../../authentication/helpers/redirects';
import { GENERATE_SITE_TITLE } from '../../../constants';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../shared/components';
import { buildLink, CustomError, getEnv, navigate, renderAvatar } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import { EducationOrganisationService } from '../../../shared/services/education-organizations-service';
import { ADMIN_PATH, IDP_COLORS } from '../../admin.const';
import {
	renderDateDetailRows,
	renderDetailRow,
	renderSimpleDetailRows,
} from '../../shared/helpers/render-detail-fields';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { UserService } from '../user.service';
import { RawPermissionLink, RawUserGroup, RawUserGroupPermissionGroupLink } from '../user.types';

interface UserDetailProps extends DefaultSecureRouteProps<{ id: string }> {}

const UserDetail: FunctionComponent<UserDetailProps> = ({ history, match, user }) => {
	// Hooks
	const [storedProfile, setStoredProfile] = useState<Avo.User.Profile | null>(null);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [eduOrgNames, setEduOrgNames] = useState<string[]>([]);

	const [t] = useTranslation();

	const fetchProfileById = useCallback(async () => {
		try {
			const profile = await UserService.getProfileById(match.params.id);

			const eduOrgs: {
				unit_id: string;
				organization_id: string;
			}[] = get(profile, 'profile_organizations') || [];
			setEduOrgNames(
				compact(
					await Promise.all(
						eduOrgs.map((eduOrg) =>
							EducationOrganisationService.fetchEducationOrganisationName(
								eduOrg.organization_id,
								eduOrg.unit_id
							)
						)
					)
				)
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

	const getLdapDashboardUrl = () => {
		const ipdMapEntry = (get(storedProfile, 'user.idpmaps') || []).find(
			(idpMap: { idp: string; idp_user_id: string }) => idpMap.idp === 'HETARCHIEF'
		);
		if (ipdMapEntry) {
			return `${getEnv('LDAP_DASHBOARD_PEOPLE_URL')}/${ipdMapEntry.idp_user_id}`;
		}
		return null;
	};

	const handleLdapDashboardClick = () => {
		redirectToExternalPage(getLdapDashboardUrl() as string, '_blank');
	};

	const canBanUser = (): boolean => {
		return PermissionService.hasPerm(user, PermissionName.EDIT_BAN_USER_STATUS);
	};

	const toggleBlockedStatus = async () => {
		try {
			const profileId = get(storedProfile, 'id');
			const isBlocked = get(storedProfile, 'user.is_blocked') || false;
			if (profileId) {
				await UserService.updateBlockStatusByProfileIds([profileId], !isBlocked);
				await fetchProfileById();
				ToastService.success(
					isBlocked
						? t('admin/users/views/user-detail___gebruiker-is-gedeblokkeerd')
						: t('admin/users/views/user-detail___gebruiker-is-geblokkeerd')
				);
			} else {
				ToastService.danger(
					t(
						'admin/users/views/user-detail___het-updaten-van-de-gebruiker-is-mislukt-omdat-zijn-id-niet-kon-worden-gevonden'
					)
				);
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to update is_blocked field for user', err, {
					profile: storedProfile,
				})
			);
			ToastService.danger(
				t('admin/users/views/user-detail___het-updaten-van-de-gebruiker-is-mislukt')
			);
		}
	};

	const renderList = (list: { id: number; label: string }[], path?: string): ReactNode => {
		return (
			<Table horizontal variant="invisible" className="c-table_detail-page">
				<tbody>
					{list.map((item) => {
						return (
							<tr key={`user-group-row-${item.id}`}>
								<td>
									{!!path ? (
										<Link
											to={buildLink(path, {
												id: item.id,
											})}
										>
											{item.label}
										</Link>
									) : (
										item.label
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</Table>
		);
	};

	const renderPermissionLists = () => {
		const permissionGroups: { id: number; label: string }[] = [];
		const permissions: { id: number; label: string }[] = [];

		const profileUserGroup: RawUserGroup[] = get(
			storedProfile,
			'profile_user_groups[0].groups',
			[]
		);

		profileUserGroup.forEach((group) => {
			const rawPermissionGroups: RawUserGroupPermissionGroupLink[] = get(
				group,
				'group_user_permission_groups',
				[]
			);
			rawPermissionGroups.forEach((permissionGroup) => {
				permissionGroups.push({
					id: permissionGroup.permission_group.id,
					label: permissionGroup.permission_group.label,
				});
				const rawPermissions: RawPermissionLink[] = get(
					permissionGroup.permission_group,
					'permission_group_user_permissions'
				);
				rawPermissions.map((permission) =>
					permissions.push({
						id: permission.permission.id,
						label: permission.permission.label,
					})
				);
			});
		});

		return (
			<>
				<Spacer margin="top-extra-large">
					<Accordion
						title={t('admin/users/views/user-detail___permissiegroepen')}
						isOpen={false}
					>
						{renderList(
							sortBy(permissionGroups, 'label'),
							ADMIN_PATH.PERMISSION_GROUP_DETAIL
						)}
					</Accordion>
					<Accordion
						title={t('admin/users/views/user-detail___permissies')}
						isOpen={false}
					>
						{renderList(sortBy(permissions, 'label'))}
					</Accordion>
				</Spacer>
			</>
		);
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

		const userGroup: RawUserGroup = get(storedProfile, 'profile_user_groups[0].group', []);

		return (
			<Container mode="vertical" size="small">
				<Container mode="horizontal">
					<Table horizontal variant="invisible" className="c-table_detail-page">
						<tbody>
							{renderDetailRow(
								renderAvatar(storedProfile, { small: false }),
								t('admin/users/views/user-detail___avatar')
							)}
							{renderSimpleDetailRows(storedProfile, [
								['user.first_name', t('admin/users/views/user-detail___voornaam')],
								['user.last_name', t('admin/users/views/user-detail___achternaam')],
								['alias', t('admin/users/views/user-detail___gebruikersnaam')],
								['title', t('admin/users/views/user-detail___functie')],
								['bio', t('admin/users/views/user-detail___bio')],
								['stamboek', t('admin/users/views/user-detail___stamboek-nummer')],
								[
									'user.mail',
									t('admin/users/views/user-detail___primair-email-adres'),
								],
								[
									'alternative_email',
									t('admin/users/views/user-detail___secundair-email-adres'),
								],
							])}
							{renderDetailRow(
								<Link
									to={buildLink(ADMIN_PATH.USER_GROUP_DETAIL, {
										id: userGroup.id,
									})}
								>
									{userGroup.label}
								</Link>,
								t('admin/users/views/user-detail___gebruikersgroep')
							)}
							{renderDateDetailRows(storedProfile, [
								['created_at', 'Aangemaakt op'],
								['updated_at', 'Aangepast op'],
								['user.last_access_at', 'Laatste toegang'],
							])}
							{renderSimpleDetailRows(storedProfile, [
								['business_category', t('admin/users/views/user-detail___oormerk')],
								[
									'is_exception',
									t('admin/users/views/user-detail___uitzonderingsaccount'),
								],
								[
									'user.is_blocked',
									t('admin/users/views/user-detail___geblokkeerd'),
								],
							])}
							{renderDetailRow(
								<TagList
									tags={get(storedProfile, 'user.idpmaps', []).map(
										(idpMap: { idp: Avo.Auth.IdpType }): TagOption => ({
											color: IDP_COLORS[idpMap.idp],
											label: idpMap.idp,
											id: idpMap.idp,
										})
									)}
								/>,
								t('admin/users/views/user-detail___gelinked-aan')
							)}
							{renderDetailRow(
								<TagList
									tags={get(
										storedProfile,
										'profile_classifications',
										[] as any[]
									).map(
										(subject: { key: string }): TagOption => ({
											id: subject.key,
											label: subject.key,
										})
									)}
									swatches={false}
									closable={false}
								/>,
								t('admin/users/views/user-detail___vakken')
							)}
							{renderDetailRow(
								<TagList
									tags={get(storedProfile, 'profile_contexts', [] as any[]).map(
										(educationLevel: { key: string }): TagOption => ({
											id: educationLevel.key,
											label: educationLevel.key,
										})
									)}
									swatches={false}
									closable={false}
								/>,
								t('admin/users/views/user-detail___opleidingsniveaus')
							)}
							{renderDetailRow(
								<TagList
									closable={false}
									swatches={false}
									tags={eduOrgNames.map((eduOrgName) => ({
										label: eduOrgName,
										id: eduOrgName,
									}))}
								/>,
								t('admin/users/views/user-detail___educatieve-organisaties')
							)}
							{renderDetailRow(
								get(storedProfile, 'organisation.name'),
								t('admin/users/views/user-detail___bedrijf')
							)}
						</tbody>
					</Table>
					{renderPermissionLists()}
				</Container>
			</Container>
		);
	};

	const renderUserDetailPage = () => {
		const isBlocked = get(storedProfile, 'user.is_blocked');
		const blockButtonTooltip = isBlocked
			? t(
					'admin/users/views/user-detail___laat-deze-gebruiker-terug-toe-op-het-av-o-platform'
			  )
			: t('admin/users/views/user-detail___ban-deze-gebruiker-van-het-av-o-platform');
		return (
			<AdminLayout
				onClickBackButton={() => navigate(history, ADMIN_PATH.USER_OVERVIEW)}
				pageTitle={t('admin/users/views/user-detail___gebruiker-details')}
				size="large"
			>
				<AdminLayoutTopBarRight>
					<ButtonToolbar>
						{canBanUser() && (
							<Button
								type={isBlocked ? 'primary' : 'danger'}
								label={
									isBlocked
										? t('admin/users/views/user-detail___deblokkeren')
										: t('admin/users/views/user-detail___blokkeren')
								}
								title={blockButtonTooltip}
								ariaLabel={blockButtonTooltip}
								onClick={() => toggleBlockedStatus()}
							/>
						)}
						<Button
							label={t('admin/users/views/user-detail___bewerken')}
							ariaLabel={t('admin/users/views/user-detail___bewerk-deze-gebruiker')}
							onClick={() =>
								redirectToClientPage(
									buildLink(ADMIN_PATH.USER_EDIT, { id: match.params.id }),
									history
								)
							}
						/>
						<Button
							label={t('admin/users/views/user-detail___beheer-in-account-manager')}
							ariaLabel={t(
								'admin/users/views/user-detail___open-deze-gebruiker-in-het-account-beheer-dashboard-van-meemoo'
							)}
							disabled={!getLdapDashboardUrl()}
							title={
								getLdapDashboardUrl()
									? t(
											'admin/users/views/user-detail___open-deze-gebruiker-in-het-account-beheer-dashboard-van-meemoo'
									  )
									: t(
											'admin/users/views/user-detail___deze-gebruiker-is-niet-gelinked-aan-een-archief-account'
									  )
							}
							onClick={handleLdapDashboardClick}
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

export default UserDetail;
