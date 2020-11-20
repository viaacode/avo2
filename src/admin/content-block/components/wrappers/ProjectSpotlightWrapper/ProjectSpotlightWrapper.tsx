import { get } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { compose } from 'redux';

import { BlockSpotlight, ButtonAction, ImageInfo, RenderLinkFunction } from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../../../../authentication/components/SecuredRoute';
import { LoadingErrorLoadedComponent, LoadingInfo } from '../../../../../shared/components';
import { CustomError } from '../../../../../shared/helpers';
import withUser from '../../../../../shared/hocs/withUser';
import { ContentPageService } from '../../../../../shared/services/content-page-service';
import { ContentPageInfo } from '../../../../content/content.types';

interface ProjectSpotlightProps {
	project: ButtonAction;
	customImage: string;
	customTitle: string;
}

interface ProjectSpotlightWrapperProps {
	elements: ProjectSpotlightProps[];
	renderLink: RenderLinkFunction;
}

const ProjectSpotlightWrapper: FunctionComponent<
	ProjectSpotlightWrapperProps & DefaultSecureRouteProps
> = ({ elements, renderLink }) => {
	const [t] = useTranslation();

	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [projectContentPages, setProjectContentPages] = useState<
		(ContentPageInfo | null)[] | null
	>(null);

	const fetchContentPages = useCallback(async () => {
		try {
			const promises = elements.map((projectInfo) => {
				const projectPath = get(projectInfo, 'project.value');
				if (projectPath && projectPath.toString && projectPath.toString()) {
					return ContentPageService.getContentPageByPath(
						projectInfo.project.value.toString()
					);
				}
				return Promise.resolve(null);
			});
			setProjectContentPages(await Promise.all(promises));
		} catch (err) {
			console.error(new CustomError('Failed to get projects by path', err, { elements }));
			setLoadingInfo({
				state: 'error',
				message: t(
					'admin/content-block/components/wrappers/project-spotlight-wrapper/project-spotlight-wrapper___het-ophalen-van-de-projecten-in-de-kijker-is-mislukt'
				),
				actionButtons: [],
			});
		}
	}, [elements, setProjectContentPages, setLoadingInfo, t]);

	useEffect(() => {
		fetchContentPages();
	}, [fetchContentPages]);

	useEffect(() => {
		if (projectContentPages) {
			setLoadingInfo({ state: 'loaded' });
		}
	}, [projectContentPages]);

	const renderBlockProjectSpotlight = () => {
		if (!projectContentPages) {
			return null;
		}
		return (
			<BlockSpotlight
				elements={projectContentPages.map(
					(projectContentPage: ContentPageInfo | null, index: number): ImageInfo => {
						return {
							title:
								elements[index].customTitle ||
								get(projectContentPage, 'title') ||
								'',
							image:
								elements[index].customImage ||
								get(projectContentPage, 'thumbnail_path') ||
								'',
							buttonAction: elements[index].project,
						};
					}
				)}
				renderLink={renderLink}
			/>
		);
	};

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={projectContentPages}
			render={renderBlockProjectSpotlight}
			showSpinner={false}
		/>
	);
};

export default compose(withRouter, withUser)(ProjectSpotlightWrapper) as FunctionComponent<
	ProjectSpotlightWrapperProps
>;
