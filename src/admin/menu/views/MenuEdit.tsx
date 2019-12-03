import { useMutation } from '@apollo/react-hooks';
import { get, startCase } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { ValueType } from 'react-select';

import { Button, Flex, Form, FormGroup, IconName, Spinner, TextInput } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { navigate } from '../../../shared/helpers';
import { ApolloCacheManager } from '../../../shared/services/data-service';
import {
	fetchMenuItemById,
	fetchMenuItemsByPlacement,
} from '../../../shared/services/menu-service';
import toastService from '../../../shared/services/toast-service';
import { ReactSelectOption } from '../../../shared/types';

import { IconPicker } from '../../shared/components';
import { AdminLayout, AdminLayoutActions, AdminLayoutBody } from '../../shared/layouts';
import { INITIAL_MENU_FORM, MENU_ICON_OPTIONS, MENU_PATH, PAGE_TYPES_LANG } from '../menu.const';
import { INSERT_MENU_ITEM, UPDATE_MENU_ITEM_BY_ID } from '../menu.gql';
import { MenuEditForm, MenuEditPageType, MenuEditParams } from '../menu.types';

interface MenuEditProps extends RouteComponentProps<MenuEditParams> {}

const MenuEdit: FunctionComponent<MenuEditProps> = ({ history, match }) => {
	const { menu: menuParentId, id: menuItemId } = match.params;

	const [menuForm, setMenuForm] = useState<MenuEditForm>(INITIAL_MENU_FORM);
	const [pageType, setPageType] = useState<MenuEditPageType>(menuItemId ? 'edit' : 'create');
	const [initialMenuItem, setInitialMenuItem] = useState<Avo.Menu.Menu | null>(null);
	const [menuItems, setMenuItems] = useState<Avo.Menu.Menu[]>([]);
	const [formErrors, setFormErrors] = useState<Partial<MenuEditForm>>({});
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);

	const [triggerMenuItemInsert] = useMutation(INSERT_MENU_ITEM);
	const [triggerMenuItemUpdate] = useMutation(UPDATE_MENU_ITEM_BY_ID);

	useEffect(() => {
		if (menuParentId) {
			fetchMenuItemsByPlacement(menuParentId).then(
				(menuItemsByPosition: Avo.Menu.Menu[] | null) => {
					if (menuItemsByPosition && menuItemsByPosition.length) {
						setMenuItems(menuItemsByPosition);
					}
				}
			);
		}
	}, [menuParentId]);

	useEffect(() => {
		if (menuItemId) {
			setPageType('edit');
			setIsLoading(true);
			fetchMenuItemById(Number(menuItemId)).then((menuItem: Avo.Menu.Menu | null) => {
				if (menuItem) {
					// Remove unnecessary props for saving
					delete (menuItem as any).__typename;

					setInitialMenuItem(menuItem);
					setMenuForm({
						icon: menuItem.icon_name as IconName,
						label: menuItem.label,
						link: menuItem.link_target || '',
					});
					setIsLoading(false);
				}
			});
		} else {
			setPageType('create');
			setIsLoading(false);
		}
	}, [menuItemId]);

	// Computed
	const pageTitle = `${startCase(menuParentId)}: item ${PAGE_TYPES_LANG[pageType]}`;

	// Methods
	const handleChange = (key: keyof MenuEditForm, value: any): void => {
		setMenuForm({
			...menuForm,
			[key]: value,
		});
	};

	const handleSave = (): void => {
		setIsSaving(true);

		// Validate form
		const isFormValid = handleValidation();

		if (!isFormValid) {
			setIsSaving(false);

			return;
		}

		// Create
		const menuItem: Partial<Partial<Avo.Menu.Menu>> = {
			icon_name: menuForm.icon,
			label: menuForm.label,
			link_target: menuForm.link,
			placement: menuParentId,
		};

		if (pageType === 'create') {
			triggerMenuItemInsert({
				variables: {
					menuItem: {
						...menuItem,
						description: get(menuItems, '[0].description', ''),
						position: menuItems.length,
					},
				},
				update: ApolloCacheManager.clearNavElementsCache,
			})
				.then(() => handleResponse('Het navigatie item is succesvol aangemaakt'))
				.catch(err =>
					handleResponse('Het aanmaken van het navigatie item is mislukt', err || null)
				);
		} else {
			triggerMenuItemUpdate({
				variables: {
					id: menuItemId,
					menuItem: {
						...initialMenuItem,
						...menuItem,
						updated_at: new Date().toISOString(),
					},
				},
				update: ApolloCacheManager.clearNavElementsCache,
			})
				.then(() => handleResponse('Het navigatie item is succesvol geüpdatet'))
				.catch(err => handleResponse('Het updaten van het navigatie item is mislukt', err || null));
		}
	};

	const handleResponse = (message: string, err?: any): void => {
		setIsSaving(false);
		const hasError = err || err === null;
		toastService[hasError ? 'danger' : 'success'](message);

		if (hasError) {
			console.error(err);
			return;
		}

		navigate(history, MENU_PATH.MENU_DETAIL, { menu: menuParentId });
	};

	const handleValidation = (): boolean => {
		const errors: Partial<MenuEditForm> = {};

		if (!menuForm.label) {
			errors.label = 'Label is verplicht';
		}

		if (!menuForm.link) {
			errors.link = 'Link is verplicht';
		}

		setFormErrors(errors);

		return Object.keys(errors).length === 0;
	};

	const navigateBack = () => navigate(history, MENU_PATH.MENU_DETAIL, { menu: menuParentId });

	// Render
	return isLoading ? (
		<Flex orientation="horizontal" center>
			<Spinner size="large" />
		</Flex>
	) : (
		<AdminLayout navigateBack={navigateBack} pageTitle={pageTitle}>
			<AdminLayoutBody>
				<Form>
					<FormGroup label="Icoon">
						<IconPicker
							options={MENU_ICON_OPTIONS}
							onChange={(e: ValueType<ReactSelectOption<string>>) =>
								handleChange('icon', get(e, 'value', ''))
							}
							value={MENU_ICON_OPTIONS.find(
								(option: ReactSelectOption<string>) => option.value === menuForm.icon
							)}
						/>
					</FormGroup>
					<FormGroup error={formErrors.label} label="Label" required>
						<TextInput
							onChange={(value: string) => handleChange('label', value)}
							value={menuForm.label}
						/>
					</FormGroup>
					<FormGroup error={formErrors.link} label="Link" required>
						<TextInput
							onChange={(value: string) => handleChange('link', value)}
							value={menuForm.link}
						/>
					</FormGroup>
				</Form>
			</AdminLayoutBody>
			<AdminLayoutActions>
				<Button disabled={isSaving} label="Opslaan" onClick={handleSave} />
				<Button label="Annuleer" onClick={navigateBack} type="tertiary" />
			</AdminLayoutActions>
		</AdminLayout>
	);
};

export default withRouter(MenuEdit);
