import { describe, expect, it } from 'vitest';
import { ChartLayout, chartScales, nearestChartPoint } from './chartScales';

const points = [
  { date: '2026-03-01', value: 100 },
  { date: '2026-03-08', value: 105 },
  { date: '2026-03-15', value: 110 },
];

describe('chartScales', () => {
  it('maps dates left to right and larger values upward, without a zero baseline', () => {
    const scales = chartScales(points, 398);
    expect(scales.x(new Date('2026-03-01'))).toBe(scales.left);
    expect(scales.x(new Date('2026-03-15'))).toBe(scales.right);
    expect(scales.y(110)).toBeLessThan(scales.y(100));
    expect(scales.y.domain()).toEqual([99, 111]);
    expect(scales.gridValues).toEqual([99, 105, 111]);
  });

  it('includes held session outliers alongside the trend', () => {
    const scales = chartScales([...points, { date: '2026-03-22', value: 200 }], 398);
    expect(scales.y(200)).toBeGreaterThan(scales.top);
    expect(scales.y(100)).toBeLessThan(scales.bottom);
  });

  it('expands a flat series and a single date', () => {
    const scales = chartScales([{ date: '2026-03-01', value: 100 }], 398);
    expect(scales.y.domain()).toEqual([99, 101]);
    expect(scales.x.domain().map(Number)).toEqual([
      Date.parse('2026-03-01') - ChartLayout.singleDatePaddingMilliseconds,
      Date.parse('2026-03-01') + ChartLayout.singleDatePaddingMilliseconds,
    ]);
  });

  it('provides finite fallback domains and bounds for empty or invalid data', () => {
    const scales = chartScales([{ date: 'invalid', value: NaN }], NaN);
    expect(scales.y.domain()).toEqual([-1, 1]);
    expect(scales.x.domain().every((date) => Number.isFinite(Number(date)))).toBe(true);
    expect(scales.right).toBeGreaterThan(scales.left);
    expect(scales.gridValues).toHaveLength(3);
  });

  it('resizes the range without changing domains', () => {
    const narrow = chartScales(points, 200);
    const wide = chartScales(points, 430);
    expect(narrow.x.domain()).toEqual(wide.x.domain());
    expect(narrow.y.domain()).toEqual(wide.y.domain());
    expect(wide.right - narrow.right).toBe(230);
  });

  it('snaps to the nearest point and clamps drags beyond the plot', () => {
    const scales = chartScales(points, 398);
    expect(nearestChartPoint(points, scales.x, scales.x(new Date('2026-03-08')) + 1)).toBe(1);
    expect(nearestChartPoint(points, scales.x, -100)).toBe(0);
    expect(nearestChartPoint(points, scales.x, 1000)).toBe(2);
    expect(nearestChartPoint([], scales.x, 100)).toBeNull();
  });

  it('keeps the earlier point on an exact distance tie', () => {
    const pair = [points[0], points[2]];
    const scales = chartScales(pair, 398);
    expect(nearestChartPoint(pair, scales.x, (scales.left + scales.right) / 2)).toBe(0);
  });
});
