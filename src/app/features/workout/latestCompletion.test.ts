import { describe, expect, test } from 'vitest';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { latestCompletion } from './latestCompletion';
import { makeExercise, makeSet } from './workoutTestData';

const bench = makeExercise({ id: 1, name: 'Bench Press (Barbell)' });
const squat = makeExercise({ id: 2, name: 'Squat (Barbell)' });

function entry(exercise = bench, sets = [makeSet()]): LiveWorkoutEntry {
  return {
    entry: { id: exercise.id, workoutId: 1, exerciseId: exercise.id, position: 0, supersetGroup: null, notes: null },
    exercise,
    sets,
    previous: [],
  };
}
const done = (id: number, completedAt: string) => makeSet({ id, isCompleted: true, completedAt });

describe('latestCompletion', () => {
  test('is undefined when nothing is completed', () => {
    expect(latestCompletion([entry()])).toBeUndefined();
    expect(latestCompletion([])).toBeUndefined();
  });

  test('picks the latest completion across exercises', () => {
    const entries = [
      entry(bench, [done(1, '2026-02-01T10:05:00.000Z'), done(2, '2026-02-01T10:10:00.000Z')]),
      entry(squat, [done(3, '2026-02-01T10:07:00.000Z'), makeSet({ id: 4 })]),
    ];
    expect(latestCompletion(entries)).toEqual({ exercise: bench, completedAt: '2026-02-01T10:10:00.000Z' });
  });

  test('belongs to the exercise of the latest set when it is not the first one', () => {
    const entries = [
      entry(bench, [done(1, '2026-02-01T10:05:00.000Z')]),
      entry(squat, [done(2, '2026-02-01T10:12:00.000Z')]),
    ];
    expect(latestCompletion(entries)?.exercise.id).toBe(2);
  });
});
