import { orderBy } from 'lodash-es';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
	Button,
	MetaData,
	MetaDataItem,
	Pagination,
	Spacer,
	Table,
	TableColumn,
	Thumbnail,
} from '@viaa/avo2-components';

import { DefaultSecureRouteProps } from '../../authentication/components/SecuredRoute';
import { APP_PATH } from '../../constants';
import { ErrorView } from '../../error/views';
import {
	DeleteObjectModal,
	LoadingErrorLoadedComponent,
	LoadingInfo,
} from '../../shared/components';
import {
	buildLink,
	CustomError,
	formatDate,
	formatTimestamp,
	fromNow,
	isMobileWidth,
} from '../../shared/helpers';
import { truncateTableValue } from '../../shared/helpers/truncate';
import { BookmarksViewsPlaysService, ToastService } from '../../shared/services';
import { CONTENT_TYPE_TO_EVENT_CONTENT_TYPE } from '../../shared/services/bookmarks-views-plays-service';
import {
	BookmarkInfo,
	EventContentType,
} from '../../shared/services/bookmarks-views-plays-service/bookmarks-views-plays-service.types';

const ITEMS_PER_PAGE = 5;

interface BookmarksOverviewProps extends DefaultSecureRouteProps {
	numberOfItems: number;
	onUpdate: () => void | Promise<void>;
}

const BookmarksOverview: FunctionComponent<BookmarksOverviewProps> = ({
	numberOfItems,
	onUpdate = () => {},
	history,
	user,
}) => {
	const [t] = useTranslation();

	// State
	const [bookmarks, setBookmarks] = useState<BookmarkInfo[] | null>(null);
	const [bookmarkToDelete, setBookmarkToDelete] = useState<BookmarkInfo | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [sortColumn, setSortColumn] = useState<keyof BookmarkInfo>('createdAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [page, setPage] = useState<number>(0);
	const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ state: 'loading' });
	const [paginatedBookmarks, setPaginatedBookmarks] = useState<BookmarkInfo[]>([]);

	const BOOKMARK_COLUMNS: TableColumn[] = [
		{ id: 'contentThumbnailPath', label: '', col: '2' },
		{
			id: 'contentTitle',
			label: t('collection/views/collection-overview___titel'),
			col: '6',
			sortable: true,
			visibleByDefault: true,
		},
		...(isMobileWidth()
			? []
			: [
					{
						id: 'createdAt',
						label: t('workspace/views/bookmarks___aangemaakt-op'),
						col: '3',
						sortable: true,
						visibleByDefault: true,
					},
			  ]),
		{ id: 'actions', tooltip: t('workspace/views/bookmarks-overview___acties'), col: '1' },
	] as TableColumn[];

	const fetchBookmarks = useCallback(async () => {
		try {
			const bookmarkInfos = await BookmarksViewsPlaysService.getAllBookmarksForUser(user);
			setBookmarks(bookmarkInfos);
			setLoadingInfo({ state: 'loaded' });
		} catch (err) {
			console.error(new CustomError('Failed to get all bookmarks for user', err, { user }));
			setLoadingInfo({
				state: 'error',
				message: t('workspace/views/bookmarks___het-ophalen-van-je-bladwijzers-is-mislukt'),
			});
		}
	}, [user, setBookmarks, setLoadingInfo, t]);

	useEffect(() => {
		fetchBookmarks();
	}, [fetchBookmarks]);

	const updatePaginatedBookmarks = useCallback(() => {
		setPaginatedBookmarks(
			orderBy(bookmarks, [sortColumn], [sortOrder]).slice(
				ITEMS_PER_PAGE * page,
				ITEMS_PER_PAGE * (page + 1)
			)
		);
	}, [setPaginatedBookmarks, sortColumn, sortOrder, page, bookmarks]);

	useEffect(updatePaginatedBookmarks, [updatePaginatedBookmarks]);

	const onDeleteBookmark = async () => {
		try {
			if (!bookmarkToDelete) {
				ToastService.danger(
					t('workspace/views/bookmarks___het-verwijderen-van-de-bladwijzer-is-mislukt')
				);
				return;
			}
			await BookmarksViewsPlaysService.toggleBookmark(
				bookmarkToDelete.contentId,
				user,
				CONTENT_TYPE_TO_EVENT_CONTENT_TYPE[bookmarkToDelete.contentType],
				true
			);

			await fetchBookmarks();
			onUpdate();
			ToastService.success(t('workspace/views/bookmarks___de-bladwijzer-is-verwijderd'));
		} catch (err) {
			console.error(
				new CustomError('Failed t delete bookmark', err, { bookmarkToDelete, user })
			);
			ToastService.danger(
				t('workspace/views/bookmarks___het-verwijderen-van-de-bladwijzer-is-mislukt')
			);
		}

		setBookmarkToDelete(null);
	};

	// TODO: Make shared function because also used in assignments
	const onClickColumn = (columnId: keyof BookmarkInfo) => {
		if (sortColumn === columnId) {
			// Change column sort order
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			// Initial column sort order
			setSortColumn(columnId);
			setSortOrder('asc');
		}
		setPage(0);
	};

	// Render functions
	const getDetailLink = (contentType: EventContentType, contentLinkId: string) =>
		buildLink(
			{
				item: APP_PATH.ITEM_DETAIL.route,
				collection: APP_PATH.COLLECTION_DETAIL.route,
				bundle: APP_PATH.BUNDLE_DETAIL.route,
			}[contentType],
			{
				id: contentLinkId,
			}
		);

	const renderThumbnail = ({
		contentLinkId,
		contentType,
		contentTitle,
		contentThumbnailPath,
	}: BookmarkInfo) => (
		<Link
			to={getDetailLink(CONTENT_TYPE_TO_EVENT_CONTENT_TYPE[contentType], contentLinkId)}
			title={contentTitle}
		>
			<Thumbnail
				alt="thumbnail"
				category={contentType}
				className="m-collection-overview-thumbnail"
				src={contentThumbnailPath || undefined}
				showCategoryIcon
			/>
		</Link>
	);

	const renderTitle = ({
		contentLinkId,
		contentType,
		contentTitle,
		contentCreatedAt,
		contentViews,
	}: BookmarkInfo) => (
		<div className="c-content-header">
			<h3 className="c-content-header__header">
				<Link
					to={getDetailLink(
						CONTENT_TYPE_TO_EVENT_CONTENT_TYPE[contentType],
						contentLinkId
					)}
					title={contentTitle}
				>
					{truncateTableValue(contentTitle)}
				</Link>
			</h3>
			<div className="c-content-header__meta u-text-muted">
				<MetaData category={contentType}>
					<MetaDataItem>
						{contentCreatedAt && (
							<span title={`Aangemaakt: ${formatDate(contentCreatedAt)}`}>
								{formatDate(contentCreatedAt)}
							</span>
						)}
					</MetaDataItem>
					<MetaDataItem icon="eye" label={String(contentViews || 0)} />
				</MetaData>
			</div>
		</div>
	);

	const renderDeleteAction = (bookmarkInfo: BookmarkInfo) => (
		<Button
			title={t('workspace/views/bookmarks___verwijder-uit-bladwijzers')}
			ariaLabel={t('workspace/views/bookmarks___verwijder-uit-bladwijzers')}
			icon="delete"
			type="danger-hover"
			onClick={() => {
				setBookmarkToDelete(bookmarkInfo);
				setIsDeleteModalOpen(true);
			}}
		/>
	);

	const renderCell = (bookmarkInfo: BookmarkInfo, colKey: string) => {
		switch (colKey as keyof BookmarkInfo | 'actions') {
			case 'contentThumbnailPath':
				return renderThumbnail(bookmarkInfo);

			case 'contentTitle':
				return renderTitle(bookmarkInfo);

			case 'createdAt':
				const cellData = bookmarkInfo.createdAt;
				return <span title={formatTimestamp(cellData)}>{fromNow(cellData)}</span>;

			case 'actions':
				return renderDeleteAction(bookmarkInfo);

			default:
				return null;
		}
	};

	const renderTable = () => (
		<>
			<Table
				columns={BOOKMARK_COLUMNS}
				data={paginatedBookmarks}
				emptyStateMessage={t(
					'collection/views/collection-overview___geen-resultaten-gevonden'
				)}
				renderCell={renderCell}
				rowKey="contentId"
				variant="styled"
				onColumnClick={onClickColumn as any}
				sortColumn={sortColumn}
				sortOrder={sortOrder}
			/>
			<Spacer margin="top-large">
				<Pagination
					pageCount={Math.ceil(numberOfItems / ITEMS_PER_PAGE)}
					currentPage={page}
					onPageChange={setPage}
				/>
			</Spacer>
		</>
	);

	const renderEmptyFallback = () => (
		<ErrorView
			icon="bookmark"
			message={t('workspace/views/bookmarks___je-hebt-nog-geen-bladwijzers-aangemaakt')}
		>
			<p>
				<Trans i18nKey="workspace/views/bookmarks___een-bladwijzer-kan-je-gebruiken-om-eenvoudig-items-terug-te-vinden">
					Een bladwijzer kan je gebruiken om eenvoudig items terug te vinden.
				</Trans>
			</p>
			<Spacer margin="top">
				<Button
					type="primary"
					icon="search"
					label={t('workspace/views/bookmarks___zoek-een-item')}
					title={t(
						'workspace/views/bookmarks-overview___zoek-een-item-en-maak-er-een-bladwijzer-van'
					)}
					onClick={() => history.push(APP_PATH.SEARCH.route)}
				/>
			</Spacer>
		</ErrorView>
	);

	const renderBookmarks = () => (
		<>
			{bookmarks && bookmarks.length ? renderTable() : renderEmptyFallback()}
			<DeleteObjectModal
				title={t('workspace/views/bookmarks___verwijder-bladwijzer')}
				body={t(
					'workspace/views/bookmarks-overview___ben-je-zeker-dat-je-deze-bladwijzer-wil-verwijderen-br-deze-actie-kan-niet-ongedaan-gemaakt-worden'
				)}
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				deleteObjectCallback={onDeleteBookmark}
			/>
		</>
	);

	return (
		<LoadingErrorLoadedComponent
			loadingInfo={loadingInfo}
			dataObject={bookmarks}
			render={renderBookmarks}
		/>
	);
};

export default BookmarksOverview;
