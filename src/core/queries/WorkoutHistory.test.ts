import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { KILOGRAMS_PER_POUND } from '../units/WeightUnit';
import { seedHistoryFixture } from './fixtures/historyFixture';
import { workoutDetail, workoutSummaries, workoutSummary } from './WorkoutHistory';

async function fixtureDatabase() {
  const db = await Database.openInMemory();
  migrate(db);
  return { db, ...seedHistoryFixture(db) };
}

describe('history queries', () => {
  test('Summaries are newest first with counts and tonnage excluding warm-ups', async () => {
    const { db, pushWorkoutId } = await fixtureDatabase();
    const summaries = workoutSummaries(db);
    expect(summaries.map((summary) => summary.name)).toEqual(['Legs', 'Push, heavy']);
    const push = summaries[1];
    expect(push?.id).toBe(pushWorkoutId);
    expect(push?.exerciseCount).toBe(2);
    expect(push?.setCount).toBe(4);
    const expected = 61.23 * 8 + 60 * 6 + 99.21 * KILOGRAMS_PER_POUND * 12;
    expect(push?.volumeKilograms).toBeCloseTo(expected, 6);
  });

  test('Summaries carry the start and end times for the duration', async () => {
    const { db } = await fixtureDatabase();
    const legs = workoutSummaries(db)[0];
    expect(legs?.startedAt).toBe('2024-01-08T10:00:00.000Z');
    expect(legs?.endedAt).toBe('2024-01-08T10:59:00.000Z');
  });

  test('Detail returns entries and sets in logged order', async () => {
    const { db, pushWorkoutId } = await fixtureDatabase();
    const detail = workoutDetail(db, pushWorkoutId);
    expect(detail?.entries.map((entry) => entry.exercise.name)).toEqual([
      'Bench Press (Barbell)',
      'Seated Leg Curl (Machine)',
    ]);
    expect(detail?.entries[0]?.sets.map((set) => set.kind)).toEqual(['warmup', 'working', 'failure']);
    expect(workoutDetail(db, 999)).toBeUndefined();
  });

  test('Detail keeps each set in kilograms with the unit it was typed in', async () => {
    const { db, legsWorkoutId } = await fixtureDatabase();
    const sets = workoutDetail(db, legsWorkoutId)?.entries[0]?.sets ?? [];
    expect(sets.map((set) => set.entryUnit)).toEqual(['lb', 'kg']);
    expect(sets[0]?.weightKilograms).toBeCloseTo(140 * KILOGRAMS_PER_POUND, 9);
    expect(sets[0]?.rpe).toBe(8);
    expect(sets[1]?.rpe).toBeNull();
  });

  test('Detail carries the workout notes and a workout with no sets has no entries', async () => {
    const { db, pushWorkoutId } = await fixtureDatabase();
    expect(workoutDetail(db, pushWorkoutId)?.workout.notes).toBe('Felt good');
    const emptyId = db.run(
      "INSERT INTO workout (startedAt, endedAt, name, source) VALUES ('2024-02-01T10:00:00.000Z', '2024-02-01T10:30:00.000Z', 'Empty', 'app')",
    ).lastInsertRowId;
    expect(workoutDetail(db, emptyId)?.entries).toEqual([]);
    expect(workoutSummary(db, emptyId)).toMatchObject({ exerciseCount: 0, setCount: 0, volumeKilograms: 0 });
  });

  test('A workout in progress never appears in the summaries', async () => {
    const { db } = await fixtureDatabase();
    const liveId = db.run(
      "INSERT INTO workout (startedAt, name, source, isInProgress) VALUES ('2024-03-01T10:00:00.000Z', 'Live', 'app', 1)",
    ).lastInsertRowId;
    expect(workoutSummaries(db).map((summary) => summary.name)).toEqual(['Legs', 'Push, heavy']);
    expect(workoutSummary(db, liveId)).toBeUndefined();
  });

  test('One summary by id matches the list', async () => {
    const { db, pushWorkoutId } = await fixtureDatabase();
    expect(workoutSummary(db, pushWorkoutId)).toEqual(workoutSummaries(db)[1]);
    expect(workoutSummary(db, 999)).toBeUndefined();
  });
});
