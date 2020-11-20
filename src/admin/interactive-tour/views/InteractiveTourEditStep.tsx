import { get, isEqual } from 'lodash-es';
import React, { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Button,
	Form,
	FormGroup,
	Icon,
	IconName,
	Panel,
	PanelBody,
	PanelHeader,
	Spacer,
	TextInput,
	Toolbar,
	ToolbarItem,
	ToolbarLeft,
	ToolbarRight,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@viaa/avo2-components';

import Html from '../../../shared/components/Html/Html';
import WYSIWYGWrapper from '../../../shared/components/WYSIWYGWrapper/WYSIWYGWrapper';
import { WYSIWYG_OPTIONS_FULL } from '../../../shared/constants';
import { sanitizeHtml, stripHtml } from '../../../shared/helpers';
import { InteractiveTourAction } from '../helpers/reducers';
import { EditableStep, InteractiveTourEditActionType } from '../interactive-tour.types';

import './InteractiveTourEdit.scss';

export interface InteractiveTourEditStepProps {
	step: EditableStep;
	index: number;
	numberOfSteps: number;
	stepErrors: { title?: string; content?: string };
	changeInteractiveTourState: (action: InteractiveTourAction) => void;
}

const InteractiveTourEditStep: FunctionComponent<InteractiveTourEditStepProps> = ({
	step,
	index,
	numberOfSteps,
	stepErrors,
	changeInteractiveTourState,
}) => {
	const [t] = useTranslation();

	const renderReorderButton = (index: number, direction: 'up' | 'down', disabled: boolean) => (
		<Button
			type="secondary"
			icon={`chevron-${direction}` as IconName}
			title={
				direction === 'up'
					? t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-boven')
					: t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-onder')
			}
			ariaLabel={
				direction === 'up'
					? t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-boven')
					: t('admin/interactive-tour/views/interactive-tour-edit___verplaats-naar-onder')
			}
			onClick={() => {
				changeInteractiveTourState({
					direction,
					index,
					type: InteractiveTourEditActionType.SWAP_STEPS,
				});
			}}
			disabled={disabled}
		/>
	);

	if (!step) {
		return null;
	}

	return (
		<Panel>
			<PanelHeader>
				<Toolbar>
					<ToolbarLeft>
						<ToolbarItem>
							<div className="c-button-toolbar">
								{renderReorderButton(index, 'up', index === 0)}
								{renderReorderButton(index, 'down', index === numberOfSteps - 1)}
							</div>
						</ToolbarItem>
					</ToolbarLeft>
					<ToolbarRight>
						<ToolbarItem>
							<Button
								icon="trash-2"
								type="danger"
								onClick={() => {
									changeInteractiveTourState({
										index,
										type: InteractiveTourEditActionType.REMOVE_STEP,
									});
								}}
								ariaLabel={t(
									'admin/interactive-tour/views/interactive-tour-edit___verwijder-stap'
								)}
								title={t(
									'admin/interactive-tour/views/interactive-tour-edit___verwijder-stap'
								)}
							/>
						</ToolbarItem>
					</ToolbarRight>
				</Toolbar>
			</PanelHeader>
			<PanelBody>
				<Form>
					<FormGroup
						label={t('admin/interactive-tour/views/interactive-tour-edit___titel')}
						error={get(stepErrors, 'title')}
					>
						<TextInput
							value={(step.title || '').toString()}
							onChange={(newTitle) => {
								changeInteractiveTourState({
									type: InteractiveTourEditActionType.UPDATE_STEP_PROP,
									stepIndex: index,
									stepProp: 'title',
									stepPropValue: newTitle,
								});
							}}
						/>
						<Spacer margin="top-small">{step.title.length} / 28</Spacer>
					</FormGroup>
					<FormGroup
						label={t('admin/interactive-tour/views/interactive-tour-edit___tekst')}
						error={get(stepErrors, 'content')}
					>
						<WYSIWYGWrapper
							initialHtml={(step.content || '').toString()}
							state={step.contentState}
							onChange={(newContentState) => {
								if (!isEqual(newContentState, step.contentState)) {
									changeInteractiveTourState({
										type: InteractiveTourEditActionType.UPDATE_STEP_PROP,
										stepIndex: index,
										stepProp: 'contentState',
										stepPropValue: newContentState,
									});
								}
							}}
							controls={WYSIWYG_OPTIONS_FULL}
							fileType="INTERACTIVE_TOUR_IMAGE"
							id={`content_editor_${index}`}
							placeholder={t(
								'admin/interactive-tour/views/interactive-tour-edit___vul-een-stap-tekst-in'
							)}
						/>
						<Spacer margin="top-small">
							{
								(step.contentState
									? stripHtml(sanitizeHtml(step.contentState.toHTML(), 'link'))
									: step.content || ''
								).length
							}{' '}
							/ 200
						</Spacer>
					</FormGroup>

					<FormGroup
						label={t(
							'admin/interactive-tour/views/interactive-tour-edit___element-css-selector'
						)}
					>
						<TextInput
							value={(step.target || '').toString()}
							onChange={(newTarget) => {
								changeInteractiveTourState({
									type: InteractiveTourEditActionType.UPDATE_STEP_PROP,
									stepIndex: index,
									stepProp: 'target',
									stepPropValue: newTarget,
								});
							}}
							className="c-text-input__selector"
						/>
						<Tooltip position="top">
							<TooltipTrigger>
								<span>
									<Icon className="a-info-icon" name="info" size="small" />
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<Spacer padding="small">
									<Html
										content={t(
											'admin/interactive-tour/views/interactive-tour-edit___hoe-kopieer-je-een-css-selector'
										)}
										type="div"
									/>
								</Spacer>
							</TooltipContent>
						</Tooltip>
					</FormGroup>
				</Form>
			</PanelBody>
		</Panel>
	);
};

export default React.memo(InteractiveTourEditStep);
