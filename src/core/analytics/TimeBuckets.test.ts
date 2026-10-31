import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TimeBuckets } from './TimeBuckets';

const day = 86_400_000;
const origin = '2020-01-01T00:00:00.000Z';
const afterDays = (days: number) => new Date(Date.parse(origin) + days * day).toISOString();

describe('TimeBuckets', () => {
  // Buckets follow the phone's local calendar; most cases pin UTC so expected instants read plainly.
  beforeEach(() => vi.stubEnv('TZ', 'UTC'));
  afterEach(() => vi.unstubAllEnvs());

  test.each([
    [0, 'day'],
    [92, 'day'],
    [92 + 1 / day, 'week'],
    [730, 'week'],
    [730 + 1 / day, 'month'],
  ] as const)('chooses the inclusive boundary at %s days', (days, expected) => {
    expect(TimeBuckets.choose(origin, afterDays(days))).toBe(expected);
  });
  test('full screen is one period finer, with day as its minimum', () => {
    expect(TimeBuckets.choose(origin, afterDays(92), true)).toBe('day');
    expect(TimeBuckets.choose(origin, afterDays(200), true)).toBe('day');
    expect(TimeBuckets.choose(origin, afterDays(800), true)).toBe('week');
  });
  test('empty and invalid series produce no buckets; a single observation retains its spread', () => {
    expect(TimeBuckets.aggregate([], 'day', 'mean')).toEqual([]);
    expect(TimeBuckets.range([], 'all')).toBeNull();
    expect(
      TimeBuckets.aggregate(
        [
          { date: 'bad', value: 1 },
          { date: origin, value: Infinity },
        ],
        'day',
        'mean',
      ),
    ).toEqual([]);
    expect(TimeBuckets.aggregate([{ date: origin, value: 17 }], 'day', 'mean')).toEqual([
      { start: origin, value: 17, min: 17, max: 17, count: 1 },
    ]);
  });
  test.each([
    ['sum', 18],
    ['mean', 6],
    ['max', 10],
    ['last', 4],
  ] as const)('%s retains min, max and count without mutating input', (aggregation, expected) => {
    const points = [
      { date: '2026-02-09T20:00:00Z', value: 4 },
      { date: '2026-02-09T01:00:00Z', value: 10 },
      { date: '2026-02-09T13:00:00Z', value: 4 },
    ];
    const before = points.map((point) => ({ ...point }));
    expect(TimeBuckets.aggregate(points, 'day', aggregation)).toEqual([
      { start: '2026-02-09T00:00:00.000Z', value: expected, min: 4, max: 10, count: 3 },
    ]);
    expect(points).toEqual(before);
  });
  test('last uses input order for equal instants, and skips missing calendar periods', () => {
    expect(
      TimeBuckets.aggregate(
        [
          { date: origin, value: 2 },
          { date: origin, value: 3 },
          { date: afterDays(2), value: 8 },
        ],
        'day',
        'last',
      ).map((bucket) => bucket.value),
    ).toEqual([3, 8]);
  });
  test.each(['America/New_York', 'Europe/Berlin'])(
    'weeks start on local Monday midnight across DST and year boundaries in %s',
    (zone) => {
      vi.stubEnv('TZ', zone);
      const dates = ['2026-03-08T12:00:00', '2026-03-09T12:00:00', '2026-11-01T12:00:00', '2027-01-01T12:00:00'].map(
        (local) => new Date(local).toISOString(),
      );
      const starts = TimeBuckets.aggregate(
        dates.map((date) => ({ date, value: 1 })),
        'week',
        'mean',
      ).map((bucket) => new Date(bucket.start));
      expect(starts.map((start) => [start.getDay(), start.getHours(), start.getMinutes()])).toEqual([
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
      ]);
      expect(starts.map((start) => start.getDate())).toEqual([2, 9, 26, 28]);
    },
  );
  test('an evening entry stays in its local day and month, not the UTC one', () => {
    vi.stubEnv('TZ', 'Asia/Riyadh');
    // 01:30 on 1 March in Riyadh is still 28 February in UTC.
    const date = new Date('2026-03-01T01:30:00').toISOString();
    const [bucket] = TimeBuckets.aggregate([{ date, value: 5 }], 'month', 'mean');
    const start = new Date(bucket?.start ?? '');
    expect([start.getMonth(), start.getDate(), start.getHours()]).toEqual([2, 1, 0]);
  });
  test('month boundaries, leap days, offsets, negatives and unsorted dates', () => {
    const points = [
      { date: '2024-03-01T00:30:00+01:00', value: -4 },
      { date: '2024-03-01T00:00:00Z', value: 0 },
      { date: '2024-02-01T00:00:00Z', value: -2 },
    ];
    expect(TimeBuckets.aggregate(points, 'month', 'mean')).toEqual([
      { start: '2024-02-01T00:00:00.000Z', value: -3, min: -4, max: -2, count: 2 },
      { start: '2024-03-01T00:00:00.000Z', value: 0, min: 0, max: 0, count: 1 },
    ]);
  });
  test('range uses the latest data, clips inclusively before aggregation, and clamps month ends', () => {
    const points = [
      { date: '2024-01-01T00:00:00Z', value: 1 },
      { date: '2024-02-29T12:00:00Z', value: 2 },
      { date: '2024-05-31T12:00:00Z', value: 3 },
    ];
    const range = TimeBuckets.range(points, 3);
    expect(range).toEqual({ from: '2024-02-29T12:00:00.000Z', to: '2024-05-31T12:00:00.000Z' });
    expect(TimeBuckets.aggregate(points, 'month', 'last', range ?? undefined).map((bucket) => bucket.value)).toEqual([
      2, 3,
    ]);
    expect(TimeBuckets.range(points, 'all')?.from).toBe('2024-01-01T00:00:00.000Z');
    expect(TimeBuckets.range(points, 6)?.from).toBe('2023-11-30T12:00:00.000Z');
    expect(TimeBuckets.range(points, 12)?.from).toBe('2023-05-31T12:00:00.000Z');
  });
});
