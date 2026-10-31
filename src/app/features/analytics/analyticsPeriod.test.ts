import { describe, expect, test } from 'vitest';
import { analyticsPeriod, type AnalyticsPeriod } from './analyticsPeriod';

describe('analyticsPeriod', () => {
  test.each<readonly [AnalyticsPeriod, number]>([
    ['4W', 4],
    ['12W', 12],
    ['6M', 26],
    ['1Y', 52],
  ])('%s has whole weeks and equal previous range', (period, weeks) => {
    const range = analyticsPeriod(period, new Date(2024, 0, 3), null);
    expect(range.to).toEqual(new Date(2024, 0, 8));
    expect(range.weeks).toBe(weeks);
    const expected = new Date(2024, 0, 8 - weeks * 7);
    expect(range.from).toEqual(expected);
    expect(range.previous?.to).toEqual(expected);
    expect(range.previous?.from).toEqual(new Date(2024, 0, 8 - weeks * 14));
  });
  test('All starts on the first workout Monday across a year boundary', () => {
    const range = analyticsPeriod('All', new Date(2024, 0, 3), new Date(2023, 11, 31, 12).toISOString());
    expect(range.from).toEqual(new Date(2023, 11, 25));
    expect(range.to).toEqual(new Date(2024, 0, 8));
    expect(range.previous).toBeNull();
  });
});
