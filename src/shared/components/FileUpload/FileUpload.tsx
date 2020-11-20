import { compact, isString } from 'lodash-es';
import queryString from 'query-string';
import React, { FunctionComponent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Blankslate,
	Button,
	Flex,
	FlexItem,
	Icon,
	IconName,
	Spacer,
	Spinner,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { CustomError } from '../../helpers';
import { getUrlInfo, isPhoto, isVideo, PHOTO_TYPES } from '../../helpers/files';
import { ToastService } from '../../services';
import { FileUploadService } from '../../services/file-upload-service';
import i18n from '../../translations/i18n';

import './FileUpload.scss';

export interface FileUploadProps {
	icon?: IconName;
	label?: string;
	allowedTypes?: string[];
	allowMulti?: boolean;
	assetType: Avo.FileUpload.AssetType;
	ownerId: string;
	urls: string[] | null;
	showDeleteButton?: boolean;
	disabled?: boolean;
	onChange: (urls: string[]) => void;
}

const FileUpload: FunctionComponent<FileUploadProps> = ({
	icon,
	label,
	allowedTypes = PHOTO_TYPES,
	allowMulti = true,
	assetType,
	ownerId,
	urls,
	showDeleteButton = true,
	disabled = false,
	onChange,
}) => {
	const [t] = useTranslation();
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	const uploadSelectedFile = async (files: File[] | null) => {
		try {
			if (files && files.length) {
				// If allowedTypes array is empty, all filetypes are allowed
				const notAllowedFiles = allowedTypes.length
					? files.filter((file) => !allowedTypes.includes(file.type))
					: [];
				if (notAllowedFiles.length) {
					ToastService.danger(
						t(
							'shared/components/file-upload/file-upload___een-geselecteerde-bestand-is-niet-toegelaten'
						)
					);
					return;
				}

				// Upload all files in series
				setIsProcessing(true);
				const uploadedUrls: string[] = [];
				for (let i = 0; i < (allowMulti ? files.length : 1); i += 1) {
					uploadedUrls.push(
						await FileUploadService.uploadFile(files[i], assetType, ownerId)
					);
				}
				onChange(allowMulti ? [...urls, ...uploadedUrls] : uploadedUrls);
			}
		} catch (err) {
			console.error(
				new CustomError('Failed to upload files in FileUpload component', err, { files })
			);
			if (files && files.length > 1 && allowMulti) {
				ToastService.danger(
					t(
						'shared/components/file-upload/file-upload___het-uploaden-van-de-bestanden-is-mislukt'
					)
				);
			} else {
				ToastService.danger(
					t(
						'shared/components/file-upload/file-upload___het-uploaden-van-het-bestand-is-mislukt'
					)
				);
			}
		}
		setIsProcessing(false);
	};

	const deleteUploadedFile = async (url: string) => {
		try {
			if (assetType === 'ZENDESK_ATTACHMENT') {
				// We don't manage zendesk attachments
				onChange([]);
				return;
			}
			setIsProcessing(true);
			if (urls) {
				const newUrls = [...urls];
				for (let i = newUrls.length - 1; i >= 0; i -= 1) {
					if (newUrls[i] === url) {
						await FileUploadService.deleteFile(url);
						newUrls.splice(i, 1);
					}
				}
				onChange(newUrls);
			} else {
				onChange([]);
			}
		} catch (err) {
			console.error(new CustomError('Failed to delete asset', err, { urls }));
			ToastService.danger(
				t(
					'shared/components/file-upload/file-upload___het-verwijderen-van-het-bestand-is-mislukt'
				)
			);
		}
		setIsProcessing(false);
	};

	const renderDeleteButton = (url: string) => {
		if (disabled || !showDeleteButton) {
			return null;
		}
		return (
			<Button
				className="a-delete-button"
				type="danger-hover"
				icon="trash-2"
				ariaLabel={t('shared/components/file-upload/file-upload___verwijder-bestand')}
				title={t('shared/components/file-upload/file-upload___verwijder-bestand')}
				autoHeight
				disabled={isProcessing}
				onClick={() => deleteUploadedFile(url)}
			/>
		);
	};

	const renderFilesPreview = () => {
		if (!urls) {
			return null;
		}

		return compact(urls).map((url) => {
			if (isPhoto(url)) {
				return (
					<Spacer margin="bottom-small" key={url}>
						<div
							className="a-upload-media-preview"
							style={{ backgroundImage: `url(${url})` }}
						>
							{renderDeleteButton(url)}
						</div>
					</Spacer>
				);
			}
			if (isVideo(url)) {
				return (
					<Spacer margin="bottom-small" key={url}>
						<div className="a-upload-media-preview">
							<video src={url} controls />
							{renderDeleteButton(url)}
						</div>
					</Spacer>
				);
			}
			let fileName: string | undefined;
			if (url.includes('?')) {
				const queryParams = queryString.parse(url.split('?').pop() || '');
				if (queryParams && queryParams.name && isString(queryParams.name)) {
					fileName = queryParams.name as string;
				}
			}
			if (!fileName && url) {
				const urlInfo = getUrlInfo(url.split('?')[0]);
				fileName = `${urlInfo.fileName.substring(
					0,
					urlInfo.fileName.length - '-00000000-0000-0000-0000-000000000000'.length
				)}.${urlInfo.extension}`;
			}

			return (
				<Spacer margin="bottom-small" key={url}>
					<Blankslate
						title={fileName || ''}
						icon="file"
						className="a-upload-file-preview"
					>
						{renderDeleteButton(url)}
					</Blankslate>
				</Spacer>
			);
		});
	};

	// Render
	return (
		<div className="c-file-upload">
			{renderFilesPreview()}
			{!disabled &&
				(!isProcessing ? (
					<Flex>
						{!!icon && (
							<FlexItem shrink>
								<Icon size="large" name={icon} />
							</FlexItem>
						)}
						<FlexItem className="c-file-upload-button-and-input">
							<Button
								label={
									label ||
									(allowMulti
										? i18n.t(
												'shared/components/file-upload/file-upload___selecteer-bestanden'
										  )
										: i18n.t(
												'shared/components/file-upload/file-upload___selecteer-een-bestand'
										  ))
								}
								ariaLabel={label}
								type="secondary"
								autoHeight
							/>
							<input
								type="file"
								title={t(
									'shared/components/file-upload/file-upload___kies-een-bestand'
								)}
								multiple={allowMulti}
								onChange={(evt) =>
									!!evt.target.files &&
									uploadSelectedFile(Array.from(evt.target.files))
								}
							/>
						</FlexItem>
					</Flex>
				) : (
					<Spinner size="large" />
				))}
		</div>
	);
};

export default FileUpload;
