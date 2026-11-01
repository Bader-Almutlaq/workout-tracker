import { expect, test } from 'vitest';
import { PercentOfMax } from './PercentOfMax';

test('uses the larger estimate and caps an unusually heavy set', () => {
  expect(PercentOfMax(100, 80, 120)).toBeCloseTo((100 / 120) * 100);
  expect(PercentOfMax(130, 80, 120)).toBe(100);
  expect(PercentOfMax(100, null, null)).toBeNull();
});
