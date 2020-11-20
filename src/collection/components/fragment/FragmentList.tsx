import { sortBy } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, Spacer } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../../authentication/components/SecuredRoute';
import { showReplacementWarning } from '../../helpers/fragment';

import FragmentDetail from './FragmentDetail';

interface FragmentListDetailProps extends DefaultSecureRouteProps {
	collectionFragments: Avo.Collection.Fragment[];
	showDescription: boolean;
	linkToItems: boolean;
	collection: Avo.Collection.Collection;
	user: Avo.User.User;
	canPlay?: boolean;
}

/**
 * Renders the collection body with all of its fragments for the detail page
 * The bottom meta data is not included in the component
 * @param collectionFragments
 * @param showDescriptionNextToVideo
 * @constructor
 */
const FragmentList: FunctionComponent<FragmentListDetailProps> = ({
	collectionFragments,
	showDescription,
	linkToItems,
	collection,
	user,
	...rest
}) => {
	const [t] = useTranslation();
	const renderCollectionFragments = () =>
		sortBy(collectionFragments, 'position').map(
			(collectionFragment: Avo.Collection.Fragment) => {
				return (
					<li
						className="c-collection-list__item"
						key={`collection-fragment-${collectionFragment.id}`}
					>
						{showReplacementWarning(collection, collectionFragment, user) && (
							<Spacer margin="bottom-large">
								<Alert type="danger">
									{t(
										'collection/components/fragment/fragment-list___dit-item-is-recent-vervangen-door-een-nieuwe-versie-je-controleert-best-of-je-knippunten-nog-correct-zijn'
									)}
								</Alert>
							</Spacer>
						)}
						<FragmentDetail
							collectionFragment={collectionFragment}
							showDescription={showDescription}
							linkToItems={linkToItems}
							user={user}
							{...rest}
						/>
					</li>
				);
			}
		);

	return <ul className="c-collection-list">{renderCollectionFragments()}</ul>;
};

export default FragmentList;
