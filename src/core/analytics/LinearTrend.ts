import type { DatedValue } from './TimeBuckets';

/** Heuristic: ordinary least squares requested by the owner (T-083); three observations avoid a misleading two-point trend. */
const policy = Object.freeze({ millisecondsPerDay: 86_400_000, minimumPoints: 3 });

/** Straight trend in caller units: value = intercept + slopePerDay × days since origin; null/nonfinite values are ignored. */
export interface LinearTrendResult {
  readonly origin: string;
  readonly slopePerDay: number;
  readonly intercept: number;
}

/**
 * Heuristic: ordinary least squares, slope = Σ((day − meanDay)(value − meanValue)) / Σ(day − meanDay)².
 * The owner requested a regression line (T-083), not a training model. Origin is the earliest valid date,
 * avoiding epoch-sized cancellation; returns null with fewer than three finite values or no time variance.
 * Callers exclude deloads before fitting. Slope is caller units per elapsed 24-hour day.
 */
export function LinearTrend(
  points: readonly { readonly date: string; readonly value: number | null }[],
): LinearTrendResult | null {
  const valid: DatedValue[] = points.flatMap((point) =>
    point.value !== null && Number.isFinite(point.value) && Number.isFinite(Date.parse(point.date))
      ? [{ date: point.date, value: point.value }]
      : [],
  );
  if (valid.length < policy.minimumPoints) return null;
  const origin = valid.reduce((minimum, point) => Math.min(minimum, Date.parse(point.date)), Infinity);
  const days = valid.map((point) => (Date.parse(point.date) - origin) / policy.millisecondsPerDay);
  const meanDay = days.reduce((sum, day) => sum + day / valid.length, 0);
  const meanValue = valid.reduce((sum, point) => sum + point.value / valid.length, 0);
  let covariance = 0;
  let variance = 0;
  valid.forEach((point, index) => {
    const day = days[index];
    if (day === undefined) return;
    covariance += (day - meanDay) * (point.value - meanValue);
    variance += (day - meanDay) ** 2;
  });
  if (variance === 0) return null;
  const slopePerDay = covariance / variance;
  const intercept = meanValue - slopePerDay * meanDay;
  if (!Number.isFinite(slopePerDay) || !Number.isFinite(intercept)) return null;
  return { origin: new Date(origin).toISOString(), slopePerDay, intercept };
}
