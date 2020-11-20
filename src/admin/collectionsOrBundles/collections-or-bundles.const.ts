import { ButtonType, SelectOption } from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { ROUTE_PARTS } from '../../shared/constants';
import i18n from '../../shared/translations/i18n';

import { CollectionsOrBundlesOverviewTableCols } from './collections-or-bundles.types';

export const COLLECTIONS_OR_BUNDLES_PATH = {
	COLLECTIONS_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.collections}`,
	BUNDLES_OVERVIEW: `/${ROUTE_PARTS.admin}/${ROUTE_PARTS.bundles}`,
};

export const ITEMS_PER_PAGE = 10;

export const TABLE_COLUMN_TO_DATABASE_ORDER_OBJECT: Partial<
	{
		[columnId in CollectionsOrBundlesOverviewTableCols]: (
			order: Avo.Search.OrderDirection
		) => any;
	}
> = {
	owner_profile_id: (order: Avo.Search.OrderDirection) => ({
		profile: { usersByuserId: { last_name: order } },
	}),
	author_user_group: (order: Avo.Search.OrderDirection) => ({
		profile: { profile_user_group: { group: { label: order } } },
	}),
	last_updated_by_profile: (order: Avo.Search.OrderDirection) => ({
		updated_by: { usersByuserId: { last_name: order } },
	}),
	views: (order: Avo.Search.OrderDirection) => ({
		view_counts_aggregate: {
			sum: {
				count: order,
			},
		},
	}),
	bookmarks: (order: Avo.Search.OrderDirection) => ({
		counts: {
			bookmarks: order,
		},
	}),
	copies: (order: Avo.Search.OrderDirection) => ({
		counts: {
			copies: order,
		},
	}),
	in_bundle: (order: Avo.Search.OrderDirection) => ({
		counts: {
			in_collection: order,
		},
	}),
	in_assignment: (order: Avo.Search.OrderDirection) => ({
		counts: {
			in_assignment: order,
		},
	}),
};

type CollectionBulkActionOption = SelectOption<string> & {
	confirm?: boolean;
	confirmButtonType?: ButtonType;
};
export const GET_COLLECTION_BULK_ACTIONS = (): CollectionBulkActionOption[] => {
	return [
		{
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___publiceren'
			),
			value: 'publish',
			confirm: true,
			confirmButtonType: 'primary',
		},
		{
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___depubliceren'
			),
			value: 'depublish',
			confirm: true,
			confirmButtonType: 'danger',
		},
		{
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___verwijderen'
			),
			value: 'delete',
			confirm: true,
			confirmButtonType: 'danger',
		},
		{
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___auteur-aanpassen'
			),
			value: 'change_author',
		},
		{
			label: i18n.t(
				'admin/collections-or-bundles/views/collections-or-bundles-overview___labels-aanpassen'
			),
			value: 'change_labels',
		},
	];
};
