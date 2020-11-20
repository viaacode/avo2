import sanitizePresets, { SanitizePreset } from './presets';

const sanitize = require('sanitize-html');

const sanitizeHtml = (input: string, preset: SanitizePreset) =>
	sanitize(input, sanitizePresets[preset] || sanitizePresets['basic']);

export { sanitizeHtml, sanitizePresets };
