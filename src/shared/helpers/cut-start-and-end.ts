import { clamp } from 'lodash-es';

export function getValidStartAndEnd(
	start: number | null | undefined,
	end: number | null | undefined,
	duration: number | null | undefined
): [number, number] {
	const minTime = 0;
	const maxTime: number = duration || 0;

	const clampDuration = (duration: number): number => {
		return clamp(duration, minTime, maxTime);
	};
	const validStart = clampDuration(Math.min(start || 0, end || maxTime || start || 0));
	const validEnd = clampDuration(Math.max(start || 0, end || maxTime || start || 0));

	return [validStart, validEnd];
}
