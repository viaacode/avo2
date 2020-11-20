import { compact, isNil, uniq, without } from 'lodash-es';

import { Avo } from '@viaa/avo2-types';

import { ContentTypeString } from '../../collection/collection.types';
import { DEFAULT_AUDIO_STILL } from '../constants';
import { CustomError, getEnv, toSeconds } from '../helpers';
import { fetchWithLogout } from '../helpers/fetch-with-logout';

export class VideoStillService {
	/**
	 * Get the first video still after the provided start times for all provided videos
	 * @param stillRequests: list of info objects containing the video id and their desired start time in seconds
	 */
	public static async getVideoStills(
		stillRequests: Avo.Stills.StillRequest[]
	): Promise<Avo.Stills.StillInfo[]> {
		try {
			if (!stillRequests || !stillRequests.length) {
				return [];
			}
			const response = await fetchWithLogout(`${getEnv('PROXY_URL')}/video-stills`, {
				method: 'POST',
				body: JSON.stringify(stillRequests),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			return await response.json();
		} catch (err) {
			throw new CustomError('Failed to get video stills', err, { stillRequests });
		}
	}

	/**
	 * Get video still for video with external id after start time
	 * @param externalId id of the video
	 * @param startTime video frame closest to this timestamp in milliseconds
	 * @return url to frame from video
	 */
	public static async getVideoStill(externalId: string, startTime: number): Promise<string> {
		const stills = await VideoStillService.getVideoStills([{ externalId, startTime }]);
		return stills[0].previewImagePath;
	}

	public static async getThumbnailsForCollection(
		collection: Partial<Avo.Collection.Collection>
	): Promise<string[]> {
		// Only request the thumbnail of one audio fragment since those thumbnails are all identical
		const mediaFragments = (collection.collection_fragments || []).filter(
			(fragment) => fragment.type === 'ITEM'
		);
		const videoFragments = mediaFragments.filter(
			(fragment) =>
				fragment.item_meta &&
				(fragment.item_meta as Avo.Item.Item).type.label === ContentTypeString.video
		);
		const audioFragments = mediaFragments.filter(
			(fragment) =>
				fragment.item_meta &&
				(fragment.item_meta as Avo.Item.Item).type.label === ContentTypeString.audio
		);
		const cutVideoFragments = videoFragments.filter(
			(fragment) =>
				(fragment.start_oc !== 0 && !isNil(fragment.start_oc)) ||
				(fragment.item_meta &&
					!isNil(fragment.end_oc) &&
					fragment.end_oc !== toSeconds((fragment.item_meta as Avo.Item.Item).duration))
		);
		const uncutVideoFragments = without(videoFragments, ...cutVideoFragments);
		const cutVideoStillRequests: Avo.Stills.StillRequest[] = compact(
			cutVideoFragments.map((fragment) => ({
				externalId: fragment.external_id,
				startTime: (fragment.start_oc || 0) * 1000,
			}))
		);
		const cutVideoStills = await VideoStillService.getVideoStills(cutVideoStillRequests);

		return uniq(
			compact([
				// current thumbnail image
				...(collection.thumbnail_path ? [collection.thumbnail_path] : []),
				// Cut video thumbnails
				...cutVideoStills.map((videoStill) => videoStill.previewImagePath),
				// Uncut video thumbnails
				...uncutVideoFragments.map(
					(fragment) => fragment.item_meta && fragment.item_meta.thumbnail_path
				),
				// One audio thumbnail
				...(audioFragments[0] && audioFragments[0].item_meta ? [DEFAULT_AUDIO_STILL] : []),
			])
		);
	}

	public static async getThumbnailForCollection(
		collection: Partial<Avo.Collection.Collection>
	): Promise<string | null> {
		return (await VideoStillService.getThumbnailsForCollection(collection))[0] || null;
	}
}
