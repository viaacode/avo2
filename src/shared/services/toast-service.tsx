import { isNil } from 'lodash-es';
import React, { FunctionComponent, ReactNode } from 'react';
import { toast, ToastId, ToastOptions } from 'react-toastify';

import { Alert, AlertProps, Spacer } from '@viaa/avo2-components';

import { ROUTE_PARTS } from '../constants';

export enum ToastType {
	DANGER = 'danger',
	INFO = 'info',
	SPINNER = 'spinner',
	SUCCESS = 'success',
}

type ToastMessage = string | string[] | ReactNode;

interface ToastProps extends AlertProps {
	closeToast?: () => void;
}

const Toast: FunctionComponent<ToastProps> = ({ closeToast, ...rest }) => (
	<Alert {...rest} className="u-spacer-top" onClose={closeToast} />
);

export class ToastService {
	public static danger = (message: ToastMessage, options?: ToastOptions): ToastId | undefined =>
		ToastService.showToast(message, options, ToastType.DANGER);
	public static info = (message: ToastMessage, options?: ToastOptions): ToastId | undefined =>
		ToastService.showToast(message, options, ToastType.INFO);
	public static spinner = (message: ToastMessage, options?: ToastOptions): ToastId | undefined =>
		ToastService.showToast(message, options, ToastType.SPINNER);
	public static success = (message: ToastMessage, options?: ToastOptions): ToastId | undefined =>
		ToastService.showToast(message, options, ToastType.SUCCESS);

	public static close(toastId: ToastId | undefined) {
		if (isNil(toastId)) {
			return;
		}
		toast.dismiss(toastId);
	}

	private static showToast(
		message: ToastMessage,
		options: ToastOptions = {},
		alertType: ToastType = ToastType.INFO
	): ToastId | undefined {
		if (isNil(message)) {
			return;
		}

		let alertMessage = message;

		if (Array.isArray(message)) {
			const messages = message as string[];
			alertMessage = (
				<div>
					{messages.map((message: string, index: number) => {
						return index + 1 !== messages.length ? (
							<Spacer margin="bottom-small" key={`toast-message-${index}`}>
								{message}
							</Spacer>
						) : (
							message
						);
					})}
				</div>
			);
		}

		const dark = !window.location.href.includes(`/${ROUTE_PARTS.admin}/`);

		return toast(<Toast dark={dark} message={alertMessage} type={alertType} />, options);
	}
}
