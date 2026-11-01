import { expect, test } from 'vitest';
import { LinearTrend } from './LinearTrend';

test('hand-computed regression: days 0, 1, 2 and values 1, 2, 6 give slope 2.5 and intercept 0.5', () => {
  expect(
    LinearTrend([
      { date: '2026-01-01', value: 1 },
      { date: '2026-01-02', value: 2 },
      { date: '2026-01-03', value: 6 },
    ]),
  ).toEqual({ origin: '2026-01-01T00:00:00.000Z', slopePerDay: 2.5, intercept: 0.5 });
});

test('ignores missing/invalid observations and requires three valid points with distinct times', () => {
  const point = { date: '2026-01-01', value: 2 };
  expect(LinearTrend([])).toBeNull();
  expect(LinearTrend([point, { date: '2026-01-02', value: 3 }])).toBeNull();
  expect(LinearTrend([point, point, point])).toBeNull();
  expect(
    LinearTrend([
      point,
      { date: 'invalid', value: 3 },
      { date: '2026-01-02', value: null },
      { date: '2026-01-03', value: Infinity },
    ]),
  ).toBeNull();
});

test('unsorted irregular dates and flat or falling values keep caller units per day', () => {
  const points = [
    { date: '2026-01-05', value: -3 },
    { date: '2026-01-01', value: 5 },
    { date: '2026-01-02', value: 3 },
  ];
  expect(LinearTrend(points)?.slopePerDay).toBe(-2);
  expect(LinearTrend(points.map((point) => ({ ...point, value: 5 })))?.slopePerDay).toBe(0);
});
