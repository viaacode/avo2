import React, { Component, Fragment, ReactNode } from 'react';
import { RouteComponentProps, StaticContext } from 'react-router';
import { Link } from 'react-router-dom';
import { Scrollbar } from 'react-scrollbars-custom';
import {
	Button,
	Column,
	Container,
	Grid,
	Icon,
	Image,
	MediaCard,
	MediaCardMetaData,
	MediaCardThumbnail,
	MetaData,
	MetaDataItem,
	TagList,
	Thumbnail,
	ToggleButton,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '../../components/avo2-components/src';
import { ExpandableContainer } from '../../components/ExpandableContainer/ExpandableContainer';
import { formatDate, formatDuration } from '../../helpers/formatting';
import { generateSearchLink, generateSearchLinks } from '../../helpers/generateLink';
import { LANGUAGES } from '../../helpers/languages';
import { getDetail } from '../../redux/detail/detailActions';
import { DetailResponse } from '../../types/detailTypes';
import { SearchResultItem } from '../../types/searchTypes';

type DetailProps = {};

interface DetailState extends StaticContext {
	item: Partial<SearchResultItem>;
}

export class Detail extends Component<RouteComponentProps<DetailProps>, DetailState> {
	constructor(props: RouteComponentProps) {
		super(props);
		this.state = {
			item: {},
		};
		// TODO: get item from store by id
		const itemId: string = (props.match.params as any)['id'];
		getDetail(itemId)
			.then((detailResponse: DetailResponse) => {
				this.setState({ item: detailResponse });
			})
			.catch(err => {
				console.error('Failed to get detail frop the server', err, { id: itemId });
			});
	}

	/**
	 * Split string by time markers and adds links to those times into the output jsx code
	 */
	private formatTimestamps(description: string = ''): ReactNode {
		const timestampRegex = /([0-9]{2}:[0-9]{2}:[0-9]{2}|\n)/g;
		const parts: string[] = description.split(timestampRegex);
		return parts.map((part: string, index: number) => {
			if (part === '\n') {
				return <br />;
			}
			if (timestampRegex.test(part)) {
				return <Link to={`detail/8911n96442?time=${part}`}>{part}</Link>;
			}
			return <span key={`part-${index}`}>{part}</span>;
		});
	}

	render() {
		const item = this.state.item;
		const relatedItemStyle: any = { width: '18%', float: 'left', marginRight: '2%' };

		return (
			<Fragment>
				<Container mode="vertical" size="small" background="alt">
					<Container mode="horizontal">
						<Toolbar>
							<ToolbarLeft>
								<ToolbarItem>
									<div className="u-spacer-bottom">
										<div className="c-content-type c-content-type--video">
											{item.administrative_type && (
												<Icon
													name={
														item.administrative_type === 'audio'
															? 'headphone'
															: item.administrative_type
													}
												/>
											)}
											<p>Video</p>
										</div>
									</div>
									<h1 className="c-h2 u-m-b-0">{item.dc_title}</h1>
									<MetaData spaced={true} category={item.administrative_type || 'video'}>
										<MetaDataItem>{generateSearchLink('provider', item.original_cp)}</MetaDataItem>
										{item.dcterms_issued && (
											<MetaDataItem>
												<p className="c-body-2 u-text-muted">
													Gepubliceerd op {formatDate(item.dcterms_issued, '/')}
												</p>
											</MetaDataItem>
										)}
										<MetaDataItem>
											Uit reeks: {generateSearchLink('serie', item.dc_titles_serie)}
										</MetaDataItem>
									</MetaData>
								</ToolbarItem>
							</ToolbarLeft>
							<ToolbarRight>
								<ToolbarItem>
									<MetaData category={item.administrative_type || 'video'}>
										{/* TODO link meta data to actual data */}
										<MetaDataItem label={String(188)} icon="eye" />
										<MetaDataItem label={String(370)} icon="bookmark" />
										{item.administrative_type === 'collection' && (
											<MetaDataItem label={String(12)} icon="collection" />
										)}
									</MetaData>
								</ToolbarItem>
							</ToolbarRight>
						</Toolbar>
					</Container>
				</Container>
				<Container mode="vertical">
					<Container mode="horizontal">
						<Grid>
							<Column size="2-8">
								<div className="o-container-vertical-list">
									<div className="o-container-vertical o-container-vertical--padding-small">
										<div className="c-video-player t-player-skin--dark">
											{item.thumbnail_path && <Image src={item.thumbnail_path} />}
										</div>
										<div className="u-spacer-top-l">
											<div className="o-flex o-flex--justify-between o-flex--wrap">
												<div className="c-button-toolbar u-spacer-right">
													<Button
														type="tertiary"
														icon="add"
														label="Voeg fragment toe aan collectie"
													/>
													<Button type="tertiary" icon="clipboard" label="Maak opdracht" />
												</div>
												<div className="c-button-toolbar">
													<ToggleButton type="tertiary" icon="bookmark" active={false} />
													<Button type="tertiary" icon="share-2" />
													<Button type="tertiary" icon="flag" />
												</div>
											</div>
										</div>
									</div>
									<h3 className="c-h3">Bekijk ook</h3>
									<ul className="c-media-card-list">
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`detail/${item.id}`}
												category={item.administrative_type || 'video'}
												orientation="vertical"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category={item.administrative_type || 'video'}
														src={item.thumbnail_path}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category={item.administrative_type || 'video'}>
														<MetaDataItem label={item.original_cp || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`detail/${item.id}`}
												category={item.administrative_type || 'video'}
												orientation="vertical"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category={item.administrative_type || 'video'}
														src={item.thumbnail_path}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category={item.administrative_type || 'video'}>
														<MetaDataItem label={item.original_cp || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`detail/${item.id}`}
												category={item.administrative_type || 'video'}
												orientation="vertical"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category={item.administrative_type || 'video'}
														src={item.thumbnail_path}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category={item.administrative_type || 'video'}>
														<MetaDataItem label={item.original_cp || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`detail/${item.id}`}
												category={item.administrative_type || 'video'}
												orientation="vertical"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category={item.administrative_type || 'video'}
														src={item.thumbnail_path}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category={item.administrative_type || 'video'}>
														<MetaDataItem label={item.original_cp || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`detail/${item.id}`}
												category={item.administrative_type || 'video'}
												orientation="vertical"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category={item.administrative_type || 'video'}
														src={item.thumbnail_path}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category={item.administrative_type || 'video'}>
														<MetaDataItem label={item.original_cp || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
									</ul>
									<div className="o-container-vertical o-container-vertical--padding-small">
										<table className="c-table c-table--horizontal c-table--untable">
											<tbody>
												<tr>
													<th scope="row">Publicatiedatum</th>
													<td>{item.dcterms_issued && formatDate(item.dcterms_issued, '/')}</td>
													<th scope="row">Toegevoegd op</th>
													{/* TODO replace meta data with actual data from api (more fields than SearchResultItem */}
													<td>{item.dcterms_issued && formatDate(item.dcterms_issued, '/')}</td>
												</tr>
												<tr>
													<th scope="row">Aanbieder</th>
													<td>{generateSearchLink('provider', item.original_cp)}</td>
													<th scope="row">Speelduur</th>
													<td>{formatDuration(item.duration_seconds)}</td>
												</tr>
												<tr>
													<th scope="row">Reeks</th>
													<td>{generateSearchLink('serie', item.dc_titles_serie)}</td>
													<th scope="row">Taal</th>
													<td>
														{(item.lom_languages || [])
															.map(languageCode => LANGUAGES.nl[languageCode])
															.join(', ')}
													</td>
												</tr>
											</tbody>
										</table>
										<div className="c-hr" />
										<table className="c-table c-table--horizontal c-table--untable">
											<tbody>
												<tr>
													<th scope="row">Geschikt voor</th>
													<td>
														{generateSearchLinks(
															item.id as string,
															'educationLevel',
															item.lom_typical_age_range
														)}
													</td>
												</tr>
												<tr>
													<th scope="row">Vakken</th>
													<td>
														{generateSearchLinks(
															item.id as string,
															'subject',
															item.lom_classification
														)}
													</td>
												</tr>
											</tbody>
										</table>
										<div className="c-hr" />
										<table className="c-table c-table--horizontal c-table--untable">
											<tbody>
												<tr>
													<th scope="row">Onderwerpen</th>
													<td>
														<TagList tags={item.lom_keywords || []} swatches={false} />
													</td>
												</tr>
												<tr>
													<th scope="row">Klascement</th>
													<td>
														<a href={'http://www.klascement.be/link_item'}>
															www.klascement.be/link_item
														</a>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</Column>
							<Column size="2-4">
								<Container mode="vertical">
									<Scrollbar
										style={{
											width: '100%',
											height: '471px',
											overflowY: 'auto',
										}}
									>
										<h4 className="c-h4">Beschrijving</h4>
										<ExpandableContainer collapsedHeight={387}>
											<p style={{ paddingRight: '1rem' }}>
												{this.formatTimestamps(item.dcterms_abstract)}
											</p>
										</ExpandableContainer>
									</Scrollbar>
								</Container>
							</Column>
						</Grid>
					</Container>
				</Container>
			</Fragment>
		);
	}
}
