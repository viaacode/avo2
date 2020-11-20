import { isNil } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@viaa/avo2-components';

import { PermissionService } from '../../../../authentication/helpers/permission-service';
import { CustomError } from '../../../../shared/helpers';
import { ToastService } from '../../../../shared/services';

import './UpdatePermissionsButton.scss';

interface UpdatePermissionsButtonProps {}

export const UpdatePermissionsButton: FunctionComponent<UpdatePermissionsButtonProps> = () => {
	const [t] = useTranslation();
	// undefined: progress has not been fetched yet
	// null: progress has been fetched, and there is currently no task in progress
	// number: progress has been fetched and there is currently a task in progress. Number indicated % completed
	const [progress, setProgress] = useState<number | null | undefined>(undefined);

	const inProgress = !isNil(progress);

	const getLabel = () => {
		if (isNil(progress)) {
			return t(
				'admin/shared/components/update-permissions-button/update-permissions-button___permissies-toepassen'
			);
		}
		return t(
			'admin/shared/components/update-permissions-button/update-permissions-button___bezig-met-permissies-toepassen-percentage',
			{ percentage: progress }
		);
	};

	const updateProgress = useCallback(async (): Promise<void> => {
		const newProgress = await PermissionService.getUpdatePermissionsProgress();
		setProgress((oldProgress) => {
			// progress went from percentage to null => that means it completed the task
			if (!isNil(oldProgress) && isNil(newProgress)) {
				ToastService.success(
					t(
						'admin/shared/components/update-permissions-button/update-permissions-button___het-toepassen-van-de-permissies-is-voltooid'
					)
				);
			}
			return newProgress;
		});
	}, [setProgress, t]);

	useEffect(() => {
		updateProgress();
		const timerId = setInterval(updateProgress, 5000);

		return () => {
			clearInterval(timerId);
		};
	}, [updateProgress]);

	const triggerUpdatePermissions = async () => {
		try {
			await updateProgress();

			if (!isNil(progress)) {
				ToastService.danger(t(`Een update is reeds bezig (${progress}%)`));
				return;
			}
			const result: {
				message?: string;
				error?: string;
			} = await PermissionService.triggerUpdatePermissions();
			if (result && result.message === 'started') {
				ToastService.success(
					t(
						'admin/shared/components/update-permissions-button/update-permissions-button___permissie-update-wordt-gestart'
					)
				);
			} else {
				console.error(new CustomError('Permission update start failed', { result }));
				ToastService.info(t(`Permissie update is reeds bezig`));
			}

			await updateProgress();
		} catch (err) {
			console.error(new CustomError('Failed to trigger MAM sync', err));
			ToastService.danger(
				t(
					'admin/items/views/publish-items-overview___het-triggeren-van-een-mam-synchronisatie-is-mislukt'
				)
			);
		}
	};

	if (typeof progress === 'undefined') {
		return null;
	}

	return (
		<div
			style={{ display: 'none' }} // TODO remove display:none once functionality can be exposed to meemoo employees
		>
			<Button
				onClick={inProgress ? () => {} : triggerUpdatePermissions}
				label={getLabel()}
				disabled={inProgress}
				type="danger"
			/>
		</div>
	);
};
