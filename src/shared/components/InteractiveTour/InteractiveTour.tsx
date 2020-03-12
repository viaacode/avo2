import { Location } from 'history';
import { debounce, reverse, toPairs } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { matchPath } from 'react-router';

import { Button } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { InteractiveTourStep } from '../../../admin/interactive-tour/interactive-tour.types';
import { APP_PATH, RouteInfo } from '../../../constants';
import { CustomError } from '../../helpers';
import { InteractiveTourService, TourInfo } from '../../services/interactive-tour-service';

import './InteractiveTour.scss';

export interface InteractiveTourProps {
	location: Location;
	user: Avo.User.User;
	showButton: boolean;
}

const InteractiveTour: FunctionComponent<InteractiveTourProps> = ({
	location,
	user,
	showButton,
}) => {
	const [t] = useTranslation();

	const [tour, setTour] = useState<TourInfo | null>(null);
	const [routeId, setRouteId] = useState<string | null>(null);

	const mapSteps = (dbSteps: InteractiveTourStep[]): InteractiveTourStep[] => {
		return dbSteps.map(
			(dbStep): InteractiveTourStep => {
				const mappedStep: Partial<InteractiveTourStep> = {};
				if (!dbStep.target) {
					mappedStep.placement = 'center';
					mappedStep.target = 'body';
				} else {
					mappedStep.target = dbStep.target;
				}
				mappedStep.disableBeacon = true;
				mappedStep.title = dbStep.title;
				mappedStep.content = (
					<div
						dangerouslySetInnerHTML={{
							__html: dbStep.content as string,
						}}
					/>
				);
				return mappedStep as InteractiveTourStep;
			}
		);
	};

	const checkIfTourExistsForCurrentPage = useCallback(async () => {
		try {
			if (!user.profile) {
				console.error(
					new CustomError(
						'Failed to get steps for interactive tour because user does not contain a profile',
						null,
						{ user }
					)
				);
				return;
			}
			// Resolve current page location to route id, so we know which interactive tour to show
			// We reverse the order of the routes, since more specific routes are always declared later in the list
			const interactiveRoutePairs = reverse(
				toPairs(APP_PATH).filter(pair => pair[1].showForInteractiveTour)
			);
			const matchingRoutePair: [string, RouteInfo] | undefined = interactiveRoutePairs.find(
				pair => {
					const route = pair[1].route;
					const currentRoute = location.pathname;
					const match = matchPath(currentRoute, route);
					return !!match;
				}
			);

			if (!matchingRoutePair) {
				return;
			}

			const routeId: string = matchingRoutePair[0];

			// Fetch interactive tours for current user and their seen status
			const tourTemp = await InteractiveTourService.fetchStepsForPage(
				routeId,
				user.profile.id
			);
			setTour(tourTemp);
			setRouteId(routeId);
		} catch (err) {
			console.error(
				new CustomError(
					'Failed to get the steps for the interactive tour from the database',
					err,
					{ user, pathName: location.pathname }
				)
			);
		}
	}, [setTour, location.pathname, user]);

	useEffect(() => {
		checkIfTourExistsForCurrentPage();
	}, [checkIfTourExistsForCurrentPage]);

	const markTourAsSeen = debounce(
		() => {
			if (!tour || !routeId) {
				return;
			}
			InteractiveTourService.setInteractiveTourSeen(
				routeId,
				(user.profile as Avo.User.Profile).id,
				(tour as TourInfo).id
			).catch(err => {
				console.error(
					new CustomError('Failed to store interactive tour seen status', err, {
						routeId,
						profileId: (user.profile as Avo.User.Profile).id,
						tourId: (tour as TourInfo).id,
					})
				);
			});
			setTour({
				...tour,
				seen: true,
			});
		},
		100,
		{ trailing: true }
	);

	const handleJoyrideCallback = (data: CallBackProps) => {
		if (!tour) {
			return;
		}
		const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
		if (finishedStatuses.includes(data.status)) {
			markTourAsSeen();
		}
	};

	// Render
	if (tour) {
		return (
			<>
				<Joyride
					steps={mapSteps(tour.steps)}
					callback={handleJoyrideCallback}
					locale={{
						back: t('shared/components/interactive-tour/interactive-tour___terug'),
						close: t('shared/components/interactive-tour/interactive-tour___sluit'),
						last: t('shared/components/interactive-tour/interactive-tour___einde'),
						next: t('shared/components/interactive-tour/interactive-tour___volgende'),
						skip: t('shared/components/interactive-tour/interactive-tour___overslaan'),
					}}
					spotlightPadding={8}
					scrollOffset={200}
					continuous
					run={!tour.seen}
					showSkipButton
					styles={{
						options: {
							primaryColor: '#25A4CF',
						},
					}}
				/>
				{showButton && (
					<Button
						type="primary"
						label={t(
							'shared/components/interactive-tour/interactive-tour___rondleiding'
						)}
						icon="info"
						onClick={() => {
							setTour({ ...tour, seen: false });
						}}
					/>
				)}
			</>
		);
	}
	return null;
};

export default InteractiveTour;
