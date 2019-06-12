import { History, Location } from 'history';
import {
	capitalize,
	cloneDeep,
	every,
	get,
	isArray,
	isEmpty,
	isNil,
	isPlainObject,
	noop,
	pickBy,
} from 'lodash-es';
import queryString from 'query-string';
import React, { ChangeEvent, Component, ReactNode } from 'react';
import { RouteComponentProps, StaticContext } from 'react-router';
import { setDeepState, unsetDeepState } from '../../helpers/setDeepState';
import { doSearch } from '../../redux/search/searchActions';
import {
	FilterOptionSearch,
	Filters,
	OptionProp,
	SearchOrderDirection,
	SearchOrderProperty,
	SearchResponse,
	SearchResultItem,
} from '../../types';

import { Button, Container, Form, Select, TextInput } from '../../components/avo2-components/src';
import { DatePicker } from '../../components/avo2-components/src/components/DatePicker/DatePicker';
import { Dropdown } from '../../components/avo2-components/src/components/Dropdown/Dropdown';
import { FormGroup } from '../../components/avo2-components/src/components/Form/FormGroup';
import {
	CheckboxDropdown,
	CheckboxOption,
} from '../../components/CheckboxDropdown/CheckboxDropdown';

type SearchProps = {};

interface SearchState extends StaticContext {
	formState: Filters;
	filterOptionSearch: FilterOptionSearch;
	orderProperty: SearchOrderProperty;
	orderDirection: SearchOrderDirection;
	multiOptions: { [key: string]: OptionProp[] };
	searchResults: SearchResultItem[];
}

export class Search extends Component<RouteComponentProps<SearchProps>, SearchState> {
	history: History;
	location: Location;

	constructor(props: RouteComponentProps) {
		super(props);
		this.history = props.history;
		this.location = props.location;
		this.state = {
			// formState: {
			// 	// Default values for filters for easier testing of search api // TODO clear default filters
			// 	query: 'wie verdient er aan uw schulden',
			// 	type: ['video', 'audio'],
			// 	educationLevel: ['Secundair 2de graad', 'Secundair 3de graad'],
			// 	domain: [],
			// 	broadcastDate: {
			// 		gte: '2000-01-01',
			// 		lte: '2020-01-01',
			// 	},
			// 	language: ['nl', 'fr'],
			// 	keyword: ['armoede'],
			// 	subject: ['levensbeschouwing'],
			// 	serie: ['Pano'],
			// 	provider: [],
			// },
			formState: {
				query: '',
				type: [],
				educationLevel: [],
				domain: [],
				broadcastDate: {
					gte: '',
					lte: '',
				},
				language: [],
				keyword: [],
				subject: [],
				serie: [],
				provider: [],
			},
			filterOptionSearch: {
				type: '',
				educationLevel: '',
				domain: '',
				language: '',
				keyword: '',
				subject: '',
				serie: '',
				provider: '',
			},
			orderProperty: 'relevance',
			orderDirection: 'desc',
			multiOptions: {},
			searchResults: [],
		};
	}

	async componentDidMount() {
		await this.checkFiltersInQueryParams();

		this.submitSearchForm().then(noop);
	}

	async checkFiltersInQueryParams(): Promise<void> {
		return new Promise<void>(resolve => {
			// Check if current url already has a query param set
			const queryParams = queryString.parse(this.location.search);
			try {
				if (!queryParams.query && !queryParams.orderProperty && !queryParams.orderDirection) {
					resolve();
				}
				const newState: SearchState = cloneDeep(this.state);
				if (queryParams.query) {
					newState.formState = JSON.parse(queryParams.query as string);
				}
				newState.orderProperty = (queryParams.orderProperty || 'relevance') as SearchOrderProperty;
				newState.orderDirection = (queryParams.orderProperty || 'desc') as SearchOrderDirection;
				this.setState(newState, resolve);
			} catch (err) {
				// TODO show toast error: Ongeldige zoek query
				resolve();
			}
		});
	}

	handleFilterOptionSearchChange = (event: ChangeEvent) => {
		const target = event.target as HTMLInputElement;
		if (target) {
			const { name, value } = target;
			setDeepState(this, `filterOptionSearch.${name}`, value).then(noop);
		}
	};

	handleFilterFieldChange = (
		value: string | string[] | { gte: string; lte: string } | null,
		id: string
	) => {
		if (value) {
			setDeepState(this, `formState.${id}`, value).then(noop);
		} else {
			unsetDeepState(this, `formState.${id}`).then(noop);
		}
	};

	handleOrderChanged = (value: string = 'relevance_desc') => {
		const valueParts: string[] = value.split('_');
		const orderProperty: string = valueParts[0];
		const orderDirection: string = valueParts[1];
		this.setState(
			{
				orderProperty: orderProperty as SearchOrderProperty,
				orderDirection: orderDirection as SearchOrderDirection,
			},
			async () => {
				await this.submitSearchForm();
			}
		);
	};

	private cleanupFilterObject(obj: any): any {
		return pickBy(obj, (value: any) => {
			const isEmptyString = value === '';
			const isUndefinedOrNull = isNil(value);
			const isEmptyObjectOrArray = (isPlainObject(value) || isArray(value)) && isEmpty(value);
			const isArrayWithEmptyValues = isArray(value) && every(value, value => value === '');
			const isEmptyRangeObject = isPlainObject(value) && !(value as any).gte && !(value as any).lte;

			return (
				!isEmptyString &&
				!isUndefinedOrNull &&
				!isEmptyObjectOrArray &&
				!isArrayWithEmptyValues &&
				!isEmptyRangeObject
			);
		});
	}

	submitSearchForm = async () => {
		try {
			// Parse values from formState into a parsed object that we'll send to the proxy search endpoint
			const filterOptions: Partial<Filters> = this.cleanupFilterObject(
				cloneDeep(this.state.formState)
			);

			// Parse values from formState into a parsed object that we'll send to the proxy search endpoint
			const filterOptionSearch: Partial<FilterOptionSearch> = this.cleanupFilterObject(
				cloneDeep(this.state.filterOptionSearch)
			);

			// Remember this search by adding it to the query params in the url
			this.history.push({
				pathname: '/search',
				search:
					`?query=${JSON.stringify(filterOptions)}` +
					`&orderProperty=${this.state.orderProperty}` +
					`&orderDirection=${this.state.orderDirection}`,
			});

			// TODO do the search by dispatching a redux action
			const searchResponse: SearchResponse = await doSearch(
				filterOptions,
				filterOptionSearch,
				this.state.orderProperty,
				this.state.orderDirection,
				0,
				10
			);

			this.setState({
				...this.state,
				multiOptions: searchResponse.aggregations,
				searchResults: searchResponse.results || [],
			});
		} catch (err) {
			// TODO show error toast
		}
	};

	renderMultiSelect(label: string, propertyName: keyof Filters): ReactNode {
		const multiOptions = (this.state.multiOptions[propertyName] || []).map(
			(option: OptionProp): CheckboxOption => {
				return {
					label: `${capitalize(option.option_name)} (${option.option_count})`,
					id: option.option_name,
					checked: false,
				};
			}
		);

		// <input
		// type="text"
		// id={propertyName}
		// name={propertyName}
		// placeholder="Filter options"
		// onChange={this.handleFilterOptionSearchChange}
		// style={{ display: 'block', width: '100%' }}
		// />

		return (
			<li className="c-filter-dropdown">
				<CheckboxDropdown label={label} id={propertyName} options={multiOptions} />
			</li>
		);
	}

	renderDateRange(label: string, propertyName: keyof Filters): ReactNode {
		return (
			<li className="c-filter-dropdown">
				<Dropdown label="Uitzenddatum">
					<div className="u-spacer">
						<label>Hoe specifiek?</label>
						<br />
						<span>TODO add radio buttons</span>
						<br />
						<FormGroup label="Van">
							<DatePicker
								id={`${propertyName}.gte`}
								defaultValue={get(this.state, `formState.${propertyName}.gte`)}
								onChange={value =>
									this.handleFilterFieldChange(
										value && value.toISOString().substring(0, '2000-01-01'.length),
										`${propertyName}.gte`
									)
								}
							/>
						</FormGroup>
						<FormGroup label="Tot">
							<DatePicker
								id={`${propertyName}.lte`}
								defaultValue={get(this.state, `formState.${propertyName}.lte`)}
								onChange={value =>
									this.handleFilterFieldChange(
										value && value.toISOString().substring(0, '2000-01-01'.length),
										`${propertyName}.lte`
									)
								}
							/>
						</FormGroup>
					</div>
				</Dropdown>
			</li>
		);
	}

	renderFilterControls() {
		return (
			<div className="c-filter-dropdown-list">
				{this.renderMultiSelect('Type', 'type')}
				{this.renderMultiSelect('Onderwijsniveau', 'educationLevel')}
				{this.renderMultiSelect('Domein', 'domain')}
				{this.renderDateRange('Uitzenddatum', 'broadcastDate')}
				{this.renderMultiSelect('Taal', 'language')}
				{this.renderMultiSelect('Onderwerp', 'keyword')}
				{this.renderMultiSelect('Vak', 'subject')}
				{this.renderMultiSelect('Serie', 'serie')}
				{this.renderMultiSelect('Aanbieder', 'provider')}
			</div>
		);
	}

	render() {
		const orderOptions = [
			{ label: 'Meest relevant', value: 'relevance_desc' },
			{ label: 'Meest bekeken', value: 'views_desc' },
			{ label: 'Uitzenddatum aflopend', value: 'broadcastDate_desc' },
			{ label: 'Uitzenddatum oplopend', value: 'broadcastDate_asc' },
			{ label: 'Laatst toegevoegd', value: 'addedDate_desc' },
			{ label: 'Laatst gewijzigd', value: 'editDate_desc' },
		];

		return (
			<Container mode={'horizontal'}>
				<Form type="inline">
					<FormGroup label="Sorteer op" labelFor="sortBy">
						<Select
							id="sortBy"
							options={orderOptions}
							onChange={value => this.handleOrderChanged(value)}
						/>
					</FormGroup>
				</Form>
				<br />
				<div className="filters">
					<div className="u-spacer-bottom-l">
						<div className="u-limit-width-bp3">
							<Form type="inline">
								<FormGroup>
									<TextInput
										id="query"
										placeholder="Vul uw zoekterm in..."
										defaultValue={this.state.formState.query}
										onChange={value => this.handleFilterFieldChange(value, 'query')}
									/>
								</FormGroup>
								<FormGroup>
									<Button label="Zoeken" type="primary" onClick={this.submitSearchForm} />
								</FormGroup>
							</Form>
						</div>
					</div>
					<ul className="c-filter-dropdown-list">{this.renderFilterControls()}</ul>
				</div>
				<div>
					<h2>Results</h2>
					<div className="results-container" />
					{this.state.searchResults.map(result => (
						<div key={result.pid}>
							<span className="title">{result.dc_title}</span>
							<br />
							<span className="title">{result.dcterms_issued}</span>
							<br />
							<img src={result.thumbnail_path} style={{ maxWidth: '300px' }} alt="" />
							<br />
							<br />
						</div>
					))}
				</div>
			</Container>
		);
	}
}
