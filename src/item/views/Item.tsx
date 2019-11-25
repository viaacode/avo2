import { isNull } from 'lodash-es';
import queryString from 'query-string';
import React, { createRef, FunctionComponent, RefObject, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import {
	Button,
	ButtonToolbar,
	Column,
	Container,
	Flex,
	Grid,
	Icon,
	IconName,
	MediaCard,
	MediaCardMetaData,
	MediaCardThumbnail,
	MetaData,
	MetaDataItem,
	Spacer,
	Table,
	TagList,
	Thumbnail,
	ToggleButton,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { ContentType } from '@viaa/avo2-components/dist/types';
import { Avo } from '@viaa/avo2-types';

import { getProfileName } from '../../authentication/helpers/get-profile-info';
import {
	ContentTypeNumber,
	ContentTypeString,
	toEnglishContentType,
} from '../../collection/collection.types';
import { DataQueryComponent } from '../../shared/components';
import { LANGUAGES } from '../../shared/constants';
import {
	generateAssignmentCreateLink,
	generateSearchLink,
	generateSearchLinks,
	generateSearchLinkString,
	reorderDate,
} from '../../shared/helpers';
import { trackEvents } from '../../shared/services/event-logging-service';
import { getRelatedItems } from '../../shared/services/related-items-service';
import toastService, { TOAST_TYPE } from '../../shared/services/toast-service';

import { AddToCollectionModal, ItemVideoDescription } from '../components';
import { GET_ITEM_BY_ID } from '../item.gql';

import './Item.scss';

interface ItemProps extends RouteComponentProps {}

const Item: FunctionComponent<ItemProps> = ({ history, match }) => {
	const videoRef: RefObject<HTMLVideoElement> = createRef();

	const [itemId] = useState<string | undefined>((match.params as any)['id']);
	// TODO: use setTime when adding logic for enabling timestamps in the URL
	const [time] = useState<number>(0);
	const [isOpenAddToCollectionModal, setIsOpenAddToCollectionModal] = useState(false);
	const [relatedItems, setRelatedItems] = useState<Avo.Search.ResultItem[] | null>(null);

	/**
	 * Update video and query param time when time changes in the state
	 */
	useEffect(() => {
		const setSeekerTimeInQueryParams = (): void => {
			history.push({
				pathname: `/item/${itemId}`,
				search: time ? `?${queryString.stringify({ time })}` : '',
			});
		};

		const setSeekerTime = () => {
			if (videoRef.current) {
				videoRef.current.currentTime = time;
			}
		};

		if (time) {
			setSeekerTimeInQueryParams();
			setSeekerTime();
		}

		if (itemId) {
			if (isNull(relatedItems)) {
				getRelatedItems(itemId, 'items', 5)
					.then(setRelatedItems)
					.catch(err => {
						console.error('Failed to get related items', err, { itemId, index: 'items', limit: 5 });
						toastService('Het ophalen van de gerelateerde items is mislukt', TOAST_TYPE.DANGER);
					});
			}

			// Log event of item page view
			trackEvents({
				event_object: {
					type: 'item',
					identifier: itemId,
				},
				event_message: `Gebruiker ${getProfileName()} heeft de pagina van fragment ${itemId} bezocht`,
				name: 'view',
				category: 'item',
			});
		}
	}, [time, history, videoRef, itemId, relatedItems]);

	/**
	 * Set video current time from the query params once the video has loaded its meta data
	 * If this happens sooner, the time will be ignored by the video player
	 */
	// TODO: trigger this function when flowplayer is loaded
	// const getSeekerTimeFromQueryParams = () => {
	// 	const queryParams = queryString.parse(location.search);
	// 	setTime(parseInt((queryParams.time as string) || '0', 10));
	// };

	const goToSearchPage = (prop: Avo.Search.FilterProp, value: string) => {
		history.push(generateSearchLinkString(prop, value));
	};

	const renderRelatedItems = () => {
		if (relatedItems && relatedItems.length) {
			return relatedItems.map(relatedItem => {
				const englishContentType: ContentType =
					toEnglishContentType(relatedItem.administrative_type) || ContentTypeString.video;

				return (
					<li key={`related-item-${relatedItem.id}`}>
						<MediaCard
							title={relatedItem.dc_title}
							href={`/item/${relatedItem.id}`}
							category={englishContentType}
							orientation="horizontal"
						>
							<MediaCardThumbnail>
								<Thumbnail category={englishContentType} src={relatedItem.thumbnail_path} />
							</MediaCardThumbnail>
							<MediaCardMetaData>
								<MetaData category={englishContentType}>
									<MetaDataItem label={relatedItem.original_cp || ''} />
								</MetaData>
							</MediaCardMetaData>
						</MediaCard>
					</li>
				);
			});
		}
		return null;
	};

	const renderItem = (itemMetaData: Avo.Item.Item) => {
		const englishContentType: ContentType =
			toEnglishContentType(itemMetaData.type.label) || ContentTypeString.video;

		return (
			<>
				<Container className="c-item-view__header" mode="vertical" size="small" background="alt">
					<Container mode="horizontal">
						<Toolbar autoHeight>
							<ToolbarLeft>
								<ToolbarItem>
									<Spacer margin="bottom">
										<div className="c-content-type c-content-type--video">
											{itemMetaData.type && (
												<Icon
													name={
														(itemMetaData.type.id === ContentTypeNumber.audio
															? 'headphone'
															: itemMetaData.type.label) as IconName
													}
												/>
											)}
											<p>{itemMetaData.type.label}</p>
										</div>
									</Spacer>
									<h1 className="c-h2 u-m-0">{itemMetaData.title}</h1>
									<MetaData category={toEnglishContentType(itemMetaData.type.label)} spaced>
										{itemMetaData.org_name && (
											<MetaDataItem>
												<p className="c-body-2 u-text-muted">
													{generateSearchLink('provider', itemMetaData.org_name || '')}
												</p>
											</MetaDataItem>
										)}
										{itemMetaData.publish_at && (
											<MetaDataItem>
												<p className="c-body-2 u-text-muted">
													Gepubliceerd op {reorderDate(itemMetaData.issued || null, '/')}
												</p>
											</MetaDataItem>
										)}
										<MetaDataItem>
											<p className="c-body-2 u-text-muted">
												Uit reeks: {generateSearchLink('serie', itemMetaData.series)}
											</p>
										</MetaDataItem>
									</MetaData>
								</ToolbarItem>
							</ToolbarLeft>
							<ToolbarRight>
								<ToolbarItem>
									<div className="u-mq-switch-main-nav-authentication">
										<MetaData category={englishContentType}>
											{/* TODO link meta data to actual data */}
											<MetaDataItem label="0" icon="eye" />
											<MetaDataItem label="0" icon="bookmark" />
											{itemMetaData.type.id === ContentTypeNumber.collection && (
												<MetaDataItem label="0" icon="collection" />
											)}
										</MetaData>
									</div>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</Container>
				</Container>
				<Container className="c-item-view__main" mode="vertical">
					<Container mode="horizontal">
						<ItemVideoDescription itemMetaData={itemMetaData} />
						<Grid>
							<Column size="2-7">
								<Spacer margin="top-large">
									<Flex justify="between" wrap>
										<ButtonToolbar>
											<Flex justify="between" wrap>
												<Button
													type="tertiary"
													icon="add"
													label="Voeg fragment toe aan collectie"
													onClick={() => setIsOpenAddToCollectionModal(true)}
												/>
												<Button
													type="tertiary"
													icon="clipboard"
													label="Maak opdracht"
													onClick={() =>
														history.push(
															generateAssignmentCreateLink('KIJK', itemMetaData.external_id, 'ITEM')
														)
													}
												/>
											</Flex>
										</ButtonToolbar>
									</Flex>
									<ButtonToolbar>
										<ToggleButton
											type="tertiary"
											icon="bookmark"
											active={false}
											ariaLabel="toggle bladwijzer"
										/>
										<Button type="tertiary" icon="share-2" ariaLabel="share item" />
										<Button type="tertiary" icon="flag" ariaLabel="rapporteer item" />
									</ButtonToolbar>
								</Spacer>
							</Column>
							<Column size="2-5">
								<></>
							</Column>
						</Grid>
						<Grid>
							<Column size="2-7">
								<Container mode="vertical" size="small">
									<Table horizontal untable>
										<Grid tag="tbody">
											<Column size="2-5" tag="tr">
												<th scope="row">Publicatiedatum</th>
												<td>{reorderDate(itemMetaData.publish_at || null, '/')}</td>
											</Column>
											<Column size="2-5" tag="tr">
												<th scope="row">Toegevoegd op</th>
												{/* TODO replace meta data with actual data from api (more fields than SearchResultItem */}
												<td>{reorderDate(itemMetaData.issued || null, '/')}</td>
											</Column>
										</Grid>
										<Grid tag="tbody">
											<Column size="2-5" tag="tr">
												<th scope="row">Aanbieder</th>
												{itemMetaData.org_name && (
													<td>{generateSearchLink('provider', itemMetaData.org_name || '')}</td>
												)}
											</Column>
											<Column size="2-5" tag="tr">
												<th scope="row">Speelduur</th>
												<td>{itemMetaData.duration}</td>
											</Column>
										</Grid>
										<Grid tag="tbody">
											<Column size="2-5" tag="tr">
												<th scope="row">Reeks</th>
												<td>{generateSearchLink('serie', itemMetaData.series)}</td>
											</Column>
											<Column size="2-5" tag="tr">
												<th scope="row">Taal</th>
												<td>
													{(itemMetaData.lom_languages || [])
														.map(languageCode => LANGUAGES.nl[languageCode])
														.join(', ')}
												</td>
											</Column>
										</Grid>
									</Table>
									<div className="c-hr" />
									<Table horizontal untable>
										<tbody>
											<tr>
												<th scope="row">Geschikt voor</th>
												<td>
													{generateSearchLinks(
														itemMetaData.external_id,
														'educationLevel',
														itemMetaData.lom_context
													)}
												</td>
											</tr>
											<tr>
												<th scope="row">Vakken</th>
												<td>
													{generateSearchLinks(
														itemMetaData.external_id,
														'subject',
														itemMetaData.lom_classification
													)}
												</td>
											</tr>
										</tbody>
									</Table>
									<div className="c-hr" />
									<Table horizontal untable>
										<tbody>
											<tr>
												<th scope="row">Trefwoorden</th>
												<td>
													<TagList
														tags={(itemMetaData.lom_keywords || []).map(keyword => ({
															label: keyword,
															id: keyword,
														}))}
														swatches={false}
														onTagClicked={(tagId: string | number) =>
															goToSearchPage('keyword', tagId as string)
														}
													/>
												</td>
											</tr>
											{/*<tr>*/}
											{/*<th scope="row">Klascement</th>*/}
											{/*<td>*/}
											{/*<a href={'http://www.klascement.be/link_item'}>*/}
											{/*www.klascement.be/link_item*/}
											{/*</a>*/}
											{/*</td>*/}
											{/*</tr>*/}
										</tbody>
									</Table>
								</Container>
							</Column>
							<Column size="2-5">
								<Container size="small" mode="vertical">
									<h3 className="c-h3">Bekijk ook</h3>
									<ul className="c-media-card-list">{renderRelatedItems()}</ul>
								</Container>
							</Column>
						</Grid>
					</Container>
				</Container>
				{typeof itemId !== undefined && (
					<AddToCollectionModal
						itemMetaData={itemMetaData}
						externalId={itemId as string}
						isOpen={isOpenAddToCollectionModal}
						onClose={() => setIsOpenAddToCollectionModal(false)}
					/>
				)}
			</>
		);
	};

	return (
		<DataQueryComponent
			query={GET_ITEM_BY_ID}
			variables={{ id: itemId }}
			resultPath="app_item_meta[0]"
			renderData={renderItem}
			notFoundMessage="Dit item werd niet gevonden"
		/>
	);
};

export default withRouter(Item);
