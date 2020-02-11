import { get } from 'lodash-es';
import React, { FunctionComponent } from 'react';

import { SelectOption } from '@viaa/avo2-components';

import { createKey } from '../../../shared/helpers';
import { EDITOR_TYPES_MAP } from '../../content-block.const';
import {
	ContentBlockComponentState,
	ContentBlockEditor,
	ContentBlockField,
	ContentBlockMeta,
	ContentBlockState,
	ContentBlockStateType,
} from '../../content-block.types';

interface ContentBlockFieldProps {
	block: ContentBlockMeta; // Block metadata
	fieldKey: keyof ContentBlockComponentState | keyof ContentBlockState;
	field: ContentBlockField; // Field options
	type: ContentBlockStateType; // State type
	state: ContentBlockComponentState | ContentBlockState; // State object (within state array).
	formGroupIndex?: number; // Index of form group.
	stateIndex?: number; // Index of state object (within state array).
	handleChange: (
		formGroupType: ContentBlockStateType,
		fieldKey: keyof ContentBlockComponentState | keyof ContentBlockState,
		value: any,
		stateIndex?: number
	) => void;
}

export const ContentBlockFieldEditor: FunctionComponent<ContentBlockFieldProps> = ({
	block,
	fieldKey,
	formGroupIndex,
	field,
	type,
	state,
	stateIndex,
	handleChange,
}) => {
	const { index } = block;
	const EditorComponent = EDITOR_TYPES_MAP[field.editorType];
	const editorId = createKey('editor', index, formGroupIndex, stateIndex);
	const defaultProps = {
		...field.editorProps,
		editorId,
		name: editorId,
	};
	let editorProps = {};

	switch (field.editorType) {
		case ContentBlockEditor.IconPicker:
		case ContentBlockEditor.ColorSelect:
			editorProps = {
				onChange: (option: SelectOption) =>
					handleChange(type, fieldKey, get(option, 'value', ''), stateIndex),
				value: defaultProps.options.find(
					(opt: SelectOption) => opt.value === (state as any)[fieldKey]
				),
			};
			break;
		case ContentBlockEditor.WYSIWYG:
			editorProps = {
				id: editorId,
				data: (state as any)[fieldKey],
				onChange: (value: any) => handleChange(type, fieldKey, value, stateIndex),
			};
			break;
		case ContentBlockEditor.FileUpload:
			const value = (state as any)[fieldKey];
			editorProps = {
				onChange: (value: any) => handleChange(type, fieldKey, value, stateIndex),
				urls: Array.isArray(value) ? value : [value],
			};
			break;
		default:
			editorProps = {
				onChange: (value: any) => handleChange(type, fieldKey, value, stateIndex),
				value: (state as any)[fieldKey],
			};
			break;
	}

	return <EditorComponent {...defaultProps} {...editorProps} />;
};
