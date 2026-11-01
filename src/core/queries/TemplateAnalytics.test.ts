import { expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { TemplateAnalytics } from './TemplateAnalytics';

it('scopes sessions and exercises, excludes deloads from changes, and averages completed weeks', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    db.exec(`
      INSERT INTO templateFolder (id, name, position) VALUES (1, 'Plan', 0), (2, 'Other', 1);
      INSERT INTO template (id, name, folderId, position, createdAt, updatedAt) VALUES
        (1, 'Heavy', 1, 0, 'a', 'a'), (2, 'Light', 1, 1, 'a', 'a'), (3, 'Other', 2, 0, 'a', 'a');
      INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Press', 'custom', 'a');
      INSERT INTO exerciseMuscle VALUES (1, 'chest', 'primary'), (1, 'triceps', 'secondary');
      INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 1, 0), (2, 2, 1, 0), (3, 3, 1, 0);
      INSERT INTO templateSet (templateExerciseId, position, kind) VALUES
        (1, 0, 'working'), (1, 1, 'warmup'), (2, 0, 'working'), (3, 0, 'working');
    `);
    for (let index = 0; index < 7; index += 1) {
      const day = String(5 + index).padStart(2, '0');
      const template = index === 6 ? 2 : 1;
      const workout = db.run(
        `INSERT INTO workout (startedAt, endedAt, name, templateId, source, isInProgress)
        VALUES (?, ?, 'Session', ?, 'app', 0)`,
        [`2026-01-${day}T12:00:00Z`, `2026-01-${day}T13:00:00Z`, template],
      ).lastInsertRowId;
      const entry = db.run(
        `INSERT INTO workoutExercise (workoutId, exerciseId, position, deloadStage)
        VALUES (?, 1, 0, ?)`,
        [workout, index === 2 ? 1 : null],
      ).lastInsertRowId;
      db.run(
        `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, reps, rpe, isCompleted, entryUnit)
        VALUES (?, 0, 'working', ?, 5, 8, 1, 'kg')`,
        [entry, index === 2 ? 200 : 100 + index],
      );
    }
    const now = new Date('2026-01-19T12:00:00Z');
    const workout = TemplateAnalytics(db, { templateId: 1 }, now);
    expect(workout.sessionCount).toBe(6);
    expect(workout.typicalSessionSeconds).toBe(3600);
    expect(workout.lastSession).toEqual({ workingSets: 1, plannedWorkingSets: 1 });
    expect(workout.perSession[2]).toMatchObject({ isDeload: true, hardSets: 1, averageRir: 2 });
    expect(workout.exercises[0]?.exercises[0]?.changes?.topSet).toMatchObject({
      before: { weightKilograms: 100 },
      after: { weightKilograms: 105 },
    });
    const plan = TemplateAnalytics(db, { folderId: 1 }, now);
    expect(plan).toMatchObject({ sessionCount: 7, weeksAvailable: 2, sessionsPerWeek: 3.5, plannedWorkouts: 2 });
    expect(plan.weekly[0]).toMatchObject({ hardSets: 7, hasDeload: true, averageRir: 2 });
    expect(plan.musclesDoneVsPlanned.find((row) => row.muscle === 'chest')).toMatchObject({
      done: 3.5,
      planned: 2,
      contributions: [{ exerciseId: 1, fractional: 3.5 }],
    });
    expect(plan.musclesDoneVsPlanned.find((row) => row.muscle === 'triceps')).toMatchObject({ done: 1.75, planned: 1 });
    expect(TemplateAnalytics(db, { folderId: 2 }, now)).toMatchObject({
      sessionCount: 0,
      weeksAvailable: 0,
      sessionsPerWeek: null,
    });
  } finally {
    db.close();
  }
});
