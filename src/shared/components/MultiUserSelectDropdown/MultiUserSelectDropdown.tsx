import classnames from 'classnames';
import { get, uniqBy } from 'lodash-es';
import React, { FunctionComponent, ReactText, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	Dropdown,
	DropdownButton,
	DropdownContent,
	Form,
	FormGroup,
	Icon,
	Spacer,
	TagList,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ContentPicker } from '../../../admin/shared/components/ContentPicker/ContentPicker';
import { PickerItem } from '../../../admin/shared/types';
import { UserService } from '../../../admin/users/user.service';
import { CustomError } from '../../helpers';
import { ToastService } from '../../services';

import './MultiUserSelectDropdown.scss';

export interface Tag {
	label: string;
	id: string;
}

export interface MultiUserSelectDropdownProps {
	label: string;
	id: string;
	values: string[];
	disabled?: boolean;
	placeholder?: string;
	onChange: (profileIds: string[], id: string) => void;
	showSelectedValuesOnCollapsed?: boolean;
}

export const MultiUserSelectDropdown: FunctionComponent<MultiUserSelectDropdownProps> = ({
	label,
	id,
	values,
	disabled,
	placeholder,
	onChange,
	showSelectedValuesOnCollapsed = true,
}) => {
	const [t] = useTranslation();

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [selectedProfiles, setSelectedProfiles] = useState<PickerItem[]>([]);
	const [selectedProfile, setSelectedProfile] = useState<PickerItem | undefined>(undefined);

	useEffect(() => {
		if (selectedProfile) {
			setSelectedProfile(undefined);
		}
	}, [selectedProfile, setSelectedProfile]);

	useEffect(() => {
		if (values.length) {
			UserService.getNamesByProfileIds(values)
				.then((profiles: Avo.User.Profile[]) => {
					setSelectedProfiles(
						profiles.map(
							(profile): PickerItem => ({
								label: `${get(profile, 'user.full_name')} (${get(
									profile,
									'user.mail'
								)})`,
								value: profile.id as string,
								type: 'PROFILE',
							})
						)
					);
				})
				.catch((err) => {
					console.error(
						new CustomError('Failed to fetch profile name info for profile ids', err, {
							values,
						})
					);
					ToastService.danger(
						t(
							'shared/components/multi-user-select-dropdown/multi-user-select-dropdown___het-ophalen-van-de-gebruikersaccount-namen-is-mislukt'
						)
					);
				});
		}
	}, [values, setSelectedProfiles, t]);

	const closeDropdown = () => {
		setSelectedProfiles([]);
		setIsOpen(false);
	};

	const applyFilter = () => {
		onChange(
			selectedProfiles.map((profile) => profile.value),
			id
		);
		closeDropdown();
	};

	const removeProfile = (tagId: ReactText) => {
		setSelectedProfiles((selectedProfiles) =>
			selectedProfiles.filter((profile) => profile.value !== tagId)
		);
	};

	const deleteAllSelectedProfiles = () => {
		setSelectedProfiles([]);
		onChange([], id);
	};

	const renderCheckboxControl = () => {
		return (
			<Dropdown
				label={label}
				menuClassName="c-user-dropdown__menu"
				isOpen={isOpen}
				onOpen={() => setIsOpen(true)}
				onClose={closeDropdown}
			>
				<DropdownButton>
					<Button
						autoHeight
						className="c-checkbox-dropdown-modal__trigger"
						type="secondary"
					>
						<div className="c-button__content">
							<div className="c-button__label">{label}</div>
							{!!selectedProfiles.length && showSelectedValuesOnCollapsed && (
								<TagList
									tags={[
										{
											id: 'users',
											label: `${selectedProfiles.length} ${
												selectedProfiles.length > 1
													? t(
															'shared/components/multi-user-select-dropdown/multi-user-select-dropdown___gebruikers'
													  )
													: t(
															'shared/components/multi-user-select-dropdown/multi-user-select-dropdown___gebruiker'
													  )
											}`,
										},
									]}
									swatches={false}
									closable
									onTagClosed={deleteAllSelectedProfiles}
								/>
							)}
							<Icon
								className="c-button__icon"
								name={isOpen ? 'caret-up' : 'caret-down'}
								size="small"
								type="arrows"
							/>
						</div>
					</Button>
				</DropdownButton>
				<DropdownContent>
					<Spacer>
						<Form>
							{!!selectedProfiles.length && showSelectedValuesOnCollapsed && (
								<TagList
									tags={selectedProfiles.map((profile) => ({
										label: profile.label || profile.value,
										id: profile.value,
									}))}
									swatches={false}
									closable
									onTagClosed={removeProfile}
								/>
							)}
							<Spacer margin={['top', 'bottom']}>
								<div key={`profile-content-picker-${selectedProfile?.label}`}>
									<ContentPicker
										onSelect={(selectedProfile) => {
											if (selectedProfile) {
												setSelectedProfiles((selectedProfiles) =>
													uniqBy(
														[...selectedProfiles, selectedProfile],
														'value'
													)
												);
												setSelectedProfile(selectedProfile);
											}
										}}
										hideTargetSwitch
										allowedTypes={['PROFILE']}
										hideTypeDropdown
										placeholder={
											placeholder ||
											t(
												'shared/components/multi-user-select-dropdown/multi-user-select-dropdown___selecteer-een-gebruiker'
											)
										}
										initialValue={selectedProfile}
									/>
								</div>
							</Spacer>

							<FormGroup>
								<Button
									label={t(
										'shared/components/checkbox-dropdown-modal/checkbox-dropdown-modal___toepassen'
									)}
									type="primary"
									className="c-apply-filter-button"
									block
									onClick={applyFilter}
								/>
							</FormGroup>
						</Form>
					</Spacer>
				</DropdownContent>
			</Dropdown>
		);
	};

	if (disabled) {
		return (
			<div className={classnames({ 'u-opacity-50 u-disable-click': disabled })}>
				{renderCheckboxControl()}
			</div>
		);
	}

	return renderCheckboxControl();
};
