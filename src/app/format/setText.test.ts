import { describe, expect, test } from 'vitest';
import { rpeText, setCountText, setLabels } from './setText';

describe('set text', () => {
  test('Special sets get letters and do not use up a number', () => {
    const kinds = ['warmup', 'working', 'working', 'drop', 'failure', 'working'] as const;
    expect(setLabels(kinds.map((kind) => ({ kind })))).toEqual(['W', '1', '2', 'D', 'F', '3']);
  });

  test('RPE keeps half steps only', () => {
    expect(rpeText(8)).toBe('RPE 8');
    expect(rpeText(8.5)).toBe('RPE 8.5');
  });

  test('Set count is singular for one', () => {
    expect(setCountText(1)).toBe('1 set');
    expect(setCountText(0)).toBe('0 sets');
    expect(setCountText(12)).toBe('12 sets');
  });
});
