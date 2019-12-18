import { get } from 'lodash-es';
import React, { FunctionComponent, useState } from 'react';

import { Accordion, Form, FormGroup, SelectOption } from '@viaa/avo2-components';

import { ValueOf } from '../../../../shared/types';

import { EDITOR_TYPES_MAP } from '../../content-block.const';
import {
	ContentBlockConfig,
	ContentBlockEditor,
	ContentBlockField,
	ContentBlockFormStates,
} from '../../content-block.types';

import './ContentBlockForm.scss';

interface ContentBlockFormProps {
	config: ContentBlockConfig;
	index: number;
	isAccordionOpen: boolean;
	length: number;
	onChange: (
		formState: Partial<ContentBlockFormStates> | Partial<ContentBlockFormStates>[]
	) => void;
	setIsAccordionOpen: () => void;
}

const ContentBlockForm: FunctionComponent<ContentBlockFormProps> = ({
	config,
	index,
	isAccordionOpen,
	length,
	onChange,
	setIsAccordionOpen,
}) => {
	const { formState } = config;

	// Hooks
	const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});

	// Methods
	const handleChange = (key: keyof ContentBlockFormStates, value: any) => {
		// Get value from select option otherwise fallback to original
		const parsedValue = get(value, 'value', value);
		const updatedFormSet = { [key]: parsedValue };

		handleValidation(key, parsedValue);
		onChange(updatedFormSet);
	};

	const handleValidation = (
		fieldKey: keyof ContentBlockFormStates,
		updatedFormValue: Partial<ValueOf<ContentBlockFormStates>>
	) => {
		const errors: any = {};

		const field = config.fields[fieldKey];
		const validator = get(field, 'validator');

		if (validator) {
			const errorArray = validator(updatedFormValue);

			if (errorArray.length) {
				errors[fieldKey] = errorArray;
			}
		}

		setFormErrors(errors);
	};

	// Render
	const renderFieldEditor = (fieldKey: keyof ContentBlockFormStates, cb: ContentBlockField) => {
		if (Array.isArray(formState)) {
			// Replace this with logic for arrays
			return;
		}

		const EditorComponent = EDITOR_TYPES_MAP[cb.editorType];
		const editorId = `${index}-${formState.blockType}-${fieldKey}`;
		const defaultProps = {
			...cb.editorProps,
			id: editorId,
			name: editorId,
		};
		let editorProps = {};

		switch (cb.editorType) {
			case ContentBlockEditor.ColorSelect:
				editorProps = {
					onChange: (option: SelectOption) => handleChange(fieldKey, get(option, 'value', '')),
					value: defaultProps.options.find(
						(opt: SelectOption) => opt.value === formState.backgroundColor
					),
				};
				break;
			case ContentBlockEditor.WYSIWYG:
				editorProps = {
					data: formState[fieldKey],
					onChange: (value: any) => handleChange(fieldKey, value),
				};
				break;
			default:
				editorProps = {
					onChange: (value: any) => handleChange(fieldKey, value),
					value: formState[fieldKey],
				};
				break;
		}

		// return (
		// 	<EditorComponent
		// 		{...cb.editorProps}
		// 		name={fieldKey}
		// 		onChange={(value: any) => handleChange(fieldKey, value)}
		// 		value={state[fieldKey as keyof ContentBlockFormStates]}
		// 	/>
		// );

		return <EditorComponent {...defaultProps} {...editorProps} />;
	};

	// const renderFormGroups = (cb: ContentBlockConfig) => (
	// 	<>
	// 		<Heading type="h4">
	// 			{cb.name}{' '}
	// 			<span className="u-text-muted">
	// 				({index}/{length})
	// 			</span>
	// 		</Heading>
	// 		{Array.isArray(formState)
	// 			? formState.map(singleFormState =>
	// 					Object.keys(cb.fields).map((key: string) => (
	// 						<FormGroup
	// 							key={`${index}-${cb.name}-${key}`}
	// 							label={cb.fields[key].label}
	// 							error={formErrors[key]}
	// 						>
	// 							{renderFieldEditor(key, cb.fields[key], singleFormState)}
	// 						</FormGroup>
	// 					))
	// 			  )
	// 			: Object.keys(cb.fields).map((key: string) => (
	// 					<FormGroup
	// 						key={`${index}-${cb.name}-${key}`}
	// 						label={cb.fields[key].label}
	// 						error={formErrors[key]}
	// 					>
	// 						{renderFieldEditor(key, cb.fields[key], formState)}
	// 					</FormGroup>
	// 			  ))}
	// 		{Array.isArray(formState) && <Button icon="add" type="secondary" onClick={() => {}} />}
	// 	</>
	// );
	const renderFormGroups = (cb: ContentBlockConfig) => {
		return (
			<Accordion
				title={`${cb.name} (${index}/${length})`}
				isOpen={isAccordionOpen}
				onToggle={setIsAccordionOpen}
			>
				{Object.keys(cb.fields).map((key: string) => (
					<FormGroup
						key={`${index}-${cb.name}-${key}`}
						label={cb.fields[key].label}
						error={formErrors[key as keyof ContentBlockFormStates]}
					>
						{renderFieldEditor(key as keyof ContentBlockFormStates, cb.fields[key])}
					</FormGroup>
				))}
			</Accordion>
		);
	};

	return <Form className="c-content-block-form">{renderFormGroups(config)}</Form>;
};

export default ContentBlockForm;
