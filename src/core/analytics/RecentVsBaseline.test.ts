import { describe, expect, test } from 'vitest';
import {
  rangeStatistics,
  recentVsBaseline,
  RecentVsBaselineError,
  type BaselineClassification,
  type SeriesPoint,
} from './RecentVsBaseline';

// Synthetic arithmetic examples: the report gives no worked recent/baseline or range-statistics numbers.
function days(values: readonly number[]): SeriesPoint[] {
  return values.map((value, index) => ({ date: `2024-01-${(index + 1).toString().padStart(2, '0')}`, value }));
}

describe('recentVsBaseline', () => {
  test('compares a 7-day sum to a 28-day average scaled to 7 days', () => {
    const series = days([...Array<number>(21).fill(2), ...Array<number>(7).fill(4)]);
    expect(recentVsBaseline(series).at(-1)).toEqual({
      date: '2024-01-28',
      recent: 28,
      baseline: 17.5,
      percentDifference: 60,
      classification: 'above',
    });
  });

  test('leaves incomplete calendar windows unavailable', () => {
    const result = recentVsBaseline(days(Array<number>(28).fill(2)));
    expect(result[0]).toMatchObject({ recent: null, baseline: null, percentDifference: null, classification: null });
    expect(result[5]?.recent).toBeNull();
    expect(result[6]).toMatchObject({ recent: 14, baseline: null });
    expect(result[26]?.baseline).toBeNull();
    expect(result[27]).toMatchObject({ recent: 14, baseline: 14, percentDifference: 0, classification: 'within' });
  });

  test('uses weekly totals with configurable period lengths', () => {
    const series = ['2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22'].map((date, index) => ({
      date,
      value: index === 3 ? 20 : 10,
    }));
    expect(recentVsBaseline(series, { cadence: 'weekly', recentPeriods: 1, baselinePeriods: 4 }).at(-1)).toEqual({
      date: '2024-01-22',
      recent: 20,
      baseline: 12.5,
      percentDifference: 60,
      classification: 'above',
    });
  });

  test.each<[number, number, BaselineClassification]>([
    [110, 90, 'within'],
    [90, 110, 'within'],
    [111, 89, 'below'],
    [89, 111, 'above'],
    [100, 100, 'within'],
  ])('classifies %s then %s with an inclusive ±10%% band', (first, last, classification) => {
    expect(recentVsBaseline(days([first, last]), { recentPeriods: 1, baselinePeriods: 2 }).at(-1)?.classification).toBe(
      classification,
    );
  });

  test.each([
    [0.11, 0.09],
    [0.09, 0.11],
  ])('keeps decimal 10%% boundaries neutral: %s, %s', (first, last) => {
    expect(recentVsBaseline(days([first, last]), { recentPeriods: 1, baselinePeriods: 2 }).at(-1)?.classification).toBe(
      'within',
    );
  });

  test('distinguishes both-zero from a nonzero recent value against zero baseline', () => {
    expect(recentVsBaseline(days([0, 0]), { recentPeriods: 1, baselinePeriods: 2 }).at(-1)).toMatchObject({
      percentDifference: 0,
      classification: 'within',
    });
    expect(recentVsBaseline(days([-1, 1]), { recentPeriods: 1, baselinePeriods: 2 }).at(-1)).toMatchObject({
      recent: 1,
      baseline: 0,
      percentDifference: null,
      classification: null,
    });
    expect(recentVsBaseline(days([10, 0]), { recentPeriods: 1, baselinePeriods: 2 }).at(-1)?.percentDifference).toBe(
      -100,
    );
  });

  test('handles negative baselines with a positive sign for increases', () => {
    expect(recentVsBaseline(days([-3, -1]), { recentPeriods: 1, baselinePeriods: 2 }).at(-1)).toMatchObject({
      baseline: -2,
      percentDifference: 50,
      classification: 'above',
    });
  });

  test('returns exact zeros after fractional volume ages out of both windows', () => {
    expect(recentVsBaseline(days([0.1, 0.2, 0, 0]), { recentPeriods: 1, baselinePeriods: 2 }).at(-1)).toMatchObject({
      recent: 0,
      baseline: 0,
      percentDifference: 0,
      classification: 'within',
    });
  });

  test('treats missing interior days as zero, never as consecutive observations', () => {
    expect(
      recentVsBaseline(
        [
          { date: '2024-01-01', value: 8 },
          { date: '2024-01-08', value: 4 },
        ],
        { recentPeriods: 2, baselinePeriods: 8 },
      ).at(-1),
    ).toMatchObject({ recent: 4, baseline: 3 });
  });

  test('slides past both old window starts, sorts without mutation, and ignores future values', () => {
    const original = days([1, 2, 3, 4, 5]);
    const reversed = [...original].reverse();
    const result = recentVsBaseline(reversed, { recentPeriods: 2, baselinePeriods: 4 });
    expect(result.map((point) => point.date)).toEqual(original.map((point) => point.date));
    expect(reversed[0]?.date).toBe('2024-01-05');
    expect(result[3]).toMatchObject({ recent: 7, baseline: 5 });
    expect(result[4]).toMatchObject({ recent: 9, baseline: 7 });
    expect(result.slice(0, 4)).toEqual(
      recentVsBaseline(original.slice(0, 4), { recentPeriods: 2, baselinePeriods: 4 }),
    );
  });

  test('handles leap days and weekly gaps across year boundaries', () => {
    expect(
      recentVsBaseline(
        [
          { date: '2024-02-28', value: 2 },
          { date: '2024-03-01', value: 4 },
        ],
        { recentPeriods: 1, baselinePeriods: 3 },
      ).at(-1)?.baseline,
    ).toBe(2);
    expect(
      recentVsBaseline(
        [
          { date: '2023-12-25', value: 8 },
          { date: '2024-01-08', value: 4 },
        ],
        { cadence: 'weekly', recentPeriods: 1, baselinePeriods: 3 },
      ).at(-1)?.baseline,
    ).toBe(4);
  });

  test('returns no points for an empty series', () => {
    expect(recentVsBaseline([])).toEqual([]);
  });

  test.each([0, -1, 1.5, Infinity, NaN])('rejects invalid window %s', (periods) => {
    expect(() => recentVsBaseline([], { recentPeriods: periods })).toThrow(RecentVsBaselineError);
    expect(() => recentVsBaseline([], { baselinePeriods: periods })).toThrow(RecentVsBaselineError);
  });

  test.each(['2024-02-30', '2023-02-29', '2024-1-01', 'invalid'])('rejects invalid date %s', (date) => {
    expect(() => recentVsBaseline([{ date, value: 1 }])).toThrow(RecentVsBaselineError);
  });

  test('rejects duplicate dates, nonfinite values and misaligned weekly dates', () => {
    expect(() => recentVsBaseline([...days([1]), ...days([2])])).toThrow(RecentVsBaselineError);
    expect(() => recentVsBaseline(days([NaN]))).toThrow(RecentVsBaselineError);
    expect(() => recentVsBaseline(days([Infinity]))).toThrow(RecentVsBaselineError);
    expect(() => recentVsBaseline(days([1, 2]), { cadence: 'weekly' })).toThrow(RecentVsBaselineError);
  });
});

describe('rangeStatistics', () => {
  test('computes inclusive observed-value statistics in chronological order', () => {
    const series = days([99, 5, 10, 4, 99]).reverse();
    expect(rangeStatistics(series, '2024-01-02', '2024-01-04')).toEqual({
      start: 5,
      end: 4,
      change: -1,
      mean: 19 / 3,
      min: 4,
      max: 10,
      count: 3,
      total: 19,
    });
    expect(series[0]?.date).toBe('2024-01-05');
  });

  test('does not zero-fill gaps in a selected observation range', () => {
    expect(
      rangeStatistics(
        [
          { date: '2024-01-01', value: 4 },
          { date: '2024-01-08', value: 8 },
        ],
        '2024-01-01',
        '2024-01-08',
      ),
    ).toMatchObject({ mean: 6, count: 2, total: 12 });
  });

  test('returns a singleton with zero change and preserves a zero value', () => {
    expect(rangeStatistics(days([0]), '2024-01-01', '2024-01-01')).toEqual({
      start: 0,
      end: 0,
      change: 0,
      mean: 0,
      min: 0,
      max: 0,
      count: 1,
      total: 0,
    });
  });

  test('uses null statistics for empty, out-of-range and reversed selections', () => {
    const empty = { start: null, end: null, change: null, mean: null, min: null, max: null, count: 0, total: 0 };
    expect(rangeStatistics([], '2024-01-01', '2024-01-31')).toEqual(empty);
    expect(rangeStatistics(days([1]), '2024-01-02', '2024-01-31')).toEqual(empty);
    expect(rangeStatistics(days([1]), '2024-01-31', '2024-01-01')).toEqual(empty);
  });

  test('rejects invalid range dates', () => {
    expect(() => rangeStatistics([], 'invalid', '2024-01-01')).toThrow(RecentVsBaselineError);
  });
});
