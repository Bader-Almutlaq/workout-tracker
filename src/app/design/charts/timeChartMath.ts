import { chartTimestamp } from './chartTimestamp';
import { TimeBuckets, type TimeAggregation } from '../../../core/analytics/TimeBuckets';
import type { TimeChartDomain, TimeChartMark, TimeChartPoint, TimeChartSeries } from './TimeChart.types';

/** Heuristic: T-083 phone density, landscape density, two-week minimum zoom, and small touch tolerances. */
export const TimeChartPolicy = Object.freeze({
  day: 86_400_000,
  daysPerWeek: 7,
  monthsPerQuarter: 3,
  monthsPerYear: 12,
  inlineMarks: 26,
  expandedMarks: 60,
  minimumDays: 14,
  initialMonths: 6,
  height: 160,
  pressMilliseconds: 150,
  movementPixels: 8,
  doubleTapMilliseconds: 300,
  calloutWidth: 210,
  calloutInset: 4,
  dotRadius: 2.5,
  ringRadius: 5,
  strokeWidth: 2,
  maximumBarWidth: 18,
  barFraction: 0.7,
  maximumGapBuckets: 2,
  hoursPerDay: 24,
  maximumAxisTicks: 4,
  tickStride: 2,
});

/** Display period; session preserves every original timestamp at close zoom. */
export type ChartBucket = 'session' | 'day' | 'week' | 'month' | 'quarter';

/** Aggregated display point retaining source sessions for tables/navigation and clean non-deload trend values. */
export interface TimeChartBucket extends TimeChartPoint {
  readonly deload: boolean;
  readonly sources: readonly TimeChartPoint[];
  readonly trendValue: number | null;
  readonly span: number;
}

/** Heuristic: choose the smallest calendar period fitting the mark budget; landscape close zoom preserves sessions. */
export function chooseChartBucket(
  domain: TimeChartDomain,
  budget: number,
  count: number,
  expanded = false,
): ChartBucket {
  const days = (domain.to - domain.from) / TimeChartPolicy.day;
  if (expanded && (days <= TimeChartPolicy.minimumDays || (days <= TimeChartPolicy.minimumDays * 2 && count <= budget)))
    return 'session';
  if (days + 1 <= budget && count <= budget) return 'day';
  if (days / TimeChartPolicy.daysPerWeek + 1 <= budget) return 'week';
  const start = new Date(domain.from);
  const end = new Date(domain.to);
  const months =
    (end.getFullYear() - start.getFullYear()) * TimeChartPolicy.monthsPerYear + end.getMonth() - start.getMonth() + 1;
  return months <= budget ? 'month' : 'quarter';
}

function periodStart(date: string, size: ChartBucket, quarterStep: number): string {
  if (size === 'session') return new Date(date).toISOString();
  const local = new Date(date);
  if (size === 'quarter') {
    const periodMonths = TimeChartPolicy.monthsPerQuarter * quarterStep;
    const absoluteMonth = local.getFullYear() * TimeChartPolicy.monthsPerYear + local.getMonth();
    const alignedMonth = Math.floor(absoluteMonth / periodMonths) * periodMonths;
    local.setMonth(alignedMonth - local.getFullYear() * TimeChartPolicy.monthsPerYear, 1);
  }
  // Canonical local day/week/month boundaries and numeric aggregation stay in TimeBuckets.
  return (
    TimeBuckets.aggregate([{ date: local.toISOString(), value: 0 }], size === 'quarter' ? 'month' : size, 'last')[0]
      ?.start ?? date
  );
}

function aggregateValue(
  points: readonly TimeChartPoint[],
  size: ChartBucket,
  aggregation: TimeAggregation,
): number | null {
  const valid = points.flatMap((point) =>
    point.value === null || !Number.isFinite(point.value) ? [] : [{ date: point.date, value: point.value }],
  );
  // All members already share a display bucket. Mapping to a common date lets TimeBuckets own numeric combination.
  const date = valid[0]?.date;
  if (date === undefined) return null;
  if (size === 'session') return valid.at(-1)?.value ?? null;
  return (
    TimeBuckets.aggregate(
      valid.map((point) => ({ ...point, date })),
      'day',
      aggregation,
    )[0]?.value ?? null
  );
}

/** Clips before bucketing; null-only periods stay null and only wholly deload periods become yellow. */
export function bucketChartSeries(
  series: TimeChartSeries,
  domain: TimeChartDomain,
  size: ChartBucket,
  aggregation: TimeAggregation,
  marks: readonly TimeChartMark[] = [],
  budget: number = TimeChartPolicy.inlineMarks,
): readonly TimeChartBucket[] {
  const marked = new Set(marks.map((mark) => chartTimestamp(mark.date)));
  const groups = new Map<string, TimeChartPoint[]>();
  const from = new Date(domain.from);
  const to = new Date(domain.to);
  const quarters =
    Math.floor(
      ((to.getFullYear() - from.getFullYear()) * TimeChartPolicy.monthsPerYear + to.getMonth() - from.getMonth()) /
        TimeChartPolicy.monthsPerQuarter,
    ) + 1;
  // Very long histories group consecutive quarters too, rather than exceed the screen's mark budget.
  const quarterStep = Math.max(1, Math.ceil(quarters / Math.max(1, budget - 1)));
  for (const point of series.points.toSorted((a, b) => chartTimestamp(a.date) - chartTimestamp(b.date))) {
    const timestamp = chartTimestamp(point.date);
    if (!Number.isFinite(timestamp) || timestamp < domain.from || timestamp > domain.to) continue;
    const key = periodStart(new Date(timestamp).toISOString(), size, quarterStep);
    const sources = groups.get(key) ?? [];
    sources.push({ ...point, date: new Date(timestamp).toISOString(), deload: point.deload ?? marked.has(timestamp) });
    groups.set(key, sources);
  }
  return [...groups].map(([date, sources]) => {
    const value = aggregateValue(sources, size, aggregation);
    const deload = sources.every((point) => point.deload === true);
    return {
      date,
      value,
      deload,
      sources,
      span: size === 'quarter' ? quarterStep : 1,
      trendValue: aggregateValue(
        sources.filter((point) => !point.deload),
        size,
        aggregation,
      ),
    };
  });
}

/** Whole finite-dated history; a single timestamp gets one day of padding on either side. */
export function chartHistoryDomain(series: readonly TimeChartSeries[]): TimeChartDomain | null {
  const timestamps = series
    .flatMap((item) => item.points.map((point) => chartTimestamp(point.date)))
    .filter(Number.isFinite);
  if (timestamps.length === 0) return null;
  const from = timestamps.reduce((a, b) => Math.min(a, b), Infinity);
  const to = timestamps.reduce((a, b) => Math.max(a, b), -Infinity);
  return from === to ? { from: from - TimeChartPolicy.day, to: to + TimeChartPolicy.day } : { from, to };
}

/** Clamps a pan/zoom window without changing its span at the edges; minimum zoom is two weeks or the shorter history. */
export function clampChartDomain(requested: TimeChartDomain, history: TimeChartDomain): TimeChartDomain {
  const wholeSpan = history.to - history.from;
  const minimum = Math.min(wholeSpan, TimeChartPolicy.minimumDays * TimeChartPolicy.day);
  const span = Math.min(wholeSpan, Math.max(minimum, requested.to - requested.from));
  const from = Math.max(history.from, Math.min(history.to - span, requested.from));
  return { from, to: from + span };
}

/** Last six calendar months, clamped at month ends and bounded by the full history. */
export function initialChartDomain(history: TimeChartDomain): TimeChartDomain {
  const date = new Date(history.to);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() - TimeChartPolicy.initialMonths);
  const lastDay = new Date(date);
  lastDay.setMonth(lastDay.getMonth() + 1, 0);
  date.setDate(Math.min(day, lastDay.getDate()));
  return clampChartDomain({ from: date.getTime(), to: history.to }, history);
}

/** Anchored pinch scaling in time; factor > 1 zooms in, anchor is a plot-relative fraction. */
export function zoomChartDomain(
  domain: TimeChartDomain,
  history: TimeChartDomain,
  factor: number,
  anchor: number,
): TimeChartDomain {
  if (!Number.isFinite(factor) || factor <= 0) return domain;
  const fraction = Math.max(0, Math.min(1, anchor));
  const span = (domain.to - domain.from) / factor;
  const from = domain.from + (domain.to - domain.from) * fraction - span * fraction;
  return clampChartDomain({ from, to: from + span }, history);
}

/** Nearest dated mark in time, ties choosing the earlier mark; empty input returns null. */
export function nearestTimeMark(dates: readonly string[], timestamp: number): string | null {
  let selected: string | null = null;
  let distance = Infinity;
  for (const date of dates) {
    const next = Math.abs(Date.parse(date) - timestamp);
    if (next < distance || (next === distance && selected !== null && Date.parse(date) < Date.parse(selected))) {
      distance = next;
      selected = date;
    }
  }
  return selected;
}

/** Maps physical screen coordinates through the clockwise portrait rotation and any SVG viewBox scaling. */
export function chartLocalPosition(
  point: { readonly x: number; readonly y: number },
  bounds: { readonly left: number; readonly top: number; readonly width: number; readonly height: number },
  width: number,
  height: number,
  rotated: boolean,
): { readonly x: number; readonly y: number } {
  return rotated
    ? {
        x: ((point.y - bounds.top) / bounds.height) * width,
        y: ((bounds.left + bounds.width - point.x) / bounds.width) * height,
      }
    : { x: ((point.x - bounds.left) / bounds.width) * width, y: ((point.y - bounds.top) / bounds.height) * height };
}

/** Bubble left edge clamped to its chart; narrow charts shrink the bubble rather than overflow. */
export function clampCallout(center: number, chartWidth: number, bubbleWidth = TimeChartPolicy.calloutWidth): number {
  const inset = TimeChartPolicy.calloutInset;
  const width = Math.min(bubbleWidth, Math.max(0, chartWidth - inset * 2));
  return Math.max(inset, Math.min(chartWidth - width - inset, center - width / 2));
}

function bucketDistance(first: string, last: string, size: ChartBucket): number {
  if (size === 'month' || size === 'quarter') {
    const a = new Date(first);
    const b = new Date(last);
    const months = (b.getFullYear() - a.getFullYear()) * TimeChartPolicy.monthsPerYear + b.getMonth() - a.getMonth();
    return months / (size === 'quarter' ? TimeChartPolicy.monthsPerQuarter : 1);
  }
  return (
    (Date.parse(last) - Date.parse(first)) / (TimeChartPolicy.day * (size === 'week' ? TimeChartPolicy.daysPerWeek : 1))
  );
}

/** Explicit nulls always break a path; never bridges more than two empty calendar buckets, including DST boundaries. */
export function splitChartGaps(
  points: readonly TimeChartBucket[],
  size: ChartBucket,
): readonly (readonly TimeChartBucket[])[] {
  const segments: TimeChartBucket[][] = [];
  let segment: TimeChartBucket[] = [];
  for (const point of points) {
    const previous = segment.at(-1);
    if (
      point.value === null ||
      (previous !== undefined &&
        bucketDistance(previous.date, point.date, size === 'session' ? 'day' : size) >
          (TimeChartPolicy.maximumGapBuckets + 1 + 1 / TimeChartPolicy.hoursPerDay) * previous.span)
    ) {
      if (segment.length > 0) segments.push(segment);
      segment = [];
    }
    if (point.value !== null) segment.push(point);
  }
  if (segment.length > 0) segments.push(segment);
  return segments;
}
