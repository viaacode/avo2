import { Select, TextInput } from '@viaa/avo2-components';

import { AlignSelect, ColorSelect } from './components';
import { Aligns, ContentBlockBackgroundColor, HeadingLevels } from './content-block.types';

export const BACKGROUND_COLOR_OPTIONS: { label: string; value: ContentBlockBackgroundColor }[] = [
	{ label: 'Wit', value: ContentBlockBackgroundColor.White },
	{ label: 'Grijs', value: ContentBlockBackgroundColor.Gray50 },
	{ label: 'Groen', value: ContentBlockBackgroundColor.OceanGreen },
	{ label: 'Lichtblauw', value: ContentBlockBackgroundColor.SoftBlue },
	{ label: 'Blauw', value: ContentBlockBackgroundColor.TealBright },
];

export const EDITOR_TYPES_MAP = {
	AlignSelect,
	ColorSelect,
	Select,
	TextInput,
};

// Heading
export const HEADING_ALIGN_OPTIONS: { label: string; value: Aligns }[] = [
	{ label: 'Links', value: 'left' },
	{ label: 'Gecentreerd', value: 'center' },
	{ label: 'Rechts', value: 'right' },
];
export const HEADING_LEVEL_OPTIONS: { label: string; value: HeadingLevels }[] = [
	{ label: 'H1', value: 'h1' },
	{ label: 'H2', value: 'h2' },
	{ label: 'H3', value: 'h3' },
	{ label: 'H4', value: 'h4' },
];
