import { Avo } from '@viaa/avo2-types';

import { CustomError, getEnv } from '../helpers';

export interface ZendeskFileInfo {
	// TODO use typings version in v2.14.0
	base64: string;
	filename: string;
	mimeType: string;
}

function fileToBase64(file: File): Promise<string | null> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result ? reader.result.toString() : null);
		reader.onerror = error => reject(error);
	});
}

export const uploadFile = async (
	file: File,
	assetType: Avo.FileUpload.AssetType,
	ownerId: string
): Promise<string> => {
	if (assetType === 'ZENDESK_ATTACHMENT') {
		return await uploadFileToZendesk(file);
	}
	return await uploadFileToBlobStorage(file, assetType, ownerId);
};

export const uploadFileToZendesk = async (file: File): Promise<string> => {
	let url: string | undefined;
	let body: ZendeskFileInfo | undefined;
	try {
		url = `${getEnv('PROXY_URL')}/zendesk/upload-attachment`;
		const base64 = await fileToBase64(file);
		if (!base64) {
			throw new CustomError("Failed to upload file: file doesn't have any content", null);
		}
		body = {
			base64,
			filename: file.name,
			mimeType: file.type,
		};

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(body),
		});

		const data: any = await response.json();
		if (data.statusCode && (data.statusCode < 200 || data.statusCode >= 400)) {
			throw new CustomError('Failed to upload file: wrong statusCode received', null, data);
		}
		return data.url;
	} catch (err) {
		throw new CustomError('Failed to upload file', err, { file, url, body });
	}
};

export const uploadFileToBlobStorage = async (
	file: File,
	assetType: Avo.FileUpload.AssetType,
	ownerId: string
): Promise<string> => {
	let url: string | undefined;
	let body: Avo.FileUpload.UploadAssetInfo | undefined;
	try {
		url = `${getEnv('PROXY_URL')}/assets/upload`;
		const content = await fileToBase64(file);
		if (!content) {
			throw new CustomError("Failed to upload file: file doesn't have any content", null);
		}
		body = {
			content,
			ownerId,
			filename: file.name,
			mimeType: file.type,
			type: assetType,
		};

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(body),
		});

		const data: Avo.FileUpload.AssetInfo | any = await response.json();
		if (data.statusCode < 200 || data.statusCode >= 400) {
			throw new CustomError('Failed to upload file: wrong statusCode received', null, data);
		}
		return data.url;
	} catch (err) {
		throw new CustomError('Failed to upload file', err, { file, url, body });
	}
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
	let url: string | undefined;
	let body: any;
	try {
		url = `${getEnv('PROXY_URL')}/assets/delete`;

		body = {
			url: fileUrl,
		};

		const response = await fetch(url, {
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
};
