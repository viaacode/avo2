import { get } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import Zendesk from 'react-zendesk';

import { getEnv } from '../../helpers';

declare const ResizeObserver: any;

const ZendeskWrapper: FunctionComponent = () => {
	/**
	 * Change the bottom margin of the zendesk widget so it doesn't overlap with the footer
	 */
	const onLoaded = () => {
		let widget: HTMLIFrameElement | null;
		let footerHeight = 100;
		const zendeskMarginBottom = 10;
		const updateFooterHeight = () => {
			footerHeight = get(document.querySelector('.c-global-footer'), 'clientHeight', 100);
		};
		const updateMargin = () => {
			if (widget) {
				const scrollHeight = document.documentElement.scrollHeight;
				const screenHeight = document.documentElement.clientHeight;
				const scrollTop = document.documentElement.scrollTop;
				if (scrollHeight - screenHeight - scrollTop < footerHeight + zendeskMarginBottom) {
					widget.style.marginBottom = `${
						footerHeight +
						zendeskMarginBottom -
						(scrollHeight - screenHeight - scrollTop)
					}px`;
				} else {
					widget.style.marginBottom = '10px';
				}
			}
		};
		document.addEventListener('scroll', updateMargin);
		document.addEventListener('resize', () => {
			updateFooterHeight();
			updateMargin();
		});

		// Safari < 13.1
		if (!ResizeObserver) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			updateFooterHeight();
			updateMargin();
		});

		resizeObserver.observe(document.body);

		const getZendeskWidget = () => {
			widget = document.querySelector('iframe#launcher');
			if (!widget) {
				setTimeout(getZendeskWidget, 100);
			} else {
				updateFooterHeight();
				updateMargin();
			}
		};
		getZendeskWidget();
	};

	return <Zendesk zendeskKey={getEnv('ZENDESK_KEY') as string} onLoaded={onLoaded} />;
};

export default ZendeskWrapper;
