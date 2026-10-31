/** SI conversion for chart/table duration labels; display rounding only, never stored. */
const timing = Object.freeze({ secondsPerMinute: 60, minutesPerHour: 60 });

/** Rounded elapsed minutes; absent timing stays explicit rather than becoming zero. */
export function sessionDurationText(seconds: number | null): string {
  return seconds === null ? 'Duration unknown' : `${Math.round(seconds / timing.secondsPerMinute)} min`;
}

/** Compact duration axis label rounded to whole minutes: "45m", "1h", "1h 10m". */
export function sessionDurationTick(seconds: number): string {
  const minutes = Math.round(seconds / timing.secondsPerMinute);
  if (Math.abs(minutes) < timing.minutesPerHour) return `${minutes}m`;
  const hours = Math.trunc(minutes / timing.minutesPerHour);
  const rest = Math.abs(minutes % timing.minutesPerHour);
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
