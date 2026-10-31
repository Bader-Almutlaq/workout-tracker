/** A dated observation in the caller's units. Invalid dates and non-finite values are ignored. */
export interface DatedValue {
  readonly date: string;
  readonly value: number;
}

/** Local calendar periods (the phone's time zone, like the rest of the app); weeks begin on ISO Monday, including across year and DST boundaries. */
export type TimeBucketSize = 'day' | 'week' | 'month';

/** Sum, mean, largest value, or chronologically last value (input order breaks timestamp ties). */
export type TimeAggregation = 'mean' | 'max' | 'last' | 'sum';

/** One populated calendar bucket, retaining the original spread in the caller's units. */
export interface TimeBucket {
  readonly start: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly count: number;
}

/** Chart range in calendar months, anchored to the latest observation rather than today. */
export type TimeRange = 3 | 6 | 12 | 'all';

/** Heuristic: daily detail through about 3 months, weekly through 2 years, monthly thereafter keeps phone plots readable. */
const policy = Object.freeze({ millisecondsPerDay: 86_400_000, dailyDays: 92, weeklyDays: 730, daysPerWeek: 7 });

function valid(point: DatedValue): boolean {
  return Number.isFinite(Date.parse(point.date)) && Number.isFinite(point.value);
}

function startOfBucket(iso: string, size: TimeBucketSize): string {
  const date = new Date(iso);
  date.setHours(0, 0, 0, 0);
  if (size === 'week') date.setDate(date.getDate() - ((date.getDay() + policy.daysPerWeek - 1) % policy.daysPerWeek));
  if (size === 'month') date.setDate(1);
  return date.toISOString();
}

/** Pure calendar bucketing shared by every long-range chart; never fills gaps or changes source observations. */
export const TimeBuckets = Object.freeze({
  /** Inclusive thresholds on elapsed calendar days. Full-screen detail uses one finer period, with day as the floor. */
  choose(from: string, to: string, detailed = false): TimeBucketSize {
    const days = Math.max(0, Date.parse(to) - Date.parse(from)) / policy.millisecondsPerDay;
    if (days <= policy.dailyDays) return 'day';
    if (days <= policy.weeklyDays) return detailed ? 'day' : 'week';
    return detailed ? 'week' : 'month';
  },

  /** Local range anchored to latest data; month subtraction clamps to the target month's last day. Empty input returns null. */
  range(points: readonly DatedValue[], range: TimeRange): { readonly from: string; readonly to: string } | null {
    const ordered = points.filter(valid).toSorted((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const first = ordered[0];
    const last = ordered.at(-1);
    if (first === undefined || last === undefined) return null;
    const from = new Date(first.date);
    if (range !== 'all') {
      const end = new Date(last.date);
      const day = end.getDate();
      end.setDate(1);
      end.setMonth(end.getMonth() - range);
      const monthEnd = new Date(end);
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
      end.setDate(Math.min(day, monthEnd.getDate()));
      return { from: end.toISOString(), to: new Date(last.date).toISOString() };
    }
    return { from: from.toISOString(), to: new Date(last.date).toISOString() };
  },

  /** Aggregates finite observations chronologically, optionally clipping to an inclusive shown range before bucketing. */
  aggregate(
    points: readonly DatedValue[],
    size: TimeBucketSize,
    aggregation: TimeAggregation,
    range?: { readonly from: string; readonly to: string },
  ): readonly TimeBucket[] {
    const groups = new Map<string, number[]>();
    const ordered = points.filter(valid).toSorted((a, b) => Date.parse(a.date) - Date.parse(b.date));
    for (const point of ordered) {
      if (
        range !== undefined &&
        (Date.parse(point.date) < Date.parse(range.from) || Date.parse(point.date) > Date.parse(range.to))
      )
        continue;
      const start = startOfBucket(point.date, size);
      const values = groups.get(start) ?? [];
      values.push(point.value);
      groups.set(start, values);
    }
    return [...groups].map(([start, values]) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const value =
        aggregation === 'sum'
          ? values.reduce((sum, item) => sum + item, 0)
          : aggregation === 'mean'
            ? values.reduce((sum, item) => sum + item / values.length, 0)
            : aggregation === 'max'
              ? max
              : (values.at(-1) ?? 0);
      return { start, value, min, max, count: values.length };
    });
  },
});
