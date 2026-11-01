import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { WeeklyEffort } from './WeeklyEffort';

async function fixture() {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Press', 'custom', '2024-01-01');
    INSERT INTO exerciseMuscle (exerciseId, muscleId, role) VALUES (1, 'chest', 'primary');
    INSERT INTO templateFolder (id, name, position) VALUES (1, 'Plan', 0), (2, 'Other plan', 1);
    INSERT INTO template (id, name, folderId, position, createdAt, updatedAt)
    VALUES (1, 'Press', 1, 0, 'a', 'a'), (2, 'Other', 2, 1, 'a', 'a');
    INSERT INTO workout (id, name, source, startedAt, isInProgress, templateId) VALUES
      (1, 'Logged effort', 'app', '2024-01-02T12:00:00.000Z', 0, 1),
      (2, 'No effort', 'app', '2024-01-16T12:00:00.000Z', 0, 1),
      (3, 'No hard sets', 'app', '2024-01-23T12:00:00.000Z', 0, 1),
      (4, 'Other scope', 'app', '2024-01-09T12:00:00.000Z', 0, 2),
      (5, 'Still logging', 'app', '2024-01-30T12:00:00.000Z', 1, 1);
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position, deloadStage) VALUES
      (1, 1, 1, 0, 1), (2, 2, 1, 0, NULL), (3, 3, 1, 0, NULL), (4, 4, 1, 0, NULL), (5, 5, 1, 0, NULL);
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES
      (1, 0, 'working', 50, 'kg', 8, 8, 1), (1, 1, 'working', 50, 'kg', 8, NULL, 1),
      (2, 0, 'working', 50, 'kg', 8, NULL, 1),
      (3, 0, 'working', 50, 'kg', 8, 5, 1),
      (4, 0, 'working', 50, 'kg', 8, 8, 1),
      (5, 0, 'working', 50, 'kg', 8, 8, 1);
  `);
  return db;
}

const from = new Date(2024, 0, 1);
const to = new Date(2024, 1, 4);

test('omits weeks without finished sessions in scope, keeps unknown effort null and real hard-set zeros', async () => {
  const db = await fixture();
  try {
    const expected = [
      { weekStart: '2024-01-01', hardSets: 2, averageRir: 2, hasDeload: true },
      { weekStart: '2024-01-15', hardSets: 1, averageRir: null, hasDeload: false },
      { weekStart: '2024-01-22', hardSets: 0, averageRir: 5, hasDeload: false },
    ];
    expect(WeeklyEffort(db, from, to, 'chest', { folderId: 1 })).toEqual(expected);
    expect(WeeklyEffort(db, from, to, 'chest', { templateId: 1 })).toEqual(expected);
    expect(WeeklyEffort(db, from, to).map((week) => week.weekStart)).toEqual([
      '2024-01-01',
      '2024-01-08',
      '2024-01-15',
      '2024-01-22',
    ]);
  } finally {
    db.close();
  }
});

test('retains zero muscle hard sets when finished sessions trained other muscles', async () => {
  const db = await fixture();
  try {
    expect(WeeklyEffort(db, from, new Date(2024, 0, 7), 'biceps')).toEqual([
      { weekStart: '2024-01-01', hardSets: 0, averageRir: null, hasDeload: false },
    ]);
  } finally {
    db.close();
  }
});

test('keeps warm-up-only and empty finished sessions as real zero weeks', async () => {
  const db = await fixture();
  try {
    db.exec(`
      UPDATE workout SET isInProgress = 0 WHERE id = 5;
      DELETE FROM workoutSet WHERE workoutExerciseId = 5;
      UPDATE workoutSet SET kind = 'warmup' WHERE workoutExerciseId = 3;
    `);
    expect(WeeklyEffort(db, from, to, undefined, { folderId: 1 }).slice(-2)).toEqual([
      { weekStart: '2024-01-22', hardSets: 0, averageRir: null, hasDeload: false },
      { weekStart: '2024-01-29', hardSets: 0, averageRir: null, hasDeload: false },
    ]);
  } finally {
    db.close();
  }
});

test('returns no points without finished sessions and clips partial weeks to selected local dates', async () => {
  const db = await fixture();
  try {
    expect(WeeklyEffort(db, new Date(2024, 0, 3), new Date(2024, 0, 8))).toEqual([]);
    expect(WeeklyEffort(db, to, from)).toEqual([]);
    expect(WeeklyEffort(db, new Date('invalid'), to)).toEqual([]);
  } finally {
    db.close();
  }
});
