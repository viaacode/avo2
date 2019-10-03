import { useMutation } from '@apollo/react-hooks';
import { get, orderBy } from 'lodash-es';
import React, { Fragment, FunctionComponent, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import {
	Avatar,
	BlockImage,
	BlockImageProps,
	BlockImageTitleTextButton,
	BlockImageTitleTextButtonProps,
	BlockIntro,
	BlockIntroProps,
	BlockLinks,
	BlockLinksProps,
	BlockQuote,
	BlockQuoteProps,
	BlockSubtitle,
	BlockSubtitleProps,
	BlockText,
	BlockTextProps,
	BlockTitle,
	BlockTitleImageText,
	BlockTitleImageTextProps,
	BlockTitleProps,
	BlockVideo,
	BlockVideoProps,
	BlockVideoTitleTextButton,
	BlockVideoTitleTextButtonProps,
	Button,
	Column,
	Container,
	DropdownButton,
	DropdownContent,
	Flex,
	Grid,
	Icon,
	MediaCard,
	MediaCardMetaData,
	MediaCardThumbnail,
	MenuContent,
	MetaData,
	MetaDataItem,
	Navbar,
	Spacer,
	Thumbnail,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';
import { Avo } from '@viaa/avo2-types';

import { RouteParts } from '../../constants';
import ControlledDropdown from '../../shared/components/ControlledDropdown/ControlledDropdown';
import { DataQueryComponent } from '../../shared/components/DataComponent/DataQueryComponent';
import DeleteObjectModal from '../../shared/components/modals/DeleteObjectModal';
import { formatDate } from '../../shared/helpers/formatters/date';
import {
	generateAssignmentCreateLink,
	generateContentLinkString,
	generateSearchLinks,
} from '../../shared/helpers/generateLink';
import { fetchPlayerTicket } from '../../shared/services/player-ticket-service';
import toastService, { TOAST_TYPE } from '../../shared/services/toast-service';
import { DELETE_COLLECTION, GET_COLLECTION_BY_ID } from '../graphql';
import { isVideoFragment } from '../helpers';
import { ContentBlockInfo, ContentBlockType, ContentTypeString } from '../types';

import './Collection.scss';

interface CollectionProps extends RouteComponentProps {}

const Collection: FunctionComponent<CollectionProps> = ({ match, history }) => {
	const [collectionId] = useState((match.params as any)['id'] as string);
	const [playerTicket, setPlayerTicket] = useState<string | undefined>();
	const [idToDelete, setIdToDelete] = useState<number | null>(null);
	const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [triggerCollectionDelete] = useMutation(DELETE_COLLECTION);

	const openDeleteModal = (collectionId: number) => {
		setIdToDelete(collectionId);
		setIsDeleteModalOpen(true);
	};

	const deleteCollection = async () => {
		try {
			await triggerCollectionDelete({
				variables: {
					id: idToDelete,
				},
			});
			setIdToDelete(null);
			toastService('Het verwijderen van de collectie is gelukt', TOAST_TYPE.SUCCESS);
		} catch (err) {
			console.error(err);
			toastService('Het verwijderen van de collectie is mislukt', TOAST_TYPE.DANGER);
		}
	};

	const renderContentBlocks = (contentBlocks: ContentBlockInfo[]) => {
		return contentBlocks.map((contentBlock: ContentBlockInfo, index: number) => {
			return (
				<li className="c-collection-list__item" key={`content-block-${index}`}>
					{renderContentBlock(contentBlock)}
				</li>
			);
		});
	};

	const renderContentBlock = (contentBlock: ContentBlockInfo) => {
		const {
			Image,
			ImageTitleTextButton,
			Intro,
			Links,
			Quote,
			RichText,
			Subtitle,
			Title,
			Video,
			TitleImageText,
			VideoTitleTextButton,
		} = ContentBlockType;
		const { content, blockType } = contentBlock;

		switch (blockType) {
			case Image:
				return <BlockImage {...content as BlockImageProps} />;
			case ImageTitleTextButton:
				return <BlockImageTitleTextButton {...content as BlockImageTitleTextButtonProps} />;
			case Intro:
				return <BlockIntro {...content as BlockIntroProps} />;
			case Links:
				return <BlockLinks {...content as BlockLinksProps} />;
			case Quote:
				return <BlockQuote {...content as BlockQuoteProps} />;
			case RichText:
				return <BlockText {...content as BlockTextProps} />;
			case Subtitle:
				return <BlockSubtitle {...content as BlockSubtitleProps} />;
			case Title:
				return <BlockTitle {...content as BlockTitleProps} />;
			case TitleImageText:
				return <BlockTitleImageText {...content as BlockTitleImageTextProps} />;
			case Video:
				return <BlockVideo {...content as BlockVideoProps} />;
			case VideoTitleTextButton:
				return <BlockVideoTitleTextButton {...content as BlockVideoTitleTextButtonProps} />;
			default:
				toastService(`Failed to find contentBlock type: ${blockType}`, TOAST_TYPE.DANGER);
				return null;
		}
	};

	// TODO: Replace types when available
	const getFragmentField = (fragment: Avo.Collection.Fragment, field: string) =>
		fragment.use_custom_fields
			? (fragment as any)[`custom_${field}`]
			: (fragment as any).item_meta[field];

	const renderCollection = (collection: Avo.Collection.Response) => {
		const contentBlockInfos: ContentBlockInfo[] = [];

		if (collection) {
			contentBlockInfos.push({
				blockType: ContentBlockType.Intro,
				content: {
					subtitle: 'Introductie',
					text: collection.description,
				} as BlockIntroProps,
			});

			const fragments = orderBy([...collection.collection_fragments], 'position', 'asc') || [];

			fragments.forEach((fragment: Avo.Collection.Fragment) => {
				const initFlowPlayer = () =>
					!playerTicket &&
					fetchPlayerTicket(fragment.external_id)
						.then(data => setPlayerTicket(data))
						.catch(() => toastService('Play ticket kon niet opgehaald worden.', TOAST_TYPE.DANGER));

				if (isVideoFragment(fragment)) {
					initFlowPlayer();
				}

				const contentBlocks: {
					[contentBlockName: string]: {
						type: ContentBlockType;
						content: BlockVideoTitleTextButtonProps | BlockIntroProps;
					};
				} = {
					videoTitleText: {
						type: ContentBlockType.VideoTitleTextButton,
						content: {
							title: getFragmentField(fragment, 'title'),
							text: getFragmentField(fragment, 'description'),
							titleLink: generateContentLinkString(ContentTypeString.video, fragment.external_id),
							videoSource: playerTicket,
						},
					},
					titleText: {
						type: ContentBlockType.Intro,
						content: {
							subtitle: getFragmentField(fragment, 'title'),
							text: getFragmentField(fragment, 'description'),
						},
					},
				};

				const currentContentBlock = isVideoFragment(fragment)
					? contentBlocks.videoTitleText
					: contentBlocks.titleText;

				contentBlockInfos.push({
					blockType: currentContentBlock.type,
					content: currentContentBlock.content,
				});
			});
		}

		const ownerNameAndRole = [
			get(collection, 'owner.first_name', ''),
			get(collection, 'owner.last_name', ''),
			get(collection, 'owner.role.name', ''),
		].join(' ');

		const relatedItemStyle: any = { width: '100%', float: 'left', marginRight: '2%' };

		return (
			<Fragment>
				<Navbar autoHeight background={'alt'}>
					<Container mode="vertical" size="small" background={'alt'}>
						<Container mode="horizontal">
							<Toolbar autoHeight>
								<ToolbarLeft>
									<ToolbarItem>
										<Spacer margin={['top-small', 'bottom-small']}>
											<MetaData spaced={true} category="collection">
												<MetaDataItem>
													<div className="c-content-type c-content-type--collection">
														<Icon name="collection" />
														<p>COLLECTION</p>
													</div>
												</MetaDataItem>
												<MetaDataItem
													icon="eye"
													label={String(188) /* TODO collection.view_count */}
												/>
												<MetaDataItem
													icon="bookmark"
													label={String(12) /* TODO collection.bookmark_count */}
												/>
											</MetaData>
										</Spacer>
										<h1 className="c-h2 u-m-0">{collection.title}</h1>
										{collection.owner && (
											<Flex spaced="regular">
												{!!get(collection, 'owner.id') && (
													<Avatar
														image={get(collection, 'owner.profiles[0].avatar')}
														name={ownerNameAndRole || ' '}
														initials={`${get(collection, 'owner.first_name[0]', '')}${get(
															collection,
															'owner.last_name[0]',
															''
														)}`}
													/>
												)}
											</Flex>
										)}
									</ToolbarItem>
								</ToolbarLeft>
								<ToolbarRight>
									<ToolbarItem>
										<div className="c-button-toolbar">
											<Button
												title="Bladwijzer"
												type="secondary"
												icon="bookmark"
												ariaLabel="Bladwijzer"
											/>
											<Button title="Deel" type="secondary" icon="share-2" ariaLabel="Deel" />
											<ControlledDropdown
												isOpen={isOptionsMenuOpen}
												onOpen={() => setIsOptionsMenuOpen(true)}
												onClose={() => setIsOptionsMenuOpen(false)}
												placement="bottom-end"
												autoSize
											>
												<DropdownButton>
													<Button
														type="secondary"
														icon="more-horizontal"
														ariaLabel="Meer opties"
														title="Meer opties"
													/>
												</DropdownButton>
												<DropdownContent>
													<MenuContent
														menuItems={[
															{ icon: 'edit', id: 'edit', label: 'Bewerk collectie' }, // TODO: Add PermissionGuard
															{ icon: 'play', id: 'play', label: 'Alle items afspelen' },
															{ icon: 'clipboard', id: 'createAssignment', label: 'Maak opdracht' },
															{ icon: 'copy', id: 'duplicate', label: 'Dupliceer' },
															{ icon: 'delete', id: 'delete', label: 'Verwijder' }, // TODO: Add PermissionGuard
														]}
														onClick={itemId => {
															switch (itemId) {
																case 'edit':
																	history.push(
																		`${generateContentLinkString(
																			ContentTypeString.collection,
																			collection.id.toString()
																		)}/${RouteParts.Edit}`
																	);
																	break;

																case 'createAssignment':
																	history.push(
																		generateAssignmentCreateLink(
																			'KIJK',
																			String(collection.id),
																			'COLLECTIE'
																		)
																	);
																	break;

																case 'delete':
																	openDeleteModal(collection.id);
																	break;
																default:
																	return null;
															}
														}}
													/>
												</DropdownContent>
											</ControlledDropdown>
										</div>
									</ToolbarItem>
								</ToolbarRight>
							</Toolbar>
						</Container>
					</Container>
				</Navbar>
				<Container mode="vertical">
					<Container mode="horizontal">
						<ul className="c-collection-list">{renderContentBlocks(contentBlockInfos)}</ul>
					</Container>
				</Container>
				<Container mode="vertical">
					<Container mode="horizontal">
						<h3 className="c-h3">Info over deze collectie</h3>
						<Grid>
							<Column size="3-3">
								<Spacer margin="top">
									<p className="u-text-bold">Onderwijsniveau</p>
									<p className="c-body-1">
										{collection.lom_context && collection.lom_context.length ? (
											(collection.lom_context || []).map((lomContext: string) =>
												generateSearchLinks(String(collection.id), 'educationLevel', lomContext)
											)
										) : (
											<span className="u-d-block">-</span>
										)}
									</p>
								</Spacer>
							</Column>
							<Column size="3-3">
								<Spacer margin="top">
									<p className="u-text-bold">Laatst aangepast</p>
									<p className="c-body-1">{formatDate(collection.updated_at)}</p>
								</Spacer>
							</Column>
							<Column size="3-6">
								<p className="u-text-bold">Ordering</p>
								<p className="c-body-1">Deze collectie is een kopie van TODO add link</p>
								<p className="c-body-1">Deze collectie is deel van een map: TODO add link</p>
							</Column>
							<Column size="3-3">
								<Spacer margin="top">
									<p className="u-text-bold">Vakken</p>
									<p className="c-body-1">
										{collection.lom_classification && collection.lom_classification.length ? (
											(collection.lom_classification || []).map((lomClassification: string) =>
												generateSearchLinks(String(collection.id), 'domain', lomClassification)
											)
										) : (
											<span className="u-d-block">-</span>
										)}
									</p>
								</Spacer>
							</Column>
						</Grid>
						<hr className="c-hr" />
						<h3 className="c-h3" style={{ width: '100%' }}>
							Bekijk ook
						</h3>
						<Grid>
							<Column size="3-6">
								<Container size="small" mode="vertical">
									<ul className="c-media-card-list">
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`/${RouteParts.Collection}/${collection.id}`}
												category="collection"
												orientation="horizontal"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category="collection"
														src={collection.thumbnail_path || undefined}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category="collection">
														{/*TODO resolve org id using graphql query*/}
														<MetaDataItem label={collection.organisation_id || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`/${RouteParts.Collection}/${collection.id}`}
												category="collection"
												orientation="horizontal"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category="collection"
														src={collection.thumbnail_path || undefined}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category="collection">
														{/*TODO resolve org id using graphql query*/}
														<MetaDataItem label={collection.organisation_id || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
									</ul>
								</Container>
							</Column>
							<Column size="3-6">
								<Container size="small" mode="vertical">
									<ul className="c-media-card-list">
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`/${RouteParts.Collection}/${collection.id}`}
												category="collection"
												orientation="horizontal"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category="collection"
														src={collection.thumbnail_path || undefined}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category="collection">
														{/*TODO resolve org id using graphql query*/}
														<MetaDataItem label={collection.organisation_id || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
										<li style={relatedItemStyle}>
											<MediaCard
												title="Organisatie van het politieke veld: Europa"
												href={`/${RouteParts.Collection}/${collection.id}`}
												category="collection"
												orientation="horizontal"
											>
												<MediaCardThumbnail>
													<Thumbnail
														category="collection"
														src={collection.thumbnail_path || undefined}
													/>
												</MediaCardThumbnail>
												<MediaCardMetaData>
													<MetaData category="collection">
														{/*TODO resolve org id using graphql query*/}
														<MetaDataItem label={collection.organisation_id || ''} />
													</MetaData>
												</MediaCardMetaData>
											</MediaCard>
										</li>
									</ul>
								</Container>
							</Column>
						</Grid>
					</Container>
				</Container>

				<DeleteObjectModal
					title={`Ben je zeker dat de collectie "${collection.title}" wil verwijderen?`}
					body="Deze actie kan niet ongedaan gemaakt worden"
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					deleteObjectCallback={deleteCollection}
				/>
			</Fragment>
		);
	};

	return (
		<DataQueryComponent
			query={GET_COLLECTION_BY_ID}
			variables={{ id: collectionId }}
			resultPath="app_collections[0]"
			renderData={renderCollection}
			notFoundMessage="Deze collectie werd niet gevonden"
		/>
	);
};

export default withRouter(Collection);
