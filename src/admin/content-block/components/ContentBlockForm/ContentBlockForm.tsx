import classnames from 'classnames';
import { get, isEqual, isNil } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useTranslation } from 'react-i18next';

import {
	Accordion,
	AccordionActions,
	AccordionBody,
	AccordionTitle,
	BlockHeading,
	Button,
	ButtonGroup,
	ButtonToolbar,
	Flex,
	FlexItem,
	Form,
	Spacer,
	Toolbar,
	ToolbarLeft,
	ToolbarRight,
} from '@viaa/avo2-components';

import { ToastService } from '../../../../shared/services';
import { validateContentBlockField } from '../../../shared/helpers';
import {
	ContentBlockBlockConfig,
	ContentBlockComponentsConfig,
	ContentBlockComponentState,
	ContentBlockConfig,
	ContentBlockErrors,
	ContentBlockState,
	ContentBlockStateType,
	RepeatedContentBlockComponentState,
} from '../../../shared/types';
import ContentBlockFormGroup from '../ContentBlockFormGroup/ContentBlockFormGroup';
import { REPEATABLE_CONTENT_BLOCKS } from '../ContentBlockPreview/ContentBlockPreview.const';

import './ContentBlockForm.scss';

interface ContentBlockFormProps {
	config: ContentBlockConfig;
	blockIndex: number;
	isAccordionOpen: boolean;
	length: number;
	hasSubmitted: boolean;
	onChange: (formGroupType: ContentBlockStateType, input: any, stateIndex?: number) => void;
	onError: (configIndex: number, newErrors: ContentBlockErrors) => void;
	onRemove: (configIndex: number) => void;
	onReorder: (configIndex: number, indexUpdate: number) => void;
	toggleIsAccordionOpen: () => void;
	addComponentToState: () => void;
	removeComponentFromState: (stateIndex: number) => void;
}

const ContentBlockForm: FunctionComponent<ContentBlockFormProps> = ({
	config,
	blockIndex,
	isAccordionOpen,
	length,
	hasSubmitted,
	onChange,
	onError,
	onRemove,
	onReorder,
	toggleIsAccordionOpen,
	addComponentToState,
	removeComponentFromState,
}) => {
	const { components, block } = config;
	const { isArray } = Array;
	const configErrors = config.errors || {};

	// Hooks
	const [t] = useTranslation();

	// Methods
	const handleChange = (
		formGroupType: ContentBlockStateType,
		key: keyof ContentBlockComponentState | keyof ContentBlockState,
		value: any,
		stateIndex?: number
	) => {
		const updateObject = {
			[key]: value,
		};
		const state = formGroupType === 'block' ? block.state : components.state;
		const stateUpdate = isArray(state) ? [updateObject] : { ...state, ...updateObject };

		handleValidation(key, formGroupType, value, stateIndex);
		onChange(formGroupType, stateUpdate, isArray(components.state) ? stateIndex : undefined);
	};

	const handleValidation = (
		fieldKey: keyof ContentBlockComponentState | keyof ContentBlockState,
		formGroupType: ContentBlockStateType,
		updatedFormValue: any,
		stateIndex?: number
	) => {
		const field = config[formGroupType].fields[fieldKey];
		const validator = get(field, 'validator');

		const errors = validateContentBlockField(
			fieldKey,
			validator,
			configErrors,
			updatedFormValue,
			stateIndex
		);

		onError(blockIndex, errors);
	};

	const renderRemoveButton = (stateIndex: number) => {
		const aboveMin =
			isArray(components.state) && components.state.length > get(components, 'limits.min', 1);

		return (
			removeComponentFromState &&
			aboveMin && (
				<FlexItem className="u-flex-align-end" shrink>
					<Button
						icon="delete"
						type="danger"
						onClick={() => removeComponentFromState(stateIndex)}
						size="small"
						title={t(
							'admin/content-block/components/content-block-form/content-block-form___verwijder-sectie'
						)}
						ariaLabel={t(
							'admin/content-block/components/content-block-form/content-block-form___verwijder-sectie'
						)}
					/>
				</FlexItem>
			)
		);
	};

	const renderFormGroups = (
		formGroup: ContentBlockComponentsConfig | ContentBlockBlockConfig,
		formGroupType: ContentBlockStateType
	) => {
		const formGroupOptions = {
			config,
			blockIndex,
			formGroup,
			formGroupType,
			handleChange,
		};

		// Render each state individually in a ContentBlockFormGroup
		return (
			<Spacer margin="top-small">
				{isArray(formGroup.state) ? (
					formGroup.state.map(
						(formGroupState: RepeatedContentBlockComponentState, stateIndex) => (
							<Spacer key={stateIndex} margin="bottom">
								<BlockHeading type="h4" className="u-m-t-0 u-spacer-bottom-s">
									<Toolbar autoHeight>
										<ToolbarLeft>{`${get(config, 'components.name')} ${
											stateIndex + 1
										}`}</ToolbarLeft>
										<ToolbarRight>
											{renderRemoveButton(stateIndex)}
										</ToolbarRight>
									</Toolbar>
								</BlockHeading>
								<Flex spaced="regular" wrap>
									<FlexItem>
										<ContentBlockFormGroup
											key={stateIndex}
											{...formGroupOptions}
											formGroupState={formGroupState}
											stateIndex={stateIndex}
										/>
									</FlexItem>
								</Flex>
							</Spacer>
						)
					)
				) : (
					<ContentBlockFormGroup {...formGroupOptions} formGroupState={formGroup.state} />
				)}
			</Spacer>
		);
	};

	const renderAddButton = (label: string) => (
		<Spacer margin="bottom">
			<Button
				label={t(
					'admin/content-block/components/content-block-form/content-block-form___voeg-label-to',
					{ label }
				)}
				title={t(
					'admin/content-block/components/content-block-form/content-block-form___voeg-sectie-toe'
				)}
				icon="add"
				type="secondary"
				onClick={addComponentToState}
			/>
		</Spacer>
	);

	const renderBlockForm = (contentBlock: ContentBlockConfig) => {
		const accordionTitle = `${contentBlock.name} (${blockIndex + 1}/${length})`;
		const label = get(contentBlock.components, 'name', '').toLowerCase();
		const underLimit =
			isNil(get(components, 'limits.max')) ||
			(isArray(components.state) && components.state.length < get(components, 'limits.max'));

		return (
			<Accordion
				className={classnames('c-content-block-form__accordion', {
					'has-error': hasSubmitted && Object.keys(configErrors).length > 0,
				})}
				isOpen={isAccordionOpen}
				onToggle={toggleIsAccordionOpen}
			>
				<AccordionTitle>{accordionTitle}</AccordionTitle>
				<AccordionActions>
					<ButtonToolbar>
						<ButtonGroup>
							<Button
								disabled={blockIndex === 0}
								icon="chevron-up"
								onClick={() => onReorder(blockIndex, -1)}
								size="small"
								title={t(
									'admin/content-block/components/content-block-form/content-block-form___verplaats-naar-boven'
								)}
								ariaLabel={t(
									'admin/content-block/components/content-block-form/content-block-form___verplaats-naar-boven'
								)}
								type="tertiary"
							/>
							<Button
								disabled={blockIndex + 1 === length}
								icon="chevron-down"
								onClick={() => onReorder(blockIndex, 1)}
								size="small"
								title={t(
									'admin/content-block/components/content-block-form/content-block-form___verplaats-naar-onder'
								)}
								ariaLabel={t(
									'admin/content-block/components/content-block-form/content-block-form___verplaats-naar-onder'
								)}
								type="tertiary"
							/>
						</ButtonGroup>
						<CopyToClipboard
							text={JSON.stringify({ block: config })}
							onCopy={() =>
								ToastService.success(
									t(
										'admin/content-block/components/content-block-form/content-block-form___de-blok-is-naar-je-klembord-gekopieerd-druk-ctrl-v-om-hem-te-plakken'
									)
								)
							}
						>
							<Button
								icon="copy"
								size="small"
								title={t(
									'admin/content-block/components/content-block-form/content-block-form___kopieer-content-blok'
								)}
								ariaLabel={t(
									'admin/content-block/components/content-block-form/content-block-form___kopieer-content-blok'
								)}
								type="secondary"
							/>
						</CopyToClipboard>
						<Button
							icon="delete"
							onClick={() => onRemove(blockIndex)}
							size="small"
							title={t(
								'admin/content-block/components/content-block-form/content-block-form___verwijder-content-block'
							)}
							ariaLabel={t(
								'admin/content-block/components/content-block-form/content-block-form___verwijder-content-block'
							)}
							type="danger"
						/>
					</ButtonToolbar>
				</AccordionActions>
				<AccordionBody>
					{renderFormGroups(components, 'components')}
					{underLimit &&
						REPEATABLE_CONTENT_BLOCKS.includes(config.type) &&
						renderAddButton(label)}
					<Spacer margin="top">
						<BlockHeading type="h4" className="u-m-t-0">
							Blok-opties
						</BlockHeading>
					</Spacer>
					<Spacer margin="bottom-small">{renderFormGroups(block, 'block')}</Spacer>
				</AccordionBody>
			</Accordion>
		);
	};

	return <Form className="c-content-block-form">{renderBlockForm(config)}</Form>;
};

export default React.memo(ContentBlockForm, (prevProps, nextProps) => {
	// We don't need to check the other props because they are functions which will never change
	// The component will rerender when false is returned
	return (
		isEqual(prevProps.config, nextProps.config) &&
		prevProps.isAccordionOpen === nextProps.isAccordionOpen &&
		prevProps.blockIndex === nextProps.blockIndex &&
		prevProps.length === nextProps.length &&
		prevProps.hasSubmitted === nextProps.hasSubmitted
	);
});
