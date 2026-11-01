import { chartTimestamp } from './chartTimestamp';
import { expect, test } from 'vitest';
import {
  bucketChartSeries,
  chartHistoryDomain,
  chartLocalPosition,
  chooseChartBucket,
  clampCallout,
  clampChartDomain,
  initialChartDomain,
  nearestTimeMark,
  splitChartGaps,
  TimeChartPolicy,
  zoomChartDomain,
} from './timeChartMath';
import type { TimeChartSeries } from './TimeChart.types';

const day = TimeChartPolicy.day;
const base = Date.parse('2026-01-01T12:00:00Z');
const date = (offset: number) => new Date(base + offset * day).toISOString();
const domain = { from: base, to: base + 365 * day };
const series: TimeChartSeries = {
  name: 'Synthetic',
  points: [
    { date: date(0), value: 10, sessionId: 1, deload: false },
    { date: date(1), value: 2, sessionId: 2, deload: true },
    { date: date(4), value: null, sessionId: 3 },
    { date: date(20), value: 20, sessionId: 4 },
  ],
};

test('chooses day, week, month and quarter to fit compact spans, and sessions at close landscape zoom', () => {
  for (const [days, expected] of [
    [10, 'day'],
    [100, 'week'],
    [600, 'month'],
    [1000, 'quarter'],
  ] as const) {
    expect(chooseChartBucket({ from: base, to: base + days * day }, 26, 20)).toBe(expected);
  }
  expect(chooseChartBucket({ from: base, to: base + 14 * day }, 60, 30, true)).toBe('session');
  expect(chooseChartBucket({ from: base, to: base + 100 * day }, 60, 100, true)).toBe('week');
});

test('history ignores invalid dates, preserves null observations and pads a single timestamp', () => {
  expect(chartHistoryDomain([])).toBeNull();
  expect(chartHistoryDomain([{ name: 'Empty', points: [{ date: 'invalid', value: 1 }] }])).toBeNull();
  expect(chartHistoryDomain([{ name: 'Single', points: [{ date: date(0), value: null }] }])).toEqual({
    from: base - day,
    to: base + day,
  });
});

test('all aggregations delegate to canonical numeric combination and chronologically last really is last', () => {
  const points = [
    { date: date(1), value: 2 },
    { date: date(0), value: 10 },
  ];
  for (const [aggregation, value] of [
    ['sum', 12],
    ['mean', 6],
    ['max', 10],
    ['last', 2],
  ] as const) {
    expect(bucketChartSeries({ name: 'x', points }, domain, 'month', aggregation)[0]?.value).toBe(value);
  }
});

test('mixed deload buckets stay ordinary; trend values exclude deloads without changing plotted totals', () => {
  const buckets = bucketChartSeries(series, domain, 'month', 'sum');
  expect(buckets[0]).toMatchObject({ value: 32, deload: false, trendValue: 30 });
  const onlyDeload = bucketChartSeries(
    { name: 'Deload', points: [series.points[1]].filter((point) => point !== undefined) },
    domain,
    'day',
    'max',
  );
  expect(onlyDeload[0]).toMatchObject({ deload: true, value: 2, trendValue: null });
});

test('dated marks match timestamps and clipped buckets never include observations outside zoom', () => {
  const window = { from: base + day, to: base + 3 * day };
  const bucket = bucketChartSeries(series, window, 'month', 'mean', [{ date: date(1), kind: 'deload' }])[0];
  expect(bucket).toMatchObject({ value: 2, deload: true });
  expect(bucket?.sources).toHaveLength(1);
});

test('quarter buckets preserve weighted means and chronological last instead of averaging monthly means', () => {
  const points = [
    { date: '2026-01-01', value: 2 },
    { date: '2026-01-02', value: 4 },
    { date: '2026-03-01', value: 12 },
  ];
  const history = chartHistoryDomain([{ name: 'x', points }]);
  if (history === null) throw new Error('Missing fixture history');
  expect(bucketChartSeries({ name: 'x', points }, history, 'quarter', 'mean')[0]?.value).toBe(6);
  expect(bucketChartSeries({ name: 'x', points }, history, 'quarter', 'last')[0]?.value).toBe(12);
});

test('nulls break paths and long calendar gaps break paths; no synthetic zeros', () => {
  const points = bucketChartSeries(series, domain, 'day', 'max');
  expect(splitChartGaps(points, 'day').map((segment) => segment.length)).toEqual([2, 1]);
  const nearby = bucketChartSeries(
    {
      name: 'x',
      points: [
        { date: date(0), value: 1 },
        { date: date(3), value: 2 },
      ],
    },
    domain,
    'day',
    'max',
  );
  expect(splitChartGaps(nearby, 'day')).toHaveLength(1);
  expect(
    splitChartGaps(
      bucketChartSeries(
        {
          name: 'x',
          points: [
            { date: date(0), value: 1 },
            { date: date(4), value: 2 },
          ],
        },
        domain,
        'day',
        'max',
      ),
      'day',
    ),
  ).toHaveLength(2);
});

test('null-only bucket remains present while non-finite values never become marks', () => {
  const points = bucketChartSeries(
    {
      name: 'x',
      points: [
        { date: date(0), value: Infinity },
        { date: date(1), value: null },
      ],
    },
    domain,
    'day',
    'sum',
  );
  expect(points.map((point) => point.value)).toEqual([null, null]);
  expect(splitChartGaps(points, 'day')).toEqual([]);
});

test('nearest date handles empty input, unsorted ties and invalid timestamps', () => {
  expect(nearestTimeMark([], base)).toBeNull();
  expect(nearestTimeMark([date(2), date(0), 'invalid'], base + day)).toBe(date(0));
});

test('zoom clamps at history edges and respects two-week or shorter-history minimum', () => {
  expect(clampChartDomain({ from: base - day, to: base + 29 * day }, domain)).toEqual({
    from: base,
    to: base + 30 * day,
  });
  expect(clampChartDomain({ from: base + 360 * day, to: base + 390 * day }, domain)).toEqual({
    from: base + 335 * day,
    to: domain.to,
  });
  expect(clampChartDomain({ from: base, to: base + day }, domain).to - base).toBe(14 * day);
  expect(clampChartDomain({ from: base - day, to: base + 1000 * day }, domain)).toEqual(domain);
  const short = { from: base, to: base + 3 * day };
  expect(zoomChartDomain(short, short, 100, 0.5)).toEqual(short);
});

test('pinch preserves the time under its anchor and invalid factors are harmless', () => {
  const zoomed = zoomChartDomain(domain, domain, 2, 0.5);
  expect((zoomed.from + zoomed.to) / 2).toBe((domain.from + domain.to) / 2);
  expect(zoomed.to - zoomed.from).toBe((domain.to - domain.from) / 2);
  expect(zoomChartDomain(domain, domain, 0, 0.5)).toEqual(domain);
});

test('initial six-month window clamps month ends and shorter histories', () => {
  const history = { from: Date.parse('2024-01-01'), to: Date.parse('2026-08-31T12:00:00Z') };
  expect(new Date(initialChartDomain(history).from).getMonth()).toBe(1);
  expect(new Date(initialChartDomain(history).from).getDate()).toBe(28);
  const short = { from: base, to: base + 30 * day };
  expect(initialChartDomain(short)).toEqual(short);
});

test('screen coordinates map through clockwise portrait rotation and viewBox scaling', () => {
  const bounds = { left: 10, top: 20, width: 200, height: 400 };
  expect(chartLocalPosition({ x: 110, y: 120 }, bounds, 800, 400, true)).toEqual({ x: 200, y: 200 });
  expect(chartLocalPosition({ x: 110, y: 120 }, bounds, 400, 800, false)).toEqual({ x: 200, y: 200 });
});

test('callout stays inside both chart edges, including a narrow chart', () => {
  expect(clampCallout(-10, 430)).toBe(4);
  expect(clampCallout(450, 430)).toBe(216);
  expect(clampCallout(100, 150)).toBe(4);
});

test('civil dates stay local and explicit-offset session timestamps retain their instant', () => {
  expect(chartTimestamp('2026-01-05')).toBe(new Date(2026, 0, 5).getTime());
  expect(chartTimestamp('2026-01-05T12:00:00+03:00')).toBe(Date.parse('2026-01-05T09:00:00Z'));
  expect(Number.isNaN(chartTimestamp('invalid'))).toBe(true);
});

test('decades of observations still fit the compact mark budget by grouping consecutive quarters', () => {
  const points = Array.from({ length: 600 }, (_, month) => ({
    date: new Date(1980, month, 15).toISOString(),
    value: month,
  }));
  const series = { name: 'Long history', points };
  const history = chartHistoryDomain([series]);
  if (history === null) throw new Error('Missing fixture history');
  expect(bucketChartSeries(series, history, 'quarter', 'max').length).toBeLessThanOrEqual(TimeChartPolicy.inlineMarks);
});

test('daily and ISO-week grouping retain their local calendar across the spring DST boundary', () => {
  const points = [
    { date: new Date(2026, 2, 7, 12).toISOString(), value: 1 },
    { date: new Date(2026, 2, 9, 12).toISOString(), value: 2 },
  ];
  const series = { name: 'Calendar', points };
  const history = chartHistoryDomain([series]);
  if (history === null) throw new Error('Missing fixture history');
  const days = bucketChartSeries(series, history, 'day', 'sum');
  expect(days.map((point) => new Date(point.date).getDate())).toEqual([7, 9]);
  const weeks = bucketChartSeries(series, history, 'week', 'sum');
  expect(weeks.every((point) => new Date(point.date).getDay() === 1)).toBe(true);
  expect(splitChartGaps(days, 'day')).toHaveLength(1);
});
