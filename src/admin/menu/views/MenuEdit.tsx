import { ApolloQueryResult } from 'apollo-boost';
import { compact, get, isNil, startCase, uniq, uniqBy, without } from 'lodash-es';
import React, { FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import {
	Badge,
	Button,
	ButtonToolbar,
	Flex,
	IconName,
	Spacer,
	Spinner,
	TagInfo,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { SpecialPermissionGroups } from '../../../authentication/authentication.types';
import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { GENERATE_SITE_TITLE } from '../../../constants';
import { CustomError, navigate } from '../../../shared/helpers';
import { dataService, ToastService } from '../../../shared/services';
import { ValueOf } from '../../../shared/types';
import { ADMIN_PATH } from '../../admin.const';
import { GET_PERMISSIONS_FROM_CONTENT_PAGE_BY_PATH } from '../../content/content.gql';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { PickerItem } from '../../shared/types';
import { useUserGroupOptions } from '../../user-groups/hooks/useUserGroupOptions';
import { MenuEditForm } from '../components';
import { GET_PAGE_TYPES_LANG, INITIAL_MENU_FORM, MENU_PATH } from '../menu.const';
import { MenuService } from '../menu.service';
import { MenuEditFormErrorState, MenuEditPageType, MenuEditParams } from '../menu.types';

interface MenuEditProps extends DefaultSecureRouteProps<MenuEditParams> {}

const MenuEdit: FunctionComponent<MenuEditProps> = ({ history, match }) => {
	const [t] = useTranslation();

	const { menu: menuParentId, id: menuItemId } = match.params;
	const menuName = startCase(menuParentId);

	// Hooks
	const [menuForm, setMenuForm] = useState<Avo.Menu.Menu>(
		INITIAL_MENU_FORM(menuParentId ? String(menuParentId) : '0') as Avo.Menu.Menu
	);
	const [initialMenuItem, setInitialMenuItem] = useState<Avo.Menu.Menu | null>(null);
	const [menuItems, setMenuItems] = useState<Avo.Menu.Menu[]>([]);
	const [formErrors, setFormErrors] = useState<MenuEditFormErrorState>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [permissionWarning, setPermissionWarning] = useState<ReactNode | null>(null);
	const [allUserGroups] = useUserGroupOptions('TagInfo', true) as [TagInfo[], boolean];

	// Fetch menu items depending on menu parent param
	// This is necessary for populating the menu parent options for our form
	useEffect(() => {
		MenuService.fetchMenuItems(menuParentId)
			.then((menuItemsByPosition) => {
				if (menuItemsByPosition && menuItemsByPosition.length) {
					setMenuItems(menuItemsByPosition);
				} else {
					// Go back to overview if no menu items are present
					ToastService.danger(
						t(
							'admin/menu/views/menu-edit___er-werden-geen-navigatie-items-gevonden-voor-menu-name',
							{
								menuName,
							}
						)
					);
					history.push(MENU_PATH.MENU_OVERVIEW);
				}
			})
			.catch((err) => {
				console.error(new CustomError('Failed to fetch menu items', err));
				ToastService.danger(
					t('admin/menu/views/menu-edit___het-ophalen-van-de-menu-items-is-mislukt')
				);
			});
	}, [history, menuName, menuParentId, t]);

	// Fetch menu item by id
	useEffect(() => {
		if (menuItemId) {
			setIsLoading(true);
			// Fetch menu item by id so we can populate our form for editing
			MenuService.fetchMenuItemById(Number(menuItemId))
				.then((menuItem: Avo.Menu.Menu | null) => {
					if (menuItem) {
						// Remove unnecessary props for saving
						delete (menuItem as any).__typename;

						setInitialMenuItem(menuItem);
						setMenuForm({
							description: menuItem.description || '',
							icon_name: menuItem.icon_name as IconName,
							label: menuItem.label,
							content_type: menuItem.content_type || 'COLLECTION',
							content_path: String(menuItem.content_path || ''),
							link_target: menuItem.link_target || '_self',
							user_group_ids: menuItem.user_group_ids || [],
							placement: menuItem.placement || null,
							tooltip: menuItem.tooltip,
						} as Avo.Menu.Menu);
					}
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [menuItemId, menuParentId]);

	const checkMenuItemContentPagePermissionsMismatch = useCallback(
		(response: ApolloQueryResult<any>) => {
			let contentUserGroupIds: number[] = get(
				response,
				'data.app_content[0].user_group_ids',
				[]
			);
			const navItemUserGroupIds: number[] = menuForm.user_group_ids || [];
			const allUserGroupIds: number[] = allUserGroups.map((ug) => ug.value as number);

			// Add all user groups to content page user groups if content page is accessible by special user group: logged in users
			if (contentUserGroupIds.includes(SpecialPermissionGroups.loggedInUsers)) {
				contentUserGroupIds = uniq([
					...contentUserGroupIds,
					...without(allUserGroupIds, SpecialPermissionGroups.loggedOutUsers),
				]);
			}

			const faultyUserGroupIds = without(navItemUserGroupIds, ...contentUserGroupIds);
			if (faultyUserGroupIds.length) {
				const faultyUserGroups = compact(
					faultyUserGroupIds.map((faultyUserGroupId) => {
						const faultyUserGroup = allUserGroups.find(
							(userGroup) => userGroup.value === faultyUserGroupId
						);
						return get(faultyUserGroup, 'label', null);
					})
				);
				setPermissionWarning(
					<div>
						<Spacer margin="bottom-small">
							<Trans i18nKey="admin/menu/views/menu-edit___het-navigatie-item-zal-zichtbaar-zijn-voor-gebruikers-die-geen-toegang-hebben-tot-de-geselecteerde-pagina">
								Het navigatie item zal zichtbaar zijn voor gebruikers die geen
								toegang hebben tot de geselecteerde pagina.
							</Trans>
						</Spacer>
						<Spacer margin="bottom-small">
							<Trans i18nKey="admin/menu/views/menu-edit___de-geselecteerde-pagina-is-niet-toegankelijk-voor">
								De geselecteerde pagina is niet toegankelijk voor:
							</Trans>
							<ButtonToolbar>
								{faultyUserGroups.map((group) => (
									<Badge text={group} key={`badge-${group}`} />
								))}
							</ButtonToolbar>
						</Spacer>
					</div>
				);
			} else {
				setPermissionWarning(null);
			}
		},
		[setPermissionWarning, menuForm.user_group_ids, allUserGroups]
	);

	// Check if the navigation item is visible for users that do not have access to the selected content page
	useEffect(() => {
		if (menuForm.content_type === 'CONTENT_PAGE' && menuForm.content_path) {
			// Check if permissions are more strict than the permissions on the content_page
			dataService
				.query({
					query: GET_PERMISSIONS_FROM_CONTENT_PAGE_BY_PATH,
					variables: {
						path: menuForm.content_path,
					},
				})
				.then((response) => {
					checkMenuItemContentPagePermissionsMismatch(response);
				})
				.catch((err) => {
					console.error(
						new CustomError('Failed to get permissions from page', err, {
							query: 'GET_PERMISSIONS_FROM_CONTENT_PAGE_BY_PATH',
							variables: {
								path: menuForm.content_path,
							},
						})
					);
					ToastService.danger(
						t(
							'admin/menu/views/menu-edit___het-controleren-of-de-permissies-van-de-pagina-overeenkomen-met-de-zichtbaarheid-van-dit-navigatie-item-is-mislukt'
						)
					);
				});
		}
	}, [
		menuForm.content_type,
		menuForm.content_path,
		menuForm.user_group_ids,
		checkMenuItemContentPagePermissionsMismatch,
		t,
	]);

	// Computed
	const pageType: MenuEditPageType = menuItemId ? 'edit' : 'create';
	const pageTitle = menuParentId
		? `${menuName}: item ${GET_PAGE_TYPES_LANG()[pageType]}`
		: t('admin/menu/views/menu-edit___navigatie-toevoegen');
	const menuParentOptions = uniqBy(
		compact(
			menuItems.map((menuItem) => {
				if (!menuItem.placement) {
					return null;
				}
				return {
					label: startCase(menuItem.placement || ''),
					value: menuItem.placement,
				};
			})
		),
		'value'
	);

	// Methods
	const handleChange = (
		key: keyof Avo.Menu.Menu | 'content',
		value: ValueOf<Avo.Menu.Menu> | PickerItem | null
	): void => {
		if (key === 'content') {
			setMenuForm({
				...menuForm,
				content_type: get(value, 'type'),
				content_path: get(value, 'value'),
				link_target: get(value, 'target', '_self'),
			});
		} else {
			setMenuForm({
				...menuForm,
				[key]: value,
			});
		}
	};

	const handleSave = async () => {
		try {
			setIsSaving(true);

			// Validate form
			const isFormValid = handleValidation();

			if (!isFormValid) {
				setIsSaving(false);

				return;
			}

			const menuItem: Partial<Avo.Menu.Menu> = {
				icon_name: menuForm.icon_name,
				label: menuForm.label,
				content_path: menuForm.content_path,
				content_type: menuForm.content_type,
				link_target: menuForm.link_target,
				user_group_ids: menuForm.user_group_ids,
				placement: menuForm.placement,
				tooltip: menuForm.tooltip,
			};

			if (pageType === 'create') {
				await MenuService.insertMenuItem({
					...menuItem,
					// Get description from existing items or use form description field
					description: get(menuItems, '[0].description', menuForm.description),
					position: menuItems.length,
				});
				navigate(history, ADMIN_PATH.MENU_DETAIL, {
					menu: menuForm.placement as string,
				});
				ToastService.success(
					t('admin/menu/views/menu-edit___het-navigatie-item-is-succesvol-aangemaakt')
				);
			} else {
				if (isNil(menuItemId)) {
					throw new CustomError('cannot update menu item because id is undefined', null, {
						menuItemId,
					});
				}
				await MenuService.updateMenuItems([
					{
						...initialMenuItem,
						...menuItem,
						id: +menuItemId,
						updated_at: new Date().toISOString(),
					} as Avo.Menu.Menu,
				]);
				navigate(history, ADMIN_PATH.MENU_DETAIL, {
					menu: menuForm.placement as string,
				});
				ToastService.success(
					t('admin/menu/views/menu-edit___het-navigatie-item-is-succesvol-geupdatet')
				);
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to save menu item', err, {
					menuForm,
				})
			);
			ToastService.danger(
				t('admin/menu/views/menu-edit___het-updaten-van-het-navigatie-item-is-mislukt')
			);
		}
		setIsSaving(false);
	};

	const handleValidation = (): boolean => {
		const errors: MenuEditFormErrorState = {};

		if (!menuParentId && !menuForm.placement) {
			errors.placement = t('admin/menu/views/menu-edit___navigatie-naam-is-verplicht');
		}

		if (!menuForm.content_path) {
			errors.content_path = t('admin/menu/views/menu-edit___link-is-verplicht');
		}

		setFormErrors(errors);

		return Object.keys(errors).length === 0;
	};

	const navigateBack = (): void => {
		if (menuParentId) {
			navigate(history, MENU_PATH.MENU_DETAIL, {
				menu: menuParentId,
			});
		} else {
			navigate(history, MENU_PATH.MENU_OVERVIEW);
		}
	};

	// Render
	return isLoading ? (
		<Flex orientation="horizontal" center>
			<Spinner size="large" />
		</Flex>
	) : (
		<AdminLayout
			onClickBackButton={() => navigate(history, ADMIN_PATH.MENU_OVERVIEW)}
			pageTitle={pageTitle}
			size="large"
		>
			<AdminLayoutTopBarRight>
				<ButtonToolbar>
					<Button
						label={t('admin/menu/views/menu-edit___annuleer')}
						onClick={navigateBack}
						type="tertiary"
					/>
					<Button
						disabled={isSaving}
						label={t('admin/menu/views/menu-edit___opslaan')}
						onClick={handleSave}
					/>
				</ButtonToolbar>
			</AdminLayoutTopBarRight>
			<AdminLayoutBody>
				<MetaTags>
					<title>
						{GENERATE_SITE_TITLE(
							get(menuForm, 'label'),
							menuItemId
								? t(
										'admin/menu/views/menu-edit___menu-item-beheer-bewerk-pagina-titel'
								  )
								: t(
										'admin/menu/views/menu-edit___menu-item-beheer-aanmaak-pagina-titel'
								  )
						)}
					</title>
					<meta name="description" content={get(menuForm, 'description') || ''} />
				</MetaTags>
				<MenuEditForm
					formErrors={formErrors}
					formState={menuForm}
					menuParentId={menuParentId}
					menuParentOptions={menuParentOptions}
					onChange={handleChange}
					permissionWarning={permissionWarning}
				/>
			</AdminLayoutBody>
		</AdminLayout>
	);
};

export default MenuEdit;
