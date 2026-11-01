import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { ExerciseProgress } from './ExerciseProgress';
import { ExerciseSeries } from './ExerciseSeries';
import { ExerciseStrength } from './ExerciseStrength';
import { ExerciseCurve } from './ExerciseCurve';
import { RepMaxTable } from './RepMaxTable';
import { TemplateSessions } from './TemplateSessions';
import { workoutComparison } from './WorkoutComparison';

let db: Database;
const now = new Date('2026-12-01');
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, equipment, movementPattern, mechanic, source, createdAt)
    VALUES (1, 'Synthetic bench', 'barbell', 'horizontal-push', 'compound', 'custom', '2026-01-01');
    INSERT INTO template (id, name, weekday, position, createdAt, updatedAt)
    VALUES (10, 'Heavy', 1, 0, '2026-01-01', '2026-01-01'), (20, 'Light', 4, 1, '2026-01-01', '2026-01-01');
    INSERT INTO templateExercise (templateId, exerciseId, position) VALUES (10, 1, 0), (20, 1, 0);
  `);
});
afterEach(() => db.close());
function add(
  day: number,
  weight = 100,
  reps = 5,
  template = 10,
  deload = false,
  rpe: number | null = 8,
  completed = true,
  inProgress = false,
): number {
  const workoutId = db.run(
    `
    INSERT INTO workout (startedAt, name, templateId, source, isInProgress)
    VALUES (?, 'Synthetic', ?, 'app', ?)
  `,
    [`2026-01-${String(day).padStart(2, '0')}T12:00:00.000Z`, template, inProgress ? 1 : 0],
  ).lastInsertRowId;
  const entryId = db.run(
    `
    INSERT INTO workoutExercise (workoutId, exerciseId, position, deloadStage, machineBrand)
    VALUES (?, 1, 0, ?, 'Panatta')
  `,
    [workoutId, deload ? 1 : null],
  ).lastInsertRowId;
  db.run(
    `
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, reps, rpe, isCompleted, entryUnit)
    VALUES (?, 0, 'working', ?, ?, ?, ?, 'kg')
  `,
    [entryId, weight, reps, rpe, completed ? 1 : 0],
  );
  return workoutId;
}

describe('ExerciseProgress', () => {
  it('preserves sessions, chooses heaviest then more reps, and averages only logged working RPE', () => {
    const id = add(1);
    const entry = db.value<number>('SELECT id FROM workoutExercise WHERE workoutId = ?', [id]) ?? 0;
    db.run(
      `
      INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, reps, rpe, isCompleted, entryUnit)
      VALUES (?, 1, 'drop', 100, 8, NULL, 1, 'kg'), (?, 2, 'failure', 90, 10, 10, 1, 'kg'),
             (?, 3, 'warmup', 200, 1, 10, 1, 'kg'), (?, 4, 'working', 300, 1, 10, 0, 'kg')
    `,
      [entry, entry, entry, entry],
    );
    const session = ExerciseProgress(db, 1, now).sessions[0];
    expect(session).toMatchObject({
      workoutId: id,
      topSet: { weightKilograms: 100, reps: 8, rpe: null },
      workingSetCount: 3,
      averageRpe: 9,
    });
  });
  it('skips deloads in four-session changes and headline trend, retaining raw points and best', () => {
    add(1, 100);
    add(2, 101);
    add(3, 200, 5, 10, true);
    add(4, 102);
    add(5, 103);
    expect(ExerciseProgress(db, 1, now, 10).changes).toBeNull();
    add(6, 104);
    const report = ExerciseProgress(db, 1, now, 10);
    expect(report.sessions).toHaveLength(6);
    expect(report.changes?.estimatedOneRepMaxPercent).toBeCloseTo(4);
    expect(report.changes?.topSet).toMatchObject({ before: { weightKilograms: 100 }, after: { weightKilograms: 104 } });
    expect(report.changes?.workingSetCount).toEqual({ before: 1, after: 1 });
    expect(report.bestEstimate?.value).toBeCloseTo(200 * (1 + 6 / 29));
    expect(report.bestEstimateSource?.set).toMatchObject({ weightKilograms: 200, reps: 5, rpe: 8 });
    expect(report.latestEstimateSource?.set.weightKilograms).toBe(104);
    expect(report.curve).toMatchObject({ k: 29, isPersonal: false });
    expect(report.trendNow).toBeLessThan(104 * (1 + 6 / 29));
  });
  it('scopes sessions and comparisons by template and machine; other workouts exclude the current one', () => {
    const first = add(1);
    const second = add(1, 50, 10, 20, false, null);
    expect(ExerciseProgress(db, 1, now).sessions.map((session) => session.workoutId)).toEqual([first, second]);
    const scoped = ExerciseProgress(db, 1, now, 10);
    expect(scoped.sessions.map((session) => session.workoutId)).toEqual([first]);
    expect(scoped.otherWorkouts).toEqual([{ id: 20, name: 'Light', weekday: 4 }]);
    expect(ExerciseProgress(db, 1, now, 20).sessions[0]?.averageRpe).toBeNull();
    expect(ExerciseProgress(db, 1, now, 10, 'Atlas').sessions).toEqual([]);
  });
  it('returns null changes below five sessions and empty estimates without completed work', () => {
    for (let day = 1; day <= 4; day += 1) {
      add(day);
      expect(ExerciseProgress(db, 1, now).changes).toBeNull();
    }
    add(5, 100, 5, 10, false, 8, true, true);
    add(6, 100, 5, 20, false, 8, false);
    expect(ExerciseProgress(db, 1, now, 10).sessions).toHaveLength(4);
    expect(ExerciseProgress(db, 1, now, 20).sessions[0]).toMatchObject({
      topSet: null,
      workingSetCount: 0,
      averageRpe: null,
      bestEstimatedOneRepMax: null,
    });
    expect(ExerciseProgress(db, 999, now)).toMatchObject({
      sessions: [],
      trendNow: null,
      bestEstimate: null,
      changes: null,
      otherWorkouts: [],
    });
  });
  it('uses one global fitted curve across scope, strength, records, saved-workout charts and comparison', () => {
    let lastId = 0;
    for (let index = 0; index < 10; index += 1) {
      const reps = index % 2 === 0 ? 3 : 8;
      lastId = add(index + 1, 100 / (1 + (reps - 1) / 20), reps, index % 2 === 0 ? 10 : 20, false, 10);
    }
    const history = ExerciseSeries.read(db, 1, now);
    expect(history.exercise?.strengthCurve).toEqual({ k: 25.4, kStart: 29, personalSets: 10, isPersonal: true });
    const report = ExerciseProgress(db, 1, now, 10);
    const expected = (100 / 1.1) * (1 + 2 / 25.4);
    expect(report.sessions[0]?.bestEstimatedOneRepMax).toBeCloseTo(expected);
    expect(ExerciseStrength.series(db, 1, now).sessions[0]?.e1rmKilograms).toBeCloseTo(expected);
    expect(RepMaxTable(db, 1, now).estimatedOneRepMax?.value).toBeCloseTo(expected);
    expect(TemplateSessions.read(db, { templateId: 10 }).sessions[0]?.bestEstimatedOneRepMaxKilograms).toBeCloseTo(
      expected,
    );
    const expectedEight = (100 / 1.35) * (1 + 7 / 25.4);
    expect(workoutComparison(db, lastId)?.exercises[0]?.currentEstimate).toBeCloseTo(expectedEight);
    expect(
      ExerciseCurve(
        db,
        1,
        history.exercise ?? { equipment: null, movementPattern: null, mechanic: null, tracking: 'weight-reps' },
        new Date('2026-01-09'),
      ).isPersonal,
    ).toBe(false);
  });
});
