import { expect, test } from 'vitest';
import type { Exercise } from '../models/Exercise';
import type { WorkoutSet } from '../models/WorkoutSet';
import { toKilograms, valueIn } from '../units/Weight';
import { DeloadPlan } from './DeloadPlan';

const squat: Pick<Exercise, 'equipment' | 'tracking' | 'mechanic' | 'movementPattern' | 'defaultEntryUnit'> = {
  equipment: 'barbell',
  tracking: 'weight-reps',
  mechanic: 'compound',
  movementPattern: 'squat',
  defaultEntryUnit: 'kg',
};
const curl: typeof squat = { ...squat, equipment: 'dumbbell', mechanic: 'isolation', movementPattern: 'elbow-flexion' };
const previous = (weightKilograms: number, reps = 8): Pick<WorkoutSet, 'kind' | 'weightKilograms' | 'reps'>[] => [
  { kind: 'working', weightKilograms, reps },
];

test('100 kg barbell squat gives 80 kg then 90 kg, preserving reps and source data', () => {
  const old = previous(100);
  const before = JSON.stringify(old);
  expect(DeloadPlan.suggestions(old, old, squat, 1)).toEqual([{ weightKilograms: 80, reps: 8, reductionPercent: 20 }]);
  expect(DeloadPlan.suggestions(old, old, squat, 2)).toEqual([{ weightKilograms: 90, reps: 8, reductionPercent: 10 }]);
  expect(JSON.stringify(old)).toBe(before);
});

test('30 kg dumbbell curl rounds 27 down to 25, and 28.5 down to 27.5 (brief example conflicts with down)', () => {
  const old = previous(30, 12);
  expect(DeloadPlan.suggestions(old, old, curl, 1)[0]).toMatchObject({
    weightKilograms: 25,
    reps: 12,
    reductionPercent: 10,
  });
  expect(DeloadPlan.suggestions(old, old, curl, 2)[0]).toMatchObject({
    weightKilograms: 27.5,
    reps: 12,
    reductionPercent: 5,
  });
});

test('pound ladders stay in pounds and honor exact kg overrides', () => {
  const old = previous(toKilograms(100, 'lb'));
  const lift: typeof curl = { ...curl, defaultEntryUnit: 'lb' };
  const first = DeloadPlan.suggestions(old, old, lift, 1)[0];
  const second = DeloadPlan.suggestions(old, old, lift, 2)[0];
  expect(valueIn(first?.weightKilograms ?? 0, 'lb')).toBeCloseTo(90);
  expect(valueIn(second?.weightKilograms ?? 0, 'lb')).toBeCloseTo(95);
  expect(
    DeloadPlan.suggestions(previous(30), old, { ...curl, loadStepKilograms: 1.25 }, 1, 'lb', previous(30))[0]
      ?.weightKilograms,
  ).toBe(26.25);
});

test('bodyweight has no load change and repeats reps, including assisted loads', () => {
  const old = previous(-10, 15);
  const result = DeloadPlan.suggestions(
    old,
    old,
    { ...squat, equipment: 'bodyweight', tracking: 'bodyweight-reps' },
    1,
  );
  expect(result).toEqual([{ weightKilograms: null, reps: 15, reductionPercent: 0 }]);
});

test('stage 2 uses pre-cycle load and immediate previous reps rather than reducing stage 1 again', () => {
  expect(DeloadPlan.suggestions(previous(80, 7), previous(80), squat, 2, 'kg', previous(100))[0]).toEqual({
    weightKilograms: 90,
    reps: 7,
    reductionPercent: 10,
  });
});

test('warm-ups get no suggestion; work kinds retain positions and missing history gets none', () => {
  const old: ReturnType<typeof previous> = [
    { kind: 'warmup', weightKilograms: 20, reps: 5 },
    ...previous(100),
    { kind: 'failure', weightKilograms: 80, reps: 6 },
  ];
  const targets: readonly Pick<WorkoutSet, 'kind'>[] = [
    { kind: 'warmup' },
    { kind: 'working' },
    { kind: 'drop' },
    { kind: 'working' },
  ];
  expect(DeloadPlan.suggestions(old, targets, squat, 1)).toEqual([
    null,
    { weightKilograms: 80, reps: 8, reductionPercent: 20 },
    { weightKilograms: 62.5, reps: 6, reductionPercent: 20 },
    null,
  ]);
  expect(DeloadPlan.suggestions([], targets, squat, 1)).toEqual([null, null, null, null]);
});

test('minimum bars and missing original loads do not invent a heavier baseline', () => {
  expect(DeloadPlan.suggestions(previous(20), previous(20), squat, 1)[0]?.weightKilograms).toBe(20);
  expect(DeloadPlan.suggestions(previous(10), previous(10), squat, 1)[0]?.weightKilograms).toBeNull();
  expect(DeloadPlan.suggestions(previous(80), previous(80), squat, 2, 'kg', [])[0]?.weightKilograms).toBeNull();
});

test('only the warm-up big-barbell classification receives the larger reduction', () => {
  expect(DeloadPlan.reductionPercent({ ...squat, equipment: 'smith-machine' }, 1)).toBe(10);
  expect(DeloadPlan.reductionPercent({ ...squat, mechanic: null }, 1)).toBe(10);
  expect(DeloadPlan.reductionPercent({ ...squat, movementPattern: null }, 1)).toBe(10);
  expect(DeloadPlan.reductionPercent({ ...squat, tracking: 'duration' }, 1)).toBe(0);
});

test('stages advance 1 → 2 → normal without automatic restarts', () => {
  expect(DeloadPlan.nextStage(1)).toBe(2);
  expect(DeloadPlan.nextStage(2)).toBeNull();
  expect(DeloadPlan.nextStage(null)).toBeNull();
});
