/** SI conversion for chart/table duration labels; display rounding only, never stored. */
const timing = Object.freeze({ secondsPerMinute: 60 });

/** Rounded elapsed minutes; absent timing stays explicit rather than becoming zero. */
export function sessionDurationText(seconds: number | null): string {
  return seconds === null ? 'Duration unknown' : `${Math.round(seconds / timing.secondsPerMinute)} min`;
}
