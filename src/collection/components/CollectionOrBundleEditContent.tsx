import { get, isNil } from 'lodash-es';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Container } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { PermissionName, PermissionService } from '../../authentication/helpers/permission-service';
import { ToastService } from '../../shared/services';
import { FragmentAdd, FragmentEdit } from '../components';

import { CollectionAction } from './CollectionOrBundleEdit';
import './CollectionOrBundleEditContent.scss';

interface CollectionOrBundleEditContentProps extends DefaultSecureRouteProps {
	type: 'collection' | 'bundle';
	collectionId: string;
	collectionFragments: Avo.Collection.Fragment[];
	changeCollectionState: (action: CollectionAction) => void;
}

const CollectionOrBundleEditContent: FunctionComponent<CollectionOrBundleEditContentProps> = ({
	type,
	collectionId,
	collectionFragments,
	changeCollectionState,
	user,
}) => {
	const [t] = useTranslation();

	// State
	const [openOptionsId, setOpenOptionsId] = useState<number | null>(null);
	const [allowedToAddLinks, setAllowedToAddLinks] = useState<boolean | null>(null);

	const isCollection = type === 'collection';

	useEffect(() => {
		PermissionService.hasPermission(PermissionName.ADD_HYPERLINK_COLLECTIONS, null, user)
			.then((hasPermission) => {
				setAllowedToAddLinks(hasPermission);
			})
			.catch((err) => {
				console.error(
					'Failed to check permissions for adding hyperlinks in collection fragment editors',
					err,
					{ user, permission: PermissionName.ADD_HYPERLINK_COLLECTIONS }
				);
				ToastService.danger(
					t(
						'collection/components/fragment/fragment-edit___het-controleren-van-je-account-rechten-is-mislukt'
					)
				);
			});
	}, [user, t]);

	const getFragmentKey = (fragment: Avo.Collection.Fragment) => {
		return `fragment_${fragment.id}-${get(fragment, 'created_at')}-${get(
			fragment,
			'position'
		)}`;
	};

	if (isNil(allowedToAddLinks)) {
		return null;
	}
	return (
		<Container mode="vertical" className="m-collection-or-bundle-edit-content">
			<Container mode="horizontal" key={collectionFragments.map(getFragmentKey).join('_')}>
				{collectionFragments.map((fragment: Avo.Collection.Fragment, index: number) => (
					<FragmentEdit
						// If the parent is a collection then the fragment is an ITEM or TEXT
						// If the parent is a bundle then the fragment is a COLLECTION
						type={isCollection ? 'itemOrText' : 'collection'}
						key={getFragmentKey(fragment)}
						index={index}
						collectionId={collectionId}
						numberOfFragments={collectionFragments.length}
						changeCollectionState={changeCollectionState}
						openOptionsId={openOptionsId}
						setOpenOptionsId={setOpenOptionsId}
						fragment={fragment}
						allowedToAddLinks={allowedToAddLinks as boolean}
					/>
				))}
			</Container>
			{!collectionFragments.length && isCollection && (
				<FragmentAdd
					index={0}
					collectionId={collectionId}
					numberOfFragments={collectionFragments.length}
					changeCollectionState={changeCollectionState}
				/>
			)}
		</Container>
	);
};

export default React.memo(CollectionOrBundleEditContent);
