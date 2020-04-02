import { cloneDeep, isEqual, isNil, startCase } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	ButtonGroup,
	ButtonToolbar,
	Container,
	Flex,
	IconName,
	Spacer,
	Table,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../../shared/components';
import { CustomError, navigate } from '../../../shared/helpers';
import { ToastService } from '../../../shared/services';

import { AdminLayout, AdminLayoutActions, AdminLayoutBody } from '../../shared/layouts';
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
				message: t('Het laden van de menu items is mislukt'),
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
				t('admin/menu/views/menu-detail___het-navigatie-item-is-succesvol-verwijderd'),
				false
			);
		} catch (err) {
			console.error(new CustomError('Failed to delete menu item', err, { idToDelete }));
			ToastService.danger(
				t(
					'admin/menu/views/menu-detail___het-verwijderen-van-het-navigatie-item-is-mislukt'
				),
				false
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
				t('admin/menu/views/menu-detail___de-navigatie-items-zijn-succesvol-opgeslagen'),
				false
			);
		} catch (err) {
			console.error(new CustomError('Failed to update menu items', err, { menuItems }));
			ToastService.danger(
				t('admin/menu/views/menu-detail___het-opslaan-van-de-navigatie-items-is-mislukt'),
				false
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
				title={`Verplaats item naar ${decrease ? 'boven' : 'onder'}`}
				type="secondary"
				disabled={disabled}
			/>
		);
	};

	const renderMenuDetail = () => {
		// Return to overview if menu is empty
		if (!menuItems) {
			ToastService.danger(
				t('admin/menu/views/menu-detail___er-werden-geen-navigatie-items-gevonden'),
				false
			);
			handleNavigate(MENU_PATH.MENU);
			return null;
		}

		const isFirst = (i: number) => i === 0;
		const isLast = (i: number) => i === menuItems.length - 1;

		return (
			<AdminLayout className="c-menu-detail" showBackButton pageTitle={startCase(menuId)}>
				<AdminLayoutBody>
					<Container mode="vertical" size="small">
						<Container mode="horizontal">
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
											<td>{item.label}</td>
											<td>
												<ButtonToolbar>
													<Button
														icon="edit-2"
														onClick={() =>
															handleNavigate(
																MENU_PATH.MENU_ITEM_EDIT,
																{
																	menu: menuId,
																	id: String(item.id),
																}
															)
														}
														type="secondary"
													/>
													<Button
														icon="delete"
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
										label={t(
											'admin/menu/views/menu-detail___voeg-een-item-toe'
										)}
										onClick={() =>
											handleNavigate(MENU_PATH.MENU_ITEM_CREATE, {
												menu: menuId,
											})
										}
										type="borderless"
									/>
								</Flex>
							</Spacer>
							<DeleteObjectModal
								deleteObjectCallback={() => handleDelete()}
								isOpen={isConfirmModalOpen}
								onClose={() => setIsConfirmModalOpen(false)}
							/>
						</Container>
					</Container>
				</AdminLayoutBody>
				<AdminLayoutActions>
					<Button
						label={t('admin/menu/views/menu-detail___annuleer')}
						onClick={() => handleNavigate(MENU_PATH.MENU)}
						type="tertiary"
					/>
					<Button
						disabled={isEqual(initialMenuItems, menuItems) || isSaving}
						label={t('admin/menu/views/menu-detail___opslaan')}
						onClick={() => handleSave()}
					/>
				</AdminLayoutActions>
			</AdminLayout>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={menuItems}
			render={renderMenuDetail}
		/>
	);
};

export default MenuDetail;
