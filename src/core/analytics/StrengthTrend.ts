/**
 * Report, "The recommended algorithms, in one place", item 4: τ ≈ 14–21 days,
 * hold deviations >15%, and re-anchor faster after 3–4 weeks away.
 * Heuristic: τ = 21 normally, 14 after a ≥21-day gap; weekly change uses endpoints
 * in the trailing 28 days and linear percent change per elapsed week.
 */
export const StrengthTrendDefaults = {
  timeConstantDays: 21,
  returnTimeConstantDays: 14,
  breakDays: 21,
  maximumDeviationFraction: 0.15,
  rateWindowDays: 28,
  daysPerWeek: 7,
  millisecondsPerDay: 86_400_000,
  percent: 100,
} as const;

/** A session estimate in kg at an ISO timestamp, with relative effort weight in (0, 1]. */
export interface StrengthObservation {
  readonly date: string;
  readonly e1rmKilograms: number;
  readonly trendWeight: number;
  /** Explicit confirmation bypasses the 15% hold; it never changes the recorded estimate. */
  readonly isConfirmed?: boolean;
}

/** Smoothed kg at a session's ISO timestamp; held observations leave the previous value intact. */
export interface StrengthTrendPoint {
  readonly date: string;
  readonly e1rmKilograms: number;
  readonly isHeld: boolean;
}

/** A strength trend, latest smoothed kg (null without data), and recent percent change per week. */
export interface StrengthTrend {
  readonly trend: readonly StrengthTrendPoint[];
  readonly latest: number | null;
  /** Null without two accepted points at distinct times in the trailing 28 days. */
  readonly changePerWeekPercent: number | null;
}

function weeklyChange(points: readonly StrengthTrendPoint[], now: Date): number | null {
  const defaults = StrengthTrendDefaults;
  const start = now.getTime() - defaults.rateWindowDays * defaults.millisecondsPerDay;
  const recent = points.filter((point) => !point.isHeld && Date.parse(point.date) >= start);
  const first = recent[0];
  const last = recent.at(-1);
  if (first === undefined || last === undefined) return null;
  const days = (Date.parse(last.date) - Date.parse(first.date)) / defaults.millisecondsPerDay;
  if (days <= 0) return null;
  return ((last.e1rmKilograms / first.e1rmKilograms - 1) * defaults.percent * defaults.daysPerWeek) / days;
}

/**
 * EWMA: trend += weight × (1 − exp(−days / τ)) × (session − trend).
 * Report, "The recommended algorithms, in one place", items 1 and 4; multiplying
 * alpha by the effort weight implements the report's lower weight for unknown RIR.
 * The first valid observation seeds the trend. Sorts a copy; future/invalid data
 * is skipped. Unconfirmed deviations >15% are held even after a break, without
 * advancing the last accepted time. No observations are invented during inactivity.
 */
export function strengthTrend(observations: readonly StrengthObservation[], now: Date): StrengthTrend {
  const defaults = StrengthTrendDefaults;
  // Filter before sorting: NaN dates would make the comparator non-transitive.
  const sorted = observations
    .filter((observation) => {
      const time = Date.parse(observation.date);
      return (
        Number.isFinite(time) &&
        time <= now.getTime() &&
        Number.isFinite(observation.e1rmKilograms) &&
        observation.e1rmKilograms > 0 &&
        Number.isFinite(observation.trendWeight) &&
        observation.trendWeight > 0 &&
        observation.trendWeight <= 1
      );
    })
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
  const trend: StrengthTrendPoint[] = [];
  let latest: number | null = null;
  let acceptedTime: number | null = null;
  for (const observation of sorted) {
    const time = Date.parse(observation.date);
    const isHeld =
      latest !== null &&
      observation.isConfirmed !== true &&
      Math.abs(observation.e1rmKilograms - latest) / latest > defaults.maximumDeviationFraction;
    if (!isHeld) {
      if (latest === null || acceptedTime === null) {
        latest = observation.e1rmKilograms;
      } else {
        const days = (time - acceptedTime) / defaults.millisecondsPerDay;
        const timeConstant = days >= defaults.breakDays ? defaults.returnTimeConstantDays : defaults.timeConstantDays;
        const alpha = -Math.expm1(-days / timeConstant) * observation.trendWeight;
        latest += alpha * (observation.e1rmKilograms - latest);
      }
      acceptedTime = time;
    }
    if (latest !== null) trend.push({ date: observation.date, e1rmKilograms: latest, isHeld });
  }
  return { trend, latest, changePerWeekPercent: weeklyChange(trend, now) };
}
