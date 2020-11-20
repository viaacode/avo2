import { cloneDeep, isEqual, isNil, startCase } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MetaTags from 'react-meta-tags';

import {
	Button,
	ButtonGroup,
	ButtonToolbar,
	Flex,
	IconName,
	Spacer,
	Table,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { GENERATE_SITE_TITLE } from '../../../constants';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { CustomError, navigate } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';
import { ADMIN_PATH } from '../../admin.const';
import { AdminLayout, AdminLayoutBody, AdminLayoutTopBarRight } from '../../shared/layouts';
import { MENU_PATH } from '../menu.const';
import { MenuService } from '../menu.service';

import './MenuDetail.scss';

interface MenuDetailProps extends DefaultSecureRouteProps<{ menu: string }> {}

const MenuDetail: FunctionComponent<MenuDetailProps> = ({ history, match }) => {
	const [t] = useTranslation();

	const menuId = match.params.menu;

	const [activeRow, setActiveRow] = useState<number | null>(null);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
	const [idToDelete, setIdToDelete] = useState<number | null>(null);
	const [menuItems, setMenuItems] = useState<Avo.Menu.Menu[] | null>(null);
	const [initialMenuItems, setInitialMenuItems] = useState<Avo.Menu.Menu[] | null>(null);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });

	const timeout = useRef<NodeJS.Timeout | null>(null);

	const fetchMenuItems = useCallback(async () => {
		try {
			const tempMenuItems = await MenuService.fetchMenuItems(menuId);

			// Set items position property equal to index in array
			const reindexedMenuItems = reindexMenuItems(tempMenuItems);

			setInitialMenuItems(reindexedMenuItems);
			setMenuItems(reindexedMenuItems);
		} catch (err) {
			console.error('Failed to fetch menu items', err, { menuId });
			setLoadingInfo({
				state: 'error',
				message: t('admin/menu/views/menu-detail___het-laden-van-de-menu-items-is-mislukt'),
			});
		}
	}, [menuId, setMenuItems, setLoadingInfo, t]);

	useEffect(() => {
		fetchMenuItems();
	}, [fetchMenuItems]);

	useEffect(() => {
		if (menuItems) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [menuItems, setLoadingInfo]);

	useEffect(() => {
		// Reset active row to clear styling
		timeout.current = setTimeout(() => {
			setActiveRow(null);
		}, 1000);

		return () => {
			if (timeout.current) {
				clearTimeout(timeout.current);
			}
		};
	}, [activeRow]);

	// Methods
	const handleDelete = async (): Promise<void> => {
		try {
			if (isNil(idToDelete)) {
				throw new CustomError('The idToDelete is not defined', null, { idToDelete });
			}
			await MenuService.deleteMenuItem(idToDelete);
			fetchMenuItems();
			ToastService.success(
				t('admin/menu/views/menu-detail___het-navigatie-item-is-succesvol-verwijderd')
			);
		} catch (err) {
			console.error(new CustomError('Failed to delete menu item', err, { idToDelete }));
			ToastService.danger(
				t(
					'admin/menu/views/menu-detail___het-verwijderen-van-het-navigatie-item-is-mislukt'
				)
			);
		}
	};

	const handleNavigate = (path: string, params: { [key: string]: string } = {}): void => {
		navigate(history, path, params);
	};

	const handleSave = async () => {
		try {
			if (!menuItems) {
				return;
			}
			setIsSaving(true);

			await MenuService.updateMenuItems(menuItems);

			fetchMenuItems();
			ToastService.success(
				t('admin/menu/views/menu-detail___de-navigatie-items-zijn-succesvol-opgeslagen')
			);
		} catch (err) {
			console.error(new CustomError('Failed to update menu items', err, { menuItems }));
			ToastService.danger(
				t('admin/menu/views/menu-detail___het-opslaan-van-de-navigatie-items-is-mislukt')
			);
		}
	};

	const openConfirmModal = (id: number): void => {
		setIdToDelete(id);
		setIsConfirmModalOpen(true);
	};

	const reindexMenuItems = (items: Avo.Menu.Menu[]): Avo.Menu.Menu[] =>
		items.map((item, index) => {
			item.position = index;
			// Remove properties that we don't need for save
			delete (item as any).__typename;

			return item;
		});

	const reorderMenuItem = (currentIndex: number, indexUpdate: number, id: number): void => {
		if (!menuItems) {
			return;
		}
		const newIndex = currentIndex + indexUpdate;
		const menuItemsCopy = cloneDeep(menuItems);
		// Get updated item and remove it from copy
		const updatedItem = menuItemsCopy.splice(currentIndex, 1)[0];
		// Add item back at new index
		menuItemsCopy.splice(newIndex, 0, updatedItem);

		setActiveRow(id);
		setMenuItems(reindexMenuItems(menuItemsCopy));
	};

	// Render
	const renderReorderButton = (
		dir: 'up' | 'down',
		index: number,
		id: number,
		disabled: boolean
	) => {
		const decrease = dir === 'up';
		const indexUpdate = decrease ? -1 : 1;

		return (
			<Button
				icon={`chevron-${dir}` as IconName}
				onClick={() => reorderMenuItem(index, indexUpdate, id)}
				title={
					dir === 'up'
						? t('admin/menu/views/menu-detail___verplaats-het-item-naar-boven')
						: t('admin/menu/views/menu-detail___verplaats-het-item-naar-onder')
				}
				ariaLabel={
					dir === 'up'
						? t('admin/menu/views/menu-detail___verplaats-het-item-naar-boven')
						: t('admin/menu/views/menu-detail___verplaats-het-item-naar-onder')
				}
				type="secondary"
				disabled={disabled}
			/>
		);
	};

	const renderMenuDetail = () => {
		// Return to overview if menu is empty
		if (!menuItems) {
			ToastService.danger(
				t('admin/menu/views/menu-detail___er-werden-geen-navigatie-items-gevonden')
			);
			handleNavigate(MENU_PATH.MENU_OVERVIEW);
			return null;
		}

		const isFirst = (i: number) => i === 0;
		const isLast = (i: number) => i === menuItems.length - 1;

		return (
			<AdminLayout
				onClickBackButton={() => navigate(history, ADMIN_PATH.MENU_OVERVIEW)}
				className="c-menu-detail"
				pageTitle={startCase(menuId)}
				size="full-width"
			>
				<AdminLayoutTopBarRight>
					<ButtonToolbar>
						<Button
							label={t('admin/menu/views/menu-detail___annuleer')}
							onClick={() => handleNavigate(MENU_PATH.MENU_OVERVIEW)}
							type="tertiary"
						/>
						<Button
							disabled={isEqual(initialMenuItems, menuItems) || isSaving}
							label={t('admin/menu/views/menu-detail___opslaan')}
							onClick={() => handleSave()}
						/>
					</ButtonToolbar>
				</AdminLayoutTopBarRight>
				<AdminLayoutBody>
					<Table align className="c-menu-detail__table" variant="styled">
						<tbody>
							{menuItems.map((item, index) => (
								<tr
									key={`nav-edit-${item.id}`}
									className={
										activeRow === item.id
											? 'c-menu-detail__table-row--active'
											: ''
									}
								>
									<td className="o-table-col-1">
										<ButtonGroup>
											{renderReorderButton(
												'up',
												index,
												item.id,
												isFirst(index)
											)}
											{renderReorderButton(
												'down',
												index,
												item.id,
												isLast(index)
											)}
										</ButtonGroup>
									</td>
									<td>{item.label || item.tooltip || item.content_path}</td>
									<td>
										<ButtonToolbar>
											<Button
												icon="edit-2"
												onClick={() =>
													handleNavigate(MENU_PATH.MENU_ITEM_EDIT, {
														menu: menuId,
														id: String(item.id),
													})
												}
												title={t(
													'admin/menu/views/menu-detail___bewerk-dit-navigatie-item'
												)}
												ariaLabel={t(
													'admin/menu/views/menu-detail___bewerk-dit-navigatie-item'
												)}
												type="secondary"
											/>
											<Button
												icon="delete"
												title={t(
													'admin/menu/views/menu-detail___verwijder-dit-navigatie-item'
												)}
												ariaLabel={t(
													'admin/menu/views/menu-detail___verwijder-dit-navigatie-item'
												)}
												onClick={() => openConfirmModal(item.id)}
												type="danger-hover"
											/>
										</ButtonToolbar>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
					<Spacer margin="top">
						<Flex center>
							<Button
								icon="plus"
								label={t('admin/menu/views/menu-detail___voeg-een-item-toe')}
								onClick={() =>
									handleNavigate(MENU_PATH.MENU_ITEM_CREATE, {
										menu: menuId,
									})
								}
								type="primary"
							/>
						</Flex>
					</Spacer>
					<DeleteObjectModal
						deleteObjectCallback={handleDelete}
						isOpen={isConfirmModalOpen}
						onClose={() => setIsConfirmModalOpen(false)}
					/>
				</AdminLayoutBody>
			</AdminLayout>
		);
	};

	return (
		<>
			<MetaTags>
				<title>
					{GENERATE_SITE_TITLE(
						menuId,
						t('admin/menu/views/menu-detail___menu-beheer-detail-pagina-titel')
					)}
				</title>
				<meta
					name="description"
					content={t(
						'admin/menu/views/menu-detail___menu-beheer-detail-pagina-beschrijving'
					)}
				/>
			</MetaTags>
			<LoadingErrorLoadedComponent
				loadingInfo={loadingInfo}
				dataObject={menuItems}
				render={renderMenuDetail}
			/>
		</>
	);
};

export default MenuDetail;
