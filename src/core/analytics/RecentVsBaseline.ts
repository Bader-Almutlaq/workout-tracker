/** One daily total or weekly total, in the metric's units, dated YYYY-MM-DD (weekly dates share a weekday). */
export interface SeriesPoint {
  readonly date: string;
  readonly value: number;
}

/** Descriptive distance from the baseline, using DESIGN.md's inclusive ±10% neutral band. */
export type BaselineClassification = 'below' | 'within' | 'above';

/**
 * Heuristic: 7 recent periods versus 28 baseline periods is the signature-chart default in
 * DESIGN.md. Its ±10% colour band is a display convention, not a physiological threshold.
 * Calendar days are indexed at UTC midnight only to avoid DST arithmetic on date-only labels.
 */
export const RecentVsBaselinePolicy = Object.freeze({
  recentPeriods: 7,
  baselinePeriods: 28,
  neutralPercent: 10,
  percentScale: 100,
  daysPerWeek: 7,
  millisecondsPerDay: 86_400_000,
});

/** Window lengths in whole periods; daily is the default, weekly periods are seven civil dates apart. */
export interface RecentVsBaselineOptions {
  readonly cadence?: 'daily' | 'weekly';
  readonly recentPeriods?: number;
  readonly baselinePeriods?: number;
}

/** A chart point; unavailable windows or undefined percentage comparisons use null, never Infinity. */
export interface RecentVsBaselinePoint {
  readonly date: string;
  readonly recent: number | null;
  /** Baseline average per period × recentPeriods, in the same units as recent. */
  readonly baseline: number | null;
  readonly percentDifference: number | null;
  readonly classification: BaselineClassification | null;
}

/** Selected observations in chronological order; change is absolute end − start in the metric's units. */
export interface RangeStatistics {
  readonly start: number | null;
  readonly end: number | null;
  readonly change: number | null;
  readonly mean: number | null;
  readonly min: number | null;
  readonly max: number | null;
  readonly count: number;
  readonly total: number;
}

/** Invalid dates, duplicate periods, nonfinite observations, or invalid window lengths. */
export class RecentVsBaselineError extends Error {
  readonly kind = 'invalidInput';

  /** A readable description of the invalid series or window. */
  constructor(message: string) {
    super(message);
    this.name = 'RecentVsBaselineError';
  }
}

function dayIndex(date: string): number {
  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== date
  ) {
    throw new RecentVsBaselineError('Use a valid calendar date in YYYY-MM-DD format.');
  }
  return timestamp / RecentVsBaselinePolicy.millisecondsPerDay;
}

function orderedSeries(series: readonly SeriesPoint[]): (SeriesPoint & { day: number })[] {
  const ordered = series
    .map((point) => {
      if (!Number.isFinite(point.value)) throw new RecentVsBaselineError('Every series value must be a finite number.');
      return { ...point, day: dayIndex(point.date) };
    })
    .sort((left, right) => left.day - right.day);
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index]?.day === ordered[index - 1]?.day)
      throw new RecentVsBaselineError('Each calendar period must have only one value.');
  }
  return ordered;
}

function windowLength(periods: number): number {
  if (!Number.isSafeInteger(periods) || periods <= 0)
    throw new RecentVsBaselineError('Window lengths must be positive whole numbers.');
  return periods;
}

function percentDifference(recent: number | null, baseline: number | null): number | null {
  if (recent === null || baseline === null) return null;
  if (baseline === 0) return recent === 0 ? 0 : null;
  return ((recent - baseline) / Math.abs(baseline)) * RecentVsBaselinePolicy.percentScale;
}

function classification(difference: number | null): BaselineClassification | null {
  if (difference === null) return null;
  // Decimal period totals can put an exact 10% boundary a few machine epsilons outside it.
  const tolerance = Number.EPSILON * RecentVsBaselinePolicy.percentScale;
  if (difference < -RecentVsBaselinePolicy.neutralPercent - tolerance) return 'below';
  if (difference > RecentVsBaselinePolicy.neutralPercent + tolerance) return 'above';
  return 'within';
}

/**
 * Trailing recent sum and trailing baseline sum / baselinePeriods × recentPeriods, both including
 * the point's period. Percentage = (recent − baseline) / |baseline| × 100. Heuristic: these rolling
 * windows and the inclusive ±10% band implement DESIGN.md, "Signature chart: recent vs baseline";
 * they have no physiological claim. The report's "Time scales" motivates daily/weekly rollups.
 *
 * Inputs are period totals, not irregular measurements: missing interior periods count as zero.
 * The earliest supplied period starts coverage; a window stays null until that many calendar
 * periods have elapsed. Include explicit leading zeros if tracking began before the first workout.
 * The baseline overlaps the recent window. Output is chronological, at supplied dates only.
 * Both-zero compares as 0%/within; a nonzero recent against zero baseline is undefined/null.
 * Negative totals use |baseline| so an increase still has a positive sign. Inputs are not mutated.
 */
export function recentVsBaseline(
  series: readonly SeriesPoint[],
  options: RecentVsBaselineOptions = {},
): RecentVsBaselinePoint[] {
  const recentPeriods = windowLength(options.recentPeriods ?? RecentVsBaselinePolicy.recentPeriods);
  const baselinePeriods = windowLength(options.baselinePeriods ?? RecentVsBaselinePolicy.baselinePeriods);
  const step = options.cadence === 'weekly' ? RecentVsBaselinePolicy.daysPerWeek : 1;
  const ordered = orderedSeries(series);
  const first = ordered[0];
  if (first === undefined) return [];
  let recentStart = 0;
  let baselineStart = 0;
  let recentSum = 0;
  let baselineSum = 0;
  let recentNonzeroCount = 0;
  let baselineNonzeroCount = 0;
  return ordered.map((point) => {
    if ((point.day - first.day) % step !== 0)
      throw new RecentVsBaselineError('Weekly dates must fall on the same weekday.');
    recentSum += point.value;
    baselineSum += point.value;
    if (point.value !== 0) {
      recentNonzeroCount += 1;
      baselineNonzeroCount += 1;
    }
    while ((ordered[recentStart]?.day ?? point.day) < point.day - (recentPeriods - 1) * step) {
      const expiredValue = ordered[recentStart]?.value ?? 0;
      recentSum -= expiredValue;
      if (expiredValue !== 0) recentNonzeroCount -= 1;
      recentStart += 1;
    }
    while ((ordered[baselineStart]?.day ?? point.day) < point.day - (baselinePeriods - 1) * step) {
      const expiredValue = ordered[baselineStart]?.value ?? 0;
      baselineSum -= expiredValue;
      if (expiredValue !== 0) baselineNonzeroCount -= 1;
      baselineStart += 1;
    }
    // Re-anchor empty windows: subtraction of old fractional totals must not invent residual volume.
    if (recentNonzeroCount === 0) recentSum = 0;
    if (baselineNonzeroCount === 0) baselineSum = 0;
    const elapsedPeriods = (point.day - first.day) / step + 1;
    const recent = elapsedPeriods >= recentPeriods ? recentSum : null;
    const baseline = elapsedPeriods >= baselinePeriods ? (baselineSum / baselinePeriods) * recentPeriods : null;
    const difference = percentDifference(recent, baseline);
    return {
      date: point.date,
      recent,
      baseline,
      percentDifference: difference,
      classification: classification(difference),
    };
  });
}

/**
 * Inclusive date-range statistics over supplied observations only, not zero-filled calendar gaps.
 * Heuristic: start/end are the first/last observed values; change = end − start, mean = Σ values / n.
 * Implements DESIGN.md's selected-range readout. Empty/reversed selections return count/total 0
 * and null for other fields; a singleton has change 0. Sorting leaves the input unchanged.
 */
export function rangeStatistics(series: readonly SeriesPoint[], from: string, to: string): RangeStatistics {
  const firstDay = dayIndex(from);
  const lastDay = dayIndex(to);
  const selected = orderedSeries(series).filter((point) => point.day >= firstDay && point.day <= lastDay);
  const start = selected[0]?.value ?? null;
  const end = selected.at(-1)?.value ?? null;
  const total = selected.reduce((sum, point) => sum + point.value, 0);
  return {
    start,
    end,
    change: start === null || end === null ? null : end - start,
    mean: selected.length === 0 ? null : total / selected.length,
    min: selected.reduce<number | null>(
      (minimum, point) => (minimum === null ? point.value : Math.min(minimum, point.value)),
      null,
    ),
    max: selected.reduce<number | null>(
      (maximum, point) => (maximum === null ? point.value : Math.max(maximum, point.value)),
      null,
    ),
    count: selected.length,
    total,
  };
}
