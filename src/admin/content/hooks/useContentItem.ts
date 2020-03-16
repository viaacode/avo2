import { History } from 'history';
import { Reducer, useEffect, useReducer, useState } from 'react';

import { Avo } from '@viaa/avo2-types';

import { ToastService } from '../../../shared/services';
import i18n from '../../../shared/translations/i18n';
import { ReactAction } from '../../../shared/types';

import { CONTENT_PATH, INITIAL_CONTENT_FORM } from '../content.const';
import { ContentService } from '../content.service';
import { ContentEditFormState, ContentWidth } from '../content.types';

type SetContentFormParams = Parameters<
	<K extends keyof ContentEditFormState>(key: K, value: ContentEditFormState[K]) => void
>;

type UseContentItemTuple = [ContentEditFormState, (...args: SetContentFormParams) => void, boolean];

interface ContentItemState {
	readonly contentForm: ContentEditFormState;
}

enum ContentItemActionType {
	SET_CONTENT_FORM = '@@admin-content-item/SET_CONTENT_FORM',
	UPDATE_CONTENT_FORM = '@@admin-content-item/UPDATE_CONTENT_FORM',
}

type ContentItemAction = ReactAction<ContentItemActionType>;

const INITIAL_CONTENT_ITEM_STATE = () => ({
	contentForm: INITIAL_CONTENT_FORM(),
});

const reducer = (state: ContentItemState, action: ContentItemAction) => {
	switch (action.type) {
		case ContentItemActionType.SET_CONTENT_FORM:
			return {
				...state,
				contentForm: action.payload,
			};
		case ContentItemActionType.UPDATE_CONTENT_FORM:
			return {
				...state,
				contentForm: {
					...state.contentForm,
					...action.payload,
				},
			};
		default:
			return state;
	}
};

export const useContentItem = (history: History, id?: string): UseContentItemTuple => {
	// Hooks
	const [{ contentForm }, dispatch] = useReducer<Reducer<ContentItemState, ContentItemAction>>(
		reducer,
		INITIAL_CONTENT_ITEM_STATE()
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		if (id) {
			setIsLoading(true);

			ContentService.getContentItemById(Number(id))
				.then((contentItem: Avo.Content.Content | null) => {
					if (contentItem) {
						dispatch({
							type: ContentItemActionType.SET_CONTENT_FORM,
							payload: {
								title: contentItem.title,
								description: contentItem.description || '',
								isProtected: contentItem.is_protected,
								path: contentItem.path,
								contentType: contentItem.content_type,
								contentWidth: contentItem.content_width || ContentWidth.REGULAR,
								publishAt: contentItem.publish_at || '',
								depublishAt: contentItem.depublish_at || '',
								userGroupIds: contentItem.user_group_ids,
							},
						});
					} else {
						ToastService.danger(
							i18n.t(
								'admin/content/hooks/use-content-item___er-ging-iets-mis-tijdens-het-ophalen-van-de-content-met-id-id',
								{ id }
							),
							false
						);
						history.push(CONTENT_PATH.CONTENT);
					}
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [id, history]);

	// Methods
	const setContentForm = (key: SetContentFormParams[0], value: SetContentFormParams[1]): void => {
		dispatch({
			type: ContentItemActionType.UPDATE_CONTENT_FORM,
			payload: { [key]: value },
		});
	};

	return [contentForm, setContentForm, isLoading];
};
