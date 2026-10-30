import type { Database } from '../../db/Database';
import { KILOGRAMS_PER_POUND } from '../../units/WeightUnit';

/** Ids of the rows `seedHistoryFixture` writes. */
export interface HistoryFixture {
  readonly pushWorkoutId: number;
  readonly legsWorkoutId: number;
  readonly benchPressId: number;
  readonly legCurlId: number;
}

/** One set to insert: kind, weight as typed, unit, reps, RPE. */
type SeedSet = readonly [kind: string, weight: number, unit: 'kg' | 'lb', reps: number, rpe: number | null];

function seedExercise(db: Database, name: string): number {
  return db.run("INSERT INTO exercise (name, source, createdAt) VALUES (?, 'strong', '2024-01-01T00:00:00.000Z')", [name])
    .lastInsertRowId;
}

function seedWorkout(db: Database, startedAt: string, endedAt: string, name: string, notes: string | null): number {
  return db.run("INSERT INTO workout (startedAt, endedAt, name, notes, source) VALUES (?, ?, ?, ?, 'strong')", [
    startedAt,
    endedAt,
    name,
    notes,
  ]).lastInsertRowId;
}

function seedEntry(db: Database, workoutId: number, exerciseId: number, position: number, sets: readonly SeedSet[]): void {
  const entryId = db.run('INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, ?)', [
    workoutId,
    exerciseId,
    position,
  ]).lastInsertRowId;
  sets.forEach(([kind, weight, unit, reps, rpe], setPosition) => {
    const kilograms = unit === 'kg' ? weight : weight * KILOGRAMS_PER_POUND;
    db.run(
      `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entryId, setPosition, kind, kilograms, unit, reps, rpe],
    );
  });
}

/**
 * Two finished workouts shaped like the native tests' older Strong layout, written directly so
 * the history queries are tested without the importer:
 * - "Push, heavy" (2024-01-01 10:00 UTC, 67 min, with notes): Bench Press (Barbell) warm-up 40 kg × 10,
 *   working 61.23 kg × 8 (RPE 8), failure 60 kg × 6 (RPE 10); Seated Leg Curl (Machine) 99.21 lb × 12 (RPE 7).
 * - "Legs" (2024-01-08 10:00 UTC, 59 min): Seated Leg Curl (Machine) working 140 lb × 10 (RPE 8), drop 63.93 kg × 15.
 */
export function seedHistoryFixture(db: Database): HistoryFixture {
  const benchPressId = seedExercise(db, 'Bench Press (Barbell)');
  const legCurlId = seedExercise(db, 'Seated Leg Curl (Machine)');

  const pushWorkoutId = seedWorkout(db, '2024-01-01T10:00:00.000Z', '2024-01-01T11:07:00.000Z', 'Push, heavy', 'Felt good');
  seedEntry(db, pushWorkoutId, benchPressId, 0, [
    ['warmup', 40, 'kg', 10, null],
    ['working', 61.23, 'kg', 8, 8],
    ['failure', 60, 'kg', 6, 10],
  ]);
  seedEntry(db, pushWorkoutId, legCurlId, 1, [['working', 99.21, 'lb', 12, 7]]);

  const legsWorkoutId = seedWorkout(db, '2024-01-08T10:00:00.000Z', '2024-01-08T10:59:00.000Z', 'Legs', null);
  seedEntry(db, legsWorkoutId, legCurlId, 0, [
    ['working', 140, 'lb', 10, 8],
    ['drop', 63.93, 'kg', 15, null],
  ]);

  return { pushWorkoutId, legsWorkoutId, benchPressId, legCurlId };
}
