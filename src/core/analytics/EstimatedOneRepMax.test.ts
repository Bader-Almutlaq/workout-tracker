import { describe, expect, it } from 'vitest';
import type { Equipment } from '../library/Equipment';
import type { Mechanic } from '../library/Mechanic';
import type { MovementPattern } from '../library/MovementPattern';
import { estimatedOneRepMax, type StrengthExercise } from './EstimatedOneRepMax';

const bench: StrengthExercise = {
  equipment: 'barbell',
  movementPattern: 'horizontal-push',
  mechanic: 'compound',
  tracking: 'weight-reps',
};
const set = { kind: 'working', weightKilograms: 100, reps: 5, rpe: 8 } as const;

describe('estimatedOneRepMax', () => {
  it('reproduces the report item 2 bench example exactly, rounding only for display', () => {
    const estimate = estimatedOneRepMax(set, bench);
    expect(estimate?.effectiveReps).toBe(7);
    expect(estimate?.e1rmKilograms).toBe(100 * (1 + 6 / 29));
    expect(estimate?.e1rmKilograms.toFixed(1)).toBe('120.7');
  });

  const categories: readonly [Equipment, MovementPattern, Mechanic, number][] = [
    ['barbell', 'squat', 'compound', 38],
    ['barbell', 'horizontal-pull', 'compound', 29],
    ['machine', 'squat', 'compound', 24],
    ['cable', 'horizontal-pull', 'compound', 24],
    ['dumbbell', 'horizontal-push', 'compound', 20],
    ['barbell', 'elbow-flexion', 'isolation', 15],
    ['trap-bar', 'hinge', 'compound', 38],
    ['safety-bar', 'squat', 'compound', 38],
    ['barbell', 'lunge', 'compound', 38],
    ['barbell', 'hip-thrust', 'compound', 38],
    ['ez-bar', 'horizontal-push', 'compound', 29],
    ['smith-machine', 'squat', 'compound', 24],
    ['plate-loaded', 'vertical-push', 'compound', 24],
    ['kettlebell', 'squat', 'compound', 20],
  ];
  it.each(categories)('%s / %s / %s uses k = %s', (equipment, movementPattern, mechanic, k) => {
    const exercise = { ...bench, equipment, movementPattern, mechanic };
    expect(estimatedOneRepMax(set, exercise)?.e1rmKilograms).toBe(100 * (1 + 6 / k));
    expect(estimatedOneRepMax({ ...set, kind: 'failure', reps: 1 }, exercise)?.e1rmKilograms).toBe(100);
  });

  it('excludes warm-ups but includes qualifying drop and failure sets', () => {
    expect(estimatedOneRepMax({ ...set, kind: 'warmup' }, bench)).toBeNull();
    expect(estimatedOneRepMax({ ...set, kind: 'drop' }, bench)?.e1rmKilograms).toBe(100 * (1 + 6 / 29));
    expect(estimatedOneRepMax({ ...set, kind: 'failure', rpe: null }, bench)?.e1rmKilograms).toBe(100 * (1 + 4 / 29));
  });

  it('keeps the unknown-effort estimate intact while reducing its trend weight', () => {
    expect(estimatedOneRepMax({ ...set, rpe: null }, bench)).toEqual({
      effectiveReps: 7,
      repsInReserve: 2,
      trendWeight: 0.5,
      e1rmKilograms: 100 * (1 + 6 / 29),
      isLowConfidence: false,
    });
  });

  it.each([10, 11, 12, 13])('applies confidence and qualification to E = %s', (reps) => {
    const estimate = estimatedOneRepMax({ ...set, reps, rpe: 10 }, bench);
    if (reps > 12) {
      expect(estimate).toBeNull();
    } else {
      expect(estimate?.isLowConfidence).toBe(reps > 10);
    }
  });

  it('qualifies RIR 4 but excludes RIR above 4 and applies the cap to E rather than reps', () => {
    expect(estimatedOneRepMax({ ...set, reps: 8, rpe: 6 }, bench)).not.toBeNull();
    expect(estimatedOneRepMax({ ...set, rpe: 5.5 }, bench)).toBeNull();
    expect(estimatedOneRepMax({ ...set, reps: 11, rpe: null }, bench)).toBeNull();
  });

  it.each([0, -1, NaN, Infinity, Number.MAX_VALUE])('omits unusable loads %s', (weightKilograms) => {
    expect(estimatedOneRepMax({ ...set, weightKilograms }, bench)).toBeNull();
  });

  it('omits invalid reps and RPE', () => {
    expect(estimatedOneRepMax({ ...set, reps: 0 }, bench)).toBeNull();
    expect(estimatedOneRepMax({ ...set, rpe: 11 }, bench)).toBeNull();
  });

  it('omits missing/unsupported metadata and bodyweight or timed tracking', () => {
    expect(estimatedOneRepMax(set, { ...bench, equipment: null })).toBeNull();
    expect(estimatedOneRepMax(set, { ...bench, mechanic: null })).toBeNull();
    expect(estimatedOneRepMax(set, { ...bench, movementPattern: null })).toBeNull();
    expect(estimatedOneRepMax(set, { ...bench, equipment: 'band' })).toBeNull();
    expect(estimatedOneRepMax(set, { ...bench, movementPattern: 'olympic' })).toBeNull();
    expect(estimatedOneRepMax(set, { ...bench, tracking: 'bodyweight-reps' })).toBeNull();
    expect(estimatedOneRepMax(set, { ...bench, tracking: 'duration' })).toBeNull();
    expect(estimatedOneRepMax(set, { ...bench, tracking: 'weight-duration' })).toBeNull();
  });
});
