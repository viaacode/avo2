import classnames from 'classnames';
import {
	cloneDeep,
	compact,
	fromPairs,
	get,
	isArray,
	isEmpty,
	isNil,
	isPlainObject,
	isString,
	omitBy,
	sortBy,
} from 'lodash-es';
import React, {
	FunctionComponent,
	KeyboardEvent,
	ReactElement,
	ReactNode,
	useEffect,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import {
	BooleanParam,
	NumberParam,
	QueryParamConfig,
	StringParam,
	useQueryParams,
} from 'use-query-params';

import {
	Button,
	ButtonType,
	Flex,
	Form,
	FormGroup,
	Pagination,
	Select,
	SelectOption,
	Spacer,
	Spinner,
	Table,
	TableColumn,
	TextInput,
	Toolbar,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import {
	BooleanCheckboxDropdown,
	CheckboxDropdownModal,
	CheckboxOption,
	DateRangeDropdown,
	DeleteObjectModal,
} from '../../../../shared/components';
import { MultiUserSelectDropdown } from '../../../../shared/components/MultiUserSelectDropdown/MultiUserSelectDropdown';
import { KeyCode } from '../../../../shared/types';
import { CheckboxListParam, DateRangeParam } from '../../helpers/query-string-converters';

import './FilterTable.scss';

export interface FilterableTableState {
	query?: string;
	sort_column: string;
	sort_order: Avo.Search.OrderDirection;
	page: number;
}

export interface FilterableColumn extends TableColumn {
	filterType?:
		| 'CheckboxDropdownModal'
		| 'DateRangeDropdown'
		| 'BooleanCheckboxDropdown'
		| 'MultiUserSelectDropdown';
	filterProps?: any;
	visibleByDefault: boolean;
}

const FILTER_TYPE_TO_QUERY_PARAM_CONVERTER = {
	CheckboxDropdownModal: CheckboxListParam,
	DateRangeDropdown: DateRangeParam,
	BooleanCheckboxDropdown: BooleanParam,
	MultiUserSelectDropdown: CheckboxListParam,
};

interface FilterTableProps extends RouteComponentProps {
	data: any[];
	dataCount: number;
	itemsPerPage: number;
	columns: FilterableColumn[];
	searchTextPlaceholder: string;
	noContentMatchingFiltersMessage: string;
	renderNoResults: () => ReactElement;
	renderCell: (
		rowData: any,
		columnId: string,
		rowIndex: number,
		columnIndex: number
	) => ReactNode;
	className?: string;
	onTableStateChanged: (tableState: { [id: string]: any }) => void;
	onRowClick?: (rowData: any) => void;
	rowKey?: string;
	variant?: 'bordered' | 'invisible' | 'styled';
	isLoading?: boolean;

	// Used for automatic dropdown with bulk actions
	bulkActions?: (SelectOption<string> & { confirm?: boolean; confirmButtonType?: ButtonType })[];
	onSelectBulkAction?: (action: string) => void;

	// Used for manual handling of selected rows
	showCheckboxes?: boolean;
	selectedItems?: any[] | null;
	onSelectionChanged?: (selectedItems: any[]) => void;
	onSelectAll?: () => void;
}

const FilterTable: FunctionComponent<FilterTableProps> = ({
	data,
	dataCount,
	itemsPerPage,
	columns,
	searchTextPlaceholder,
	noContentMatchingFiltersMessage,
	renderNoResults,
	renderCell,
	className,
	onTableStateChanged,
	onRowClick,
	rowKey = 'id',
	variant = 'bordered',
	isLoading = false,
	bulkActions,
	onSelectBulkAction,
	showCheckboxes,
	selectedItems,
	onSelectionChanged,
	onSelectAll,
}) => {
	const [t] = useTranslation();

	// Holds the text while the user is typing, once they press the search button or enter it will be copied to the tableState.query
	// This avoids doing a database query on every key press
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [selectedBulkAction, setSelectedBulkAction] = useState<string | null>(null);
	const [confirmBulkActionModalOpen, setConfirmBulkActionModalOpen] = useState<boolean>(false);

	// Build an object containing the filterable columns, so they can be converted to and from the query params
	const queryParamConfig: { [queryParamId: string]: QueryParamConfig<any> } = {
		page: NumberParam,
		...cleanupObject(
			fromPairs(
				compact(
					columns.map((col): [string, QueryParamConfig<any>] | null => {
						if (
							col.filterType &&
							FILTER_TYPE_TO_QUERY_PARAM_CONVERTER[col.filterType]
						) {
							return [col.id, FILTER_TYPE_TO_QUERY_PARAM_CONVERTER[col.filterType]];
						}
						return null;
					})
				)
			)
		),
		query: StringParam,
		sort_column: StringParam,
		sort_order: StringParam,
		columns: CheckboxListParam,
	};
	const [tableState, setTableState] = useQueryParams(queryParamConfig);

	useEffect(() => {
		onTableStateChanged(tableState);
		setSearchTerm(tableState.query);
	}, [onTableStateChanged, tableState]);

	const handleTableStateChanged = (value: any, id: string) => {
		let newTableState: any = cloneDeep(tableState);
		newTableState = cleanupObject({
			...newTableState,
			[id]: value,
			...(id !== 'page' ? { page: 0 } : {}), // Reset the page to 0, when any filter or sort order change is made
		});

		setTableState(newTableState, 'replace');
	};

	const handleSortOrderChanged = (columnId: string) => {
		let newTableState: any = cloneDeep(tableState);
		newTableState = cleanupObject({
			...newTableState,
			sort_column: columnId,
			sort_order: tableState.sort_order === 'asc' ? 'desc' : 'asc',
		});

		setTableState(newTableState, 'replace');
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.keyCode === KeyCode.Enter) {
			handleTableStateChanged(searchTerm, 'query');
		}
	};

	const handleSelectBulkAction = (selectedAction: string) => {
		const bulkActionInfo = (bulkActions || []).find(
			(action) => action.value === selectedAction
		);
		if (bulkActionInfo && onSelectBulkAction) {
			if (bulkActionInfo.confirm) {
				setSelectedBulkAction(selectedAction);
				setConfirmBulkActionModalOpen(true);
			} else {
				onSelectBulkAction(selectedAction);
				setSelectedBulkAction(null);
			}
		}
	};

	const handleConfirmSelectBulkAction = () => {
		if (onSelectBulkAction && selectedBulkAction) {
			onSelectBulkAction(selectedBulkAction);
			setSelectedBulkAction(null);
		}
	};

	const getColumnOptions = (): CheckboxOption[] => {
		// Get columns from query string list of columns, or use columns visible by default
		return sortBy(
			columns.map((column) => ({
				id: column.id,
				label: column.label || column.tooltip || '',
				checked:
					tableState.columns && tableState.columns.length
						? tableState.columns.includes(column.id)
						: column.visibleByDefault,
			})),
			(option) => option.label
		);
	};

	const getSelectedColumns = (): FilterableColumn[] => {
		if (!!tableState.columns && !!tableState.columns.length) {
			// Return the columns in the order they are specified in the query params
			return compact(
				tableState.columns.map((columnId: string) => {
					return columns.find((column) => column.id === columnId);
				})
			);
		}
		return columns.filter((column) => column.visibleByDefault);
	};

	const updateSelectedColumns = (selectedColumns: string[]) => {
		// Order the selected columns from the modal according to the default order in the column const array
		// This way, when a user selects columns, they will be in the default order
		// But if an array is set by modifying the query params, then the order from the query params will be kept
		handleTableStateChanged(
			columns
				.filter((column) => selectedColumns.includes(column.id))
				.map((column) => column.id),
			'columns'
		);
	};

	const renderFilters = () => {
		const page = tableState.page | 0;
		const from = page * itemsPerPage + 1;
		const to = Math.min(page * itemsPerPage + itemsPerPage, dataCount);
		return (
			<>
				<Spacer margin="bottom">
					<Form type="inline">
						<FormGroup className="c-content-filters__search" inlineMode="grow">
							<TextInput
								placeholder={searchTextPlaceholder}
								icon="search"
								onChange={setSearchTerm}
								onKeyUp={handleKeyUp}
								value={searchTerm}
							/>
						</FormGroup>
						<FormGroup inlineMode="shrink">
							<Button
								label={t(
									'admin/shared/components/filter-table/filter-table___zoeken'
								)}
								type="primary"
								onClick={() => handleTableStateChanged(searchTerm, 'query')}
							/>
						</FormGroup>
						<Spacer margin="left-small">
							<p className="c-body-1 u-text-muted">
								{from}-{to} van {dataCount} resultaten
							</p>
						</Spacer>
					</Form>
				</Spacer>

				<Spacer margin="bottom">
					<Toolbar className="c-filter-table__toolbar">
						<ToolbarLeft>
							<Flex spaced="regular" wrap>
								{columns.map((col) => {
									if (!col.filterType || !col.id) {
										return null;
									}

									switch (col.filterType) {
										case 'CheckboxDropdownModal':
											return (
												<CheckboxDropdownModal
													{...(col.filterProps || {})}
													id={col.id}
													label={col.label}
													onChange={(value) =>
														handleTableStateChanged(value, col.id)
													}
													options={get(
														col,
														'filterProps.options',
														[]
													).map((option: CheckboxOption) => ({
														...option,
														checked: (
															(tableState as any)[col.id] || []
														).includes(option.id),
													}))}
													key={`filter-${col.id}`}
												/>
											);

										case 'DateRangeDropdown':
											return (
												<DateRangeDropdown
													{...(col.filterProps || {})}
													id={col.id}
													label={col.label}
													onChange={(value) =>
														handleTableStateChanged(value, col.id)
													}
													range={(tableState as any)[col.id]}
													key={`filter-${col.id}`}
												/>
											);

										case 'BooleanCheckboxDropdown':
											return (
												<BooleanCheckboxDropdown
													{...(col.filterProps || {})}
													id={col.id}
													label={col.label}
													value={(tableState as any)[col.id]}
													onChange={(value) =>
														handleTableStateChanged(value, col.id)
													}
													key={`filter-${col.id}`}
												/>
											);

										case 'MultiUserSelectDropdown':
											return (
												<MultiUserSelectDropdown
													{...(col.filterProps || {})}
													id={col.id}
													label={col.label}
													values={(tableState as any)[col.id]}
													onChange={(value) =>
														handleTableStateChanged(value, col.id)
													}
													key={`filter-${col.id}`}
												/>
											);

										default:
											return null;
									}
								})}
								{!!bulkActions && !!bulkActions.length && (
									<Select
										options={bulkActions}
										onChange={handleSelectBulkAction}
										placeholder={t(
											'admin/shared/components/filter-table/filter-table___bulkactie'
										)}
										disabled={!(selectedItems || []).length}
										className="c-bulk-action-select"
									/>
								)}
							</Flex>
						</ToolbarLeft>
						<ToolbarRight>
							<CheckboxDropdownModal
								label={t(
									'admin/shared/components/filter-table/filter-table___kolommen'
								)}
								id="table_columns"
								options={getColumnOptions()}
								onChange={updateSelectedColumns}
								showSelectedValuesOnCollapsed={false}
								showSearch={false}
							/>
						</ToolbarRight>
					</Toolbar>
				</Spacer>
			</>
		);
	};

	return (
		<div className={classnames('c-filter-table', className)}>
			{!data.length && !getFilters(tableState) ? (
				renderNoResults()
			) : (
				<>
					{renderFilters()}
					<div className="c-filter-table__loading-wrapper">
						<div style={{ opacity: isLoading ? 0.2 : 1 }}>
							<Table
								columns={getSelectedColumns()}
								data={data}
								emptyStateMessage={noContentMatchingFiltersMessage}
								onColumnClick={(columnId) => {
									handleSortOrderChanged(columnId);
								}}
								onRowClick={onRowClick}
								renderCell={renderCell}
								rowKey={rowKey}
								variant={variant}
								sortColumn={tableState.sort_column}
								sortOrder={tableState.sort_order}
								showCheckboxes={
									(!!bulkActions && !!bulkActions.length) || showCheckboxes
								}
								selectedItemIds={selectedItems || undefined}
								onSelectionChanged={onSelectionChanged}
								onSelectAll={onSelectAll}
							/>
							<Spacer margin="top-large">
								<Pagination
									pageCount={Math.ceil(dataCount / itemsPerPage)}
									currentPage={tableState.page || 0}
									onPageChange={(newPage) =>
										handleTableStateChanged(newPage, 'page')
									}
								/>
							</Spacer>
						</div>
						{isLoading && (
							<Flex center className="c-filter-table__loading">
								<Spacer margin={['top-large', 'bottom-large']}>
									<Spinner size="large" />
								</Spacer>
							</Flex>
						)}
					</div>
				</>
			)}
			{!!bulkActions && !!bulkActions.length && (
				<DeleteObjectModal
					isOpen={confirmBulkActionModalOpen}
					deleteObjectCallback={handleConfirmSelectBulkAction}
					onClose={() => setConfirmBulkActionModalOpen(false)}
					confirmLabel={get(
						bulkActions.find((action) => action.value === selectedBulkAction),
						'label',
						t('admin/shared/components/filter-table/filter-table___bevestig')
					)}
					confirmButtonType={get(
						bulkActions.find((action) => action.value === selectedBulkAction),
						'confirmButtonType'
					)}
				/>
			)}
		</div>
	);
};

export default withRouter(FilterTable);

export function getFilters(tableState: any | undefined) {
	if (!tableState) {
		return tableState;
	}
	const { page, sort_column, sort_order, ...filters } = tableState;
	return cleanupObject(filters);
}

// Removes all props where the value is undefined, null, [], {}, ''
export function cleanupObject(obj: any) {
	return omitBy(
		obj,
		(value: any) =>
			isNil(value) ||
			(isString(value) && !value.length) ||
			((isPlainObject(value) || isArray(value)) && isEmpty(value)) ||
			(isPlainObject(value) && value.gte === '' && value.lte === '')
	);
}
