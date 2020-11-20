import { Avo } from '@viaa/avo2-types';

import { parseContentBlocks } from '../../content-block/helpers';
import { ContentPageInfo, ContentWidth } from '../content.types';

export function convertToContentPageInfo(dbContentPage: Avo.ContentPage.Page): ContentPageInfo {
	const labels = (dbContentPage.content_content_labels || []).map(
		(labelLink: Avo.ContentPage.LabelLink) => labelLink.content_label
	);
	const contentBlockConfigs = dbContentPage.contentBlockssBycontentId
		? parseContentBlocks(dbContentPage.contentBlockssBycontentId)
		: [];

	return {
		labels,
		contentBlockConfigs,
		id: dbContentPage.id,
		thumbnail_path: dbContentPage.thumbnail_path,
		title: dbContentPage.title,
		description_html: dbContentPage.description || '',
		description_state: undefined,
		seo_description: dbContentPage.seo_description || '',
		meta_description: dbContentPage.meta_description || '',
		is_protected: dbContentPage.is_protected,
		is_public: dbContentPage.is_public,
		path: dbContentPage.path,
		content_type: dbContentPage.content_type as Avo.ContentPage.Type,
		content_width: dbContentPage.content_width || ContentWidth.REGULAR,
		publish_at: dbContentPage.publish_at || null,
		depublish_at: dbContentPage.depublish_at || null,
		published_at: dbContentPage.published_at || null,
		created_at: dbContentPage.created_at,
		updated_at: dbContentPage.updated_at || dbContentPage.created_at || null,
		user_group_ids: dbContentPage.user_group_ids,
		profile: dbContentPage.profile,
		user_profile_id: dbContentPage.user_profile_id,
	};
}

export function convertToContentPageInfos(
	dbContentPages: Avo.ContentPage.Page[]
): ContentPageInfo[] {
	return (dbContentPages || []).map(convertToContentPageInfo);
}

export function convertToDatabaseContentPage(
	contentPageInfo: Partial<ContentPageInfo>
): Avo.ContentPage.Page {
	return {
		id: contentPageInfo.id,
		thumbnail_path: contentPageInfo.thumbnail_path,
		title: contentPageInfo.title,
		description:
			(contentPageInfo.description_state
				? contentPageInfo.description_state.toHTML()
				: contentPageInfo.description_html) || null,
		seo_description: contentPageInfo.seo_description || null,
		meta_description: contentPageInfo.meta_description || null,
		is_protected: contentPageInfo.is_protected,
		is_public: contentPageInfo.is_public,
		path: contentPageInfo.path,
		content_type: contentPageInfo.content_type,
		content_width: contentPageInfo.content_width,
		publish_at: contentPageInfo.publish_at || null,
		depublish_at: contentPageInfo.depublish_at || null,
		published_at: contentPageInfo.published_at || null,
		created_at: contentPageInfo.created_at || null,
		updated_at: contentPageInfo.updated_at || null,
		user_group_ids: contentPageInfo.user_group_ids,
		profile: contentPageInfo.profile,
		user_profile_id: contentPageInfo.user_profile_id,
	} as Avo.ContentPage.Page;
}
