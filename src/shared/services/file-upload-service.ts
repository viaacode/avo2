import { Avo } from '@viaa/avo2-types';

import { CustomError, getEnv } from '../helpers';
import { fetchWithLogout } from '../helpers/fetch-with-logout';

export class FileUploadService {
	private static fileToBase64(file: File): Promise<string | null> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result ? reader.result.toString() : null);
			reader.onerror = (error) => reject(error);
		});
	}

	public static async uploadFile(
		file: File,
		assetType: Avo.FileUpload.AssetType,
		ownerId: string
	): Promise<string> {
		if (assetType === 'ZENDESK_ATTACHMENT') {
			return await FileUploadService.uploadFileToZendesk(file);
		}
		return await FileUploadService.uploadFileToBlobStorage(file, assetType, ownerId);
	}

	public static async uploadFileToZendesk(file: File): Promise<string> {
		let url: string | undefined;
		let body: Avo.FileUpload.ZendeskFileInfo | undefined;
		try {
			url = `${getEnv('PROXY_URL')}/zendesk/upload-attachment`;
			const base64 = await this.fileToBase64(file);
			if (!base64) {
				throw new CustomError("Failed to upload file: file doesn't have any content", null);
			}
			body = {
				base64,
				filename: file.name,
				mimeType: file.type,
			};

			const response = await fetchWithLogout(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(body),
			});

			const data: any = await response.json();
			if (data.statusCode && (data.statusCode < 200 || data.statusCode >= 400)) {
				throw new CustomError(
					'Failed to upload file: wrong statusCode received',
					null,
					data
				);
			}
			return data.url;
		} catch (err) {
			throw new CustomError('Failed to upload file', err, { file, url, body });
		}
	}

	public static async uploadFileToBlobStorage(
		file: File,
		assetType: Avo.FileUpload.AssetType,
		ownerId: string
	): Promise<string> {
		let url: string | undefined;
		try {
			url = `${getEnv('PROXY_URL')}/assets/upload`;

			const formData = new FormData();
			formData.append('ownerId', ownerId);
			formData.append('filename', file.name);
			formData.append('mimeType', file.type);
			formData.append('type', assetType as any);
			formData.append('content', file, file.name);

			const response = await fetchWithLogout(url, {
				method: 'POST',
				headers: {
					// 'content-type': 'multipart/form-data',
				},
				credentials: 'include',
				body: formData,
			});

			const data: Avo.FileUpload.AssetInfo | any = await response.json();
			if (data.statusCode < 200 || data.statusCode >= 400) {
				throw new CustomError(
					'Failed to upload file: wrong statusCode received',
					null,
					data
				);
			}
			return data.url;
		} catch (err) {
			throw new CustomError('Failed to upload file', err, { file, url });
		}
	}

	public static async deleteFile(fileUrl: string): Promise<void> {
		let url: string | undefined;
		let body: any;
		try {
			url = `${getEnv('PROXY_URL')}/assets/delete`;

			body = {
				url: fileUrl,
			};

			const response = await fetchWithLogout(url, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(body),
			});

			if (response.status < 200 || response.status >= 400) {
				throw new CustomError('Response status is not in the success range', null, {
					response,
				});
			}

			const reply = await response.json();
			if (!reply || reply.status !== 'deleted') {
				throw new CustomError(
					'Unexpected response from assets/delete endpoint. Expected {status: deleted}',
					null,
					{ reply, response }
				);
			}
			return;
		} catch (err) {
			throw new CustomError('Failed to upload file', err, { fileUrl, url, body });
		}
	}
}
