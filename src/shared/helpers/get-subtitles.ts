import { get } from 'lodash-es';

import { FlowplayerTrack } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import i18n from '../translations/i18n';

import { getEnv } from './env';

export function getSubtitles(
	item: Avo.Item.Item | undefined | null
): FlowplayerTrack[] | undefined {
	const collaterals = get(item, 'item_collaterals') || [];
	if (!collaterals.length) {
		return undefined;
	}
	return collaterals.map(
		(collateral: Avo.Item.Subtitle, index: number): FlowplayerTrack => {
			return {
				id: collateral.external_id,
				default: index === 0,
				src: `${getEnv('PROXY_URL')}/subtitles/convert-srt-to-vtt${collateral.path}`,
				label: i18n.t('shared/helpers/get-subtitles___nederlands') + (index + 1),
			};
		}
	);
}
