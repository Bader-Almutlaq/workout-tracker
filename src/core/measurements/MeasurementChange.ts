import type { BodyMeasurement } from '../models/BodyMeasurement';
import type { MeasurementState } from './MeasurementSite';

/** Heuristic: fixed elapsed weeks and a mean Gregorian month (365.2425 / 12 days) make rates comparable. */
export const MeasurementChangePolicy = Object.freeze({
  millisecondsPerDay: 86_400_000,
  daysPerWeek: 7,
  shortWeeks: 4,
  longWeeks: 12,
  daysPerMonth: 365.2425 / 12,
});

/** Changes in stored cm/kg; null means there is no qualifying comparison. */
export interface MeasurementChange {
  readonly latest: BodyMeasurement | null;
  readonly sinceFirst: number | null;
  readonly fourWeeks: number | null;
  readonly twelveWeeks: number | null;
  readonly perMonth: number | null;
  readonly first: BodyMeasurement | null;
  readonly fourWeeksReference: BodyMeasurement | null;
  readonly twelveWeeksReference: BodyMeasurement | null;
}

/**
 * Computes one state's changes, anchored at its latest entry (not today's date).
 * Delta = latest minus newest observation on/before latest minus 4/12 elapsed weeks.
 * Heuristic: least-squares slope = sum((t-mean(t))*(v-mean(v))) / sum((t-mean(t))²),
 * in the inclusive last 12 weeks, multiplied by mean days/month. Describes recorded change,
 * not an expected growth rate. Fewer than two distinct timestamps gives a null rate.
 */
export function measurementChange(entries: readonly BodyMeasurement[], state: MeasurementState): MeasurementChange {
  const series = entries
    .filter((entry) => entry.state === state)
    .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt));
  const latest = series.at(-1) ?? null;
  const first = series[0];
  const empty = {
    latest,
    first: first ?? null,
    sinceFirst: null,
    fourWeeks: null,
    twelveWeeks: null,
    perMonth: null,
    fourWeeksReference: null,
    twelveWeeksReference: null,
  };
  if (latest === null || first === undefined || series.length < 2) return empty;
  const policy = MeasurementChangePolicy;
  const latestTime = Date.parse(latest.takenAt);
  const cutoff = (weeks: number) => latestTime - weeks * policy.daysPerWeek * policy.millisecondsPerDay;
  const reference = (weeks: number) =>
    series.filter((entry) => Date.parse(entry.takenAt) <= cutoff(weeks)).at(-1) ?? null;
  const fourWeeksReference = reference(policy.shortWeeks);
  const twelveWeeksReference = reference(policy.longWeeks);
  const window = series.filter((entry) => Date.parse(entry.takenAt) >= cutoff(policy.longWeeks));
  const times = window.map((entry) => (Date.parse(entry.takenAt) - latestTime) / policy.millisecondsPerDay);
  const meanTime = times.reduce((sum, time) => sum + time, 0) / window.length;
  const meanValue = window.reduce((sum, entry) => sum + entry.value, 0) / window.length;
  let numerator = 0;
  let denominator = 0;
  window.forEach((entry, index) => {
    const offset = (times[index] ?? 0) - meanTime;
    numerator += offset * (entry.value - meanValue);
    denominator += offset * offset;
  });
  return {
    latest,
    first,
    fourWeeksReference,
    twelveWeeksReference,
    sinceFirst: latest.value - first.value,
    fourWeeks: fourWeeksReference === null ? null : latest.value - fourWeeksReference.value,
    twelveWeeks: twelveWeeksReference === null ? null : latest.value - twelveWeeksReference.value,
    perMonth: denominator === 0 ? null : (numerator / denominator) * policy.daysPerMonth,
  };
}
