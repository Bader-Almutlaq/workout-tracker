import { scaleLinear, scaleUtc } from 'd3-scale';
import { FORMAT_LOCALE } from '../../format/formatLocale';

/** A dated chart value in the caller's units; calendar keys are interpreted in UTC. */
export interface ChartPoint {
  readonly date: string;
  readonly value: number;
}

/** Heuristic: readable phone-sized plot, about 3 round ticks, and 10% headroom around the data. */
export const ChartLayout = Object.freeze({
  height: 220,
  padding: Object.freeze({ top: 16, right: 16, bottom: 32, left: 52 }),
  gridlineCount: 3,
  monthLabelCount: 3,
  domainPaddingFraction: 0.1,
  minimumValuePadding: 1,
  singleDatePaddingMilliseconds: 86_400_000,
  minimumWidth: 160,
  shortSpanDays: 90,
  millisecondsPerDay: 86_400_000,
});

/** D3 scales plus exact plot boundaries and round horizontal ticks. */
export interface ChartScales {
  readonly x: ReturnType<typeof scaleUtc<number, number>>;
  readonly y: ReturnType<typeof scaleLinear<number, number>>;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly gridValues: readonly number[];
}

/**
 * Padded scales (non-zero-based unless zeroBaseline is requested); includes every finite raw and trend value, even held outliers.
 * Empty input uses a finite fallback; one date/value expands to a non-degenerate domain.
 * Heuristic: padding is visual breathing room, never an analytics calculation.
 */
export function chartScales(
  points: readonly ChartPoint[],
  width: number,
  options: { readonly zeroBaseline?: boolean; readonly height?: number } = {},
): ChartScales {
  const layout = ChartLayout;
  const valid = points.filter((point) => Number.isFinite(Date.parse(point.date)) && Number.isFinite(point.value));
  const times = valid.map((point) => Date.parse(point.date));
  const values = valid.map((point) => point.value);
  let first = times.length === 0 ? 0 : Math.min(...times);
  let last = times.length === 0 ? 0 : Math.max(...times);
  if (first === last) {
    first -= layout.singleDatePaddingMilliseconds;
    last += layout.singleDatePaddingMilliseconds;
  }
  const low = values.length === 0 ? 0 : Math.min(...values);
  const high = values.length === 0 ? 0 : Math.max(...values);
  const padding = Math.max((high - low) * layout.domainPaddingFraction, layout.minimumValuePadding);
  const minimum = options.zeroBaseline === true ? 0 : low - padding;
  const maximum = high + padding;
  const left = layout.padding.left;
  const right =
    Math.max(Number.isFinite(width) ? width : layout.minimumWidth, layout.minimumWidth) - layout.padding.right;
  const top = layout.padding.top;
  const bottom = (options.height ?? layout.height) - layout.padding.bottom;
  const y = scaleLinear().domain([minimum, maximum]).nice(layout.gridlineCount).range([bottom, top]);
  return {
    x: scaleUtc<number>().domain([first, last]).range([left, right]).clamp(true),
    y,
    left,
    right,
    top,
    bottom,
    gridValues: y.ticks(layout.gridlineCount),
  };
}

/** Nearest point in pixel space; ties keep the earlier input point, and empty data returns null. */
export function nearestChartPoint(points: readonly ChartPoint[], x: ChartScales['x'], pixel: number): number | null {
  let nearest: number | null = null;
  let distance = Infinity;
  points.forEach((point, index) => {
    const nextDistance = Math.abs(x(new Date(point.date)) - pixel);
    if (nextDistance < distance) {
      nearest = index;
      distance = nextDistance;
    }
  });
  return nearest;
}

/** Calendar-axis labels: short spans name days; longer spans name months with an unambiguous year. */
export function chartDateLabels(scales: ChartScales): readonly { readonly date: Date; readonly text: string }[] {
  const domain = scales.x.domain();
  const first = domain[0];
  const last = domain.at(-1);
  if (first === undefined || last === undefined) return [];
  const short = Number(last) - Number(first) < ChartLayout.shortSpanDays * ChartLayout.millisecondsPerDay;
  const seen = new Set<string>();
  return scales.x.ticks(ChartLayout.monthLabelCount).flatMap((date) => {
    const key = short ? date.toISOString().slice(0, 10) : date.toISOString().slice(0, 7);
    if (seen.has(key)) return [];
    const firstLabel = seen.size === 0;
    seen.add(key);
    const format = new Intl.DateTimeFormat(FORMAT_LOCALE, {
      timeZone: 'UTC',
      month: 'short',
      ...(short ? { day: 'numeric' } : firstLabel || date.getUTCMonth() === 0 ? { year: 'numeric' } : {}),
    });
    return [{ date, text: format.format(date) }];
  });
}
