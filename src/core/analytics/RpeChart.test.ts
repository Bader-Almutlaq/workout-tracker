import { describe, expect, it } from 'vitest';
import { liftRpeChart, rtsRpeChart } from './RpeChart';

const guide = rtsRpeChart();
describe('RpeChart', () => {
  it.each([
    [10, 2, 0.955],
    [9.5, 1, 0.9775],
    [8, 8, 0.739],
    [5, 15, 0.464],
  ])('matches the reference for RPE %s × %s', (rpe, reps, expected) => {
    expect(guide.find((row) => row.rpe === rpe)?.cells.find((cell) => cell.reps === reps)?.percent).toBeCloseTo(
      expected,
      8,
    );
  });
  it('has eleven half-step rows, fifteen columns and mutes only E > 12', () => {
    expect(guide).toHaveLength(11);
    expect(guide.every((row) => row.cells.length === 15)).toBe(true);
    expect(guide[0]?.cells[11]?.isMuted).toBe(false);
    expect(guide[0]?.cells[12]?.isMuted).toBe(true);
    expect(guide.at(-1)?.cells[7]?.isMuted).toBe(true);
  });
  it('uses the fitted k and shared rounding, including downward ties and equipment minimum', () => {
    const curve = { k: 20, kStart: 29, personalSets: 10, isPersonal: true };
    const rows = liftRpeChart(curve, 120, { minimumKilograms: 20, stepKilograms: 2.5 });
    expect(rows[0]?.cells[4]?.percent).toBeCloseTo(1 / 1.2);
    expect(rows[0]?.cells[4]?.weightKilograms).toBe(100);
    expect(
      liftRpeChart(curve, 101.25, { minimumKilograms: 20, stepKilograms: 2.5 })[0]?.cells[0]?.weightKilograms,
    ).toBe(100);
    expect(liftRpeChart(curve, 5, { minimumKilograms: 20, stepKilograms: 2.5 })[0]?.cells[0]?.weightKilograms).toBe(20);
  });
  it('returns no lift grid without an estimate or k', () => {
    expect(
      liftRpeChart({ k: null, kStart: null, personalSets: 0, isPersonal: false }, 100, {
        minimumKilograms: 0,
        stepKilograms: null,
      }),
    ).toEqual([]);
    expect(
      liftRpeChart({ k: 29, kStart: 29, personalSets: 0, isPersonal: false }, null, {
        minimumKilograms: 0,
        stepKilograms: null,
      }),
    ).toEqual([]);
  });
});
