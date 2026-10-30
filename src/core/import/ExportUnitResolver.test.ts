import { describe, expect, test } from 'vitest';
import { resolveExportUnit } from './ExportUnitResolver';

describe('Per-exercise export unit', () => {
  test('Round kg converted to lb marks a pounds column', () => {
    const verdict = resolveExportUnit([99.21, 63.93, 140, 160]);
    expect(verdict.columnUnit).toBe('lb');
    expect(verdict.poundVotes).toBe(2);
    expect(verdict.kilogramVotes).toBe(0);
  });

  test('Whole pounds converted to kg mark a kilograms column', () => {
    const verdict = resolveExportUnit([61.23, 49.9, 100, 102.5]);
    expect(verdict.columnUnit).toBe('kg');
    expect(verdict.kilogramVotes).toBe(2);
  });

  test('Only round values gives no evidence and defaults to kg', () => {
    expect(resolveExportUnit([100, 102.5, 0])).toEqual({ columnUnit: 'kg', kilogramVotes: 0, poundVotes: 0 });
  });

  test('A tie goes to kg', () => {
    expect(resolveExportUnit([61.23, 99.21])).toEqual({ columnUnit: 'kg', kilogramVotes: 1, poundVotes: 1 });
  });

  test('No values at all goes to kg', () => {
    expect(resolveExportUnit([])).toEqual({ columnUnit: 'kg', kilogramVotes: 0, poundVotes: 0 });
  });
});
