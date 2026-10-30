import { describe, expect, it } from 'vitest';
import { effectiveReps } from './EffectiveReps';

describe('effectiveReps', () => {
  it('reproduces report items 1–2: 5 reps at RPE 8 gives RIR 2 and E 7', () => {
    expect(effectiveReps({ kind: 'working', reps: 5, rpe: 8 })).toEqual({
      effectiveReps: 7,
      repsInReserve: 2,
      trendWeight: 1,
    });
  });

  it('uses RIR 2 with half weight when effort is unknown', () => {
    expect(effectiveReps({ kind: 'working', reps: 5, rpe: null })).toEqual({
      effectiveReps: 7,
      repsInReserve: 2,
      trendWeight: 0.5,
    });
  });

  it.each([null, 6, 10])('failure establishes RIR 0 even with RPE %s', (rpe) => {
    expect(effectiveReps({ kind: 'failure', reps: 5, rpe })).toEqual({
      effectiveReps: 5,
      repsInReserve: 0,
      trendWeight: 1,
    });
  });

  it('preserves half-step RPE without rounding', () => {
    expect(effectiveReps({ kind: 'drop', reps: 5, rpe: 8.5 })?.effectiveReps).toBe(6.5);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid reps %s', (reps) => {
    expect(effectiveReps({ kind: 'working', reps, rpe: 8 })).toBeNull();
  });

  it.each([0, 11, NaN, Infinity])('rejects invalid RPE %s', (rpe) => {
    expect(effectiveReps({ kind: 'working', reps: 5, rpe })).toBeNull();
  });
});
