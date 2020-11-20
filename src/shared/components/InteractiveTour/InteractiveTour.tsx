import { compact, debounce, get, reverse, toPairs } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Joyride, { CallBackProps } from 'react-joyride';
import { matchPath, withRouter } from 'react-router';
import { compose } from 'redux';

import { Button } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { Color } from '../../../admin/shared/types';
import { SecuredRouteProps } from '../../../authentication/components/SecuredRoute';
import { APP_PATH, RouteId, RouteInfo } from '../../../constants';
import { CustomError } from '../../helpers';
import withUser from '../../hocs/withUser';
import { InteractiveTourService, TourInfo } from '../../services/interactive-tour-service';
import Html from '../Html/Html';

import './InteractiveTour.scss';

export const TOUR_DISPLAY_DATES_LOCAL_STORAGE_KEY = 'AVO.tour_display_dates';

export interface InteractiveTourProps {
	showButton: boolean;
}

const InteractiveTour: FunctionComponent<InteractiveTourProps & SecuredRouteProps> = ({
	showButton,
	user,
	location,
}) => {
	const [t] = useTranslation();

	const [tour, setTour] = useState<TourInfo | null>(null);
	const [routeId, setRouteId] = useState<RouteId | null>(null);
	const [tourDisplayDates, setTourDisplayDates] = useState<{ [tourId: string]: string } | null>(
		null
	);

	const getTourDisplayDates = useCallback(() => {
		try {
			setTourDisplayDates(
				JSON.parse(
					(localStorage && localStorage.getItem(TOUR_DISPLAY_DATES_LOCAL_STORAGE_KEY)) ||
						'{}'
				)
			);
		} catch (err) {
			console.error(
				new CustomError(
					'Failed to parse tour dates in local storage. Overriding with {}',
					err,
					{
						key: TOUR_DISPLAY_DATES_LOCAL_STORAGE_KEY,
						value:
							localStorage &&
							localStorage.getItem(TOUR_DISPLAY_DATES_LOCAL_STORAGE_KEY),
					}
				)
			);
			if (localStorage) {
				localStorage.setItem(TOUR_DISPLAY_DATES_LOCAL_STORAGE_KEY, '{}');
			}
		}
	}, [setTourDisplayDates]);

	const updateTourDisplayDate = useCallback(
		(tourId: string) => {
			const newTourDisplayDates = { ...tourDisplayDates, [tourId]: new Date().toISOString() };
			if (localStorage) {
				localStorage.setItem(
					TOUR_DISPLAY_DATES_LOCAL_STORAGE_KEY,
					JSON.stringify(newTourDisplayDates)
				);
			}
		},
		[tourDisplayDates]
	);

	useEffect(() => {
		getTourDisplayDates();
	}, [getTourDisplayDates]);

	const mapSteps = (dbSteps: Avo.InteractiveTour.Step[]): Avo.InteractiveTour.Step[] => {
		return compact(
			dbSteps.map((dbStep): Avo.InteractiveTour.Step | null => {
				const mappedStep: Partial<Avo.InteractiveTour.Step> = {};
				if (!dbStep.target) {
					mappedStep.placement = 'center';
					mappedStep.target = 'body';
				} else {
					mappedStep.target = dbStep.target;
				}
				mappedStep.disableBeacon = true;
				mappedStep.title = dbStep.title;
				mappedStep.content = <Html content={dbStep.content as string} type="div" />;

				// Remove steps for which the target isn't found
				if (!document.querySelector(mappedStep.target)) {
					return null;
				}

				return mappedStep as Avo.InteractiveTour.Step;
			})
		);
	};

	const checkIfTourExistsForCurrentPage = useCallback(async () => {
		try {
			if (!tourDisplayDates) {
				return;
			}
			// Resolve current page location to route id, so we know which interactive tour to show
			// We reverse the order of the routes, since more specific routes are always declared later in the list
			const interactiveRoutePairs = reverse(
				toPairs(APP_PATH).filter((pair) => pair[1].showForInteractiveTour)
			);
			const matchingRoutePair: [string, RouteInfo] | undefined = interactiveRoutePairs.find(
				(pair) => {
					const route = pair[1].route;
					const currentRoute = location.pathname;
					const match = matchPath(currentRoute, route);
					return !!match;
				}
			);

			let routeId: RouteId | undefined;
			if (matchingRoutePair) {
				// static page
				routeId = matchingRoutePair[0] as RouteId;
			} else {
				// check content pages
				routeId = location.pathname as RouteId;
			}

			// Get all routes that have an interactive tour
			const routeIdsWithTour: string[] = await InteractiveTourService.fetchInteractiveTourRouteIds();
			if (!routeIdsWithTour.includes(routeId)) {
				// No tour available for this page
				return;
			}

			// Fetch interactive tours for current user and their seen status
			const tourTemp = await InteractiveTourService.fetchStepsForPage(
				routeId,
				get(user, 'profile.id'),
				tourDisplayDates
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
	}, [setTour, location.pathname, tourDisplayDates, user]);

	useEffect(() => {
		checkIfTourExistsForCurrentPage();
	}, [checkIfTourExistsForCurrentPage]);

	const markTourAsSeen = debounce(
		async () => {
			try {
				if (!tour || !routeId) {
					return;
				}
				const profileId = get(user, 'profile.id');
				await InteractiveTourService.setInteractiveTourSeen(
					routeId,
					profileId,
					(tour as TourInfo).id
				);
				setTour({
					...tour,
					seen: true,
				});
			} catch (err) {
				console.error(
					new CustomError('Failed to store interactive tour seen status', err, {
						routeId,
						user,
						tourId: (tour as TourInfo).id,
					})
				);
			}
		},
		100,
		{ trailing: true }
	);

	const handleJoyrideCallback = (data: CallBackProps) => {
		if (!tour) {
			return;
		}
		if (data.action === 'close' || data.action === 'skip' || data.status === 'finished') {
			setTour({
				...tour,
				seen: true,
			});
			if (data.action === 'close' || data.status === 'finished') {
				markTourAsSeen();
			} else {
				// skip
				if ((tourDisplayDates || {})[tour.id]) {
					// if date was set already => hide the tour forever
					markTourAsSeen();
				} else {
					// if date was not set => keep track of date in localstorage
					updateTourDisplayDate(String(tour.id));
				}
			}
		}
	};

	// Render
	if (tour) {
		return (
			<div className="c-interactive-tour">
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
					scrollOffset={220}
					continuous
					run={!tour.seen}
					showSkipButton
					floaterProps={{ disableAnimation: true }}
					styles={{
						options: {
							primaryColor: Color.TealBright,
						},
					}}
				/>
				{showButton && (
					<Button
						type="primary"
						label={t(
							'shared/components/interactive-tour/interactive-tour___rondleiding'
						)}
						title={t(
							'shared/components/interactive-tour/interactive-tour___start-een-rondleiding-om-wegwijs-te-geraken-op-deze-pagina'
						)}
						icon="info"
						onClick={() => {
							setTour({ ...tour, seen: false });
						}}
						className="c-interactive-tour__button"
					/>
				)}
			</div>
		);
	}
	return null;
};

export default compose(withRouter, withUser)(InteractiveTour) as FunctionComponent<
	InteractiveTourProps
>;
