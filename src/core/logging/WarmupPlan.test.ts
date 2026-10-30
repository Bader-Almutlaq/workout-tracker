import { describe, expect, test } from 'vitest';
import { loadProfileFor } from '../units/LoadableWeight';
import { defaultWarmupCount, refreshWarmups, warmupSets } from './WarmupPlan';

const barbell = loadProfileFor({ equipment: 'barbell' }, 'kg');
const compound = {
  equipment: 'barbell',
  mechanic: 'compound',
  movementPattern: 'squat',
  tracking: 'weight-reps',
} as const;

describe('warm-up plans', () => {
  test('100 kg barbell, three sets', () => {
    expect(warmupSets(100, 3, barbell)).toEqual([
      { weightKilograms: 40, reps: 8 },
      { weightKilograms: 60, reps: 5 },
      { weightKilograms: 80, reps: 2 },
    ]);
  });
  test('60 kg barbell follows 40/60/80% with down rounding (the brief’s first example has an arithmetic error)', () => {
    expect(warmupSets(60, 3, barbell)).toEqual([
      { weightKilograms: 22.5, reps: 8 },
      { weightKilograms: 35, reps: 5 },
      { weightKilograms: 47.5, reps: 2 },
    ]);
  });
  test('22.5 kg dumbbell, one set', () => {
    expect(warmupSets(22.5, 1, loadProfileFor({ equipment: 'dumbbell' }, 'kg'))).toEqual([
      { weightKilograms: 12.5, reps: 6 },
    ]);
  });
  test('two- and four-set schemes match the agreed fractions', () => {
    expect(warmupSets(100, 2, barbell)).toEqual([
      { weightKilograms: 50, reps: 8 },
      { weightKilograms: 75, reps: 3 },
    ]);
    expect(warmupSets(100, 4, barbell)).toEqual([
      { weightKilograms: 40, reps: 8 },
      { weightKilograms: 55, reps: 5 },
      { weightKilograms: 70, reps: 3 },
      { weightKilograms: 85, reps: 1 },
    ]);
  });
  test('duplicates keep the first reps, and nothing reaches/exceeds working load', () => {
    expect(warmupSets(25, 4, barbell)).toEqual([{ weightKilograms: 20, reps: 8 }]);
    expect(warmupSets(20, 3, barbell)).toEqual([]);
    expect(warmupSets(10, 3, barbell)).toEqual([]);
    expect(warmupSets(0, 3, barbell)).toEqual([]);
    expect(warmupSets(100, 0, barbell)).toEqual([]);
    expect(warmupSets(100, 5, barbell)).toEqual([]);
    expect(warmupSets(NaN, 3, barbell)).toEqual([]);
  });
  test('defaults cover heavy barbell compounds, other compounds, isolation and exclusions', () => {
    expect(defaultWarmupCount(compound)).toBe(3);
    expect(defaultWarmupCount({ ...compound, equipment: 'machine' })).toBe(2);
    expect(defaultWarmupCount({ ...compound, movementPattern: 'lunge' })).toBe(2);
    expect(defaultWarmupCount({ ...compound, mechanic: 'isolation' })).toBe(1);
    expect(defaultWarmupCount({ ...compound, equipment: 'bodyweight' })).toBe(0);
    expect(defaultWarmupCount({ ...compound, equipment: 'band' })).toBe(0);
    expect(defaultWarmupCount({ ...compound, tracking: 'weight-duration' })).toBe(0);
    expect(defaultWarmupCount({ ...compound, mechanic: null })).toBe(0);
    expect(defaultWarmupCount({ ...compound, warmupSetCount: 0 })).toBe(0);
    expect(defaultWarmupCount({ ...compound, warmupSetCount: 4 })).toBe(4);
  });
  test('refresh preserves completed and edited slots, updating only untouched slots', () => {
    const existing = [
      { id: 1, weightKilograms: 40, reps: 8, isCompleted: true },
      { id: 2, weightKilograms: 62, reps: 7, isCompleted: false },
      { id: 3, weightKilograms: 80, reps: 2, isCompleted: false },
    ];
    expect(refreshWarmups(existing, warmupSets(120, 3, barbell), new Set([2]))).toEqual([
      existing[0],
      existing[1],
      { id: 3, weightKilograms: 95, reps: 2 },
    ]);
    expect(refreshWarmups(existing, [], new Set([2]))).toEqual([existing[0], existing[1]]);
  });
  test('refresh never adds duplicates of a protected load', () => {
    const existing = [{ id: 1, weightKilograms: 60, reps: 10, isCompleted: true }];
    expect(refreshWarmups(existing, warmupSets(100, 3, barbell), new Set())).toEqual([
      existing[0],
      { id: null, weightKilograms: 80, reps: 2 },
    ]);
  });
});
