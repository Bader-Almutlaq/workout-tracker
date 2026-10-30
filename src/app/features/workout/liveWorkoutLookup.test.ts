import { describe, expect, test } from 'vitest';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { locateSet, plannedSetCount } from './liveWorkoutLookup';
import { makeExercise, makeSet } from './workoutTestData';

function entry(id: number, sets: LiveWorkoutEntry['sets']): LiveWorkoutEntry {
  return {
    entry: { id, workoutId: 1, exerciseId: id, position: id, supersetGroup: null, notes: null },
    exercise: makeExercise({ id }),
    sets,
    previous: [],
  };
}

const entries = [
  entry(1, [makeSet({ id: 10, isCompleted: true }), makeSet({ id: 11 })]),
  entry(2, [makeSet({ id: 20 })]),
];

describe('live workout lookup', () => {
  test('A set is found with its exercise', () => {
    expect(locateSet(entries, 20)?.entry.exercise.id).toBe(2);
    expect(locateSet(entries, 11)?.set.id).toBe(11);
  });

  test('A set that is gone is not found', () => {
    expect(locateSet(entries, 99)).toBeUndefined();
  });

  test('Planned sets are those not yet completed', () => {
    expect(plannedSetCount(entries)).toBe(2);
    expect(plannedSetCount([])).toBe(0);
  });
});
