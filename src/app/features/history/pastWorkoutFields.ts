/** ISO 8601 time units; minute precision matches the native date/time input. */
const TIME_UNITS = { millisecondsPerMinute: 60_000, secondsPerMinute: 60, padWidth: 2 } as const;

/** Local calendar fields for datetime-local; avoids presenting UTC as the phone's local time. */
export function localWorkoutStart(timestamp: string): string {
  const date = new Date(timestamp);
  const padded = (value: number) => String(value).padStart(TIME_UNITS.padWidth, '0');
  return `${date.getFullYear()}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}T${padded(date.getHours())}:${padded(date.getMinutes())}`;
}

/** Rounded elapsed minutes as an editable number; an unknown imported end stays blank. */
export function workoutDurationMinutes(startedAt: string, endedAt: string | null): string {
  return endedAt === null
    ? ''
    : String(Math.max(1, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / TIME_UNITS.millisecondsPerMinute)));
}

/** Minutes typed into the duration field, converted to seconds; blank preserves an unknown end. Core validates numbers. */
export function durationSecondsFromMinutes(value: string): number | null {
  return value.trim() === '' ? null : Number(value) * TIME_UNITS.secondsPerMinute;
}

/** Convert an edited duration only when its displayed value changed; undefined preserves the original seconds. */
export function changedDurationSeconds(
  value: string,
  startedAt: string,
  endedAt: string | null,
): number | null | undefined {
  return value === workoutDurationMinutes(startedAt, endedAt) ? undefined : durationSecondsFromMinutes(value);
}
