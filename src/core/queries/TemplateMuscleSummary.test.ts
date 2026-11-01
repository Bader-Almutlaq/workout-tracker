import { expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { templateMuscleSummary } from './TemplateMuscleSummary';

it('counts planned work and workout frequency, including empty templates', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    db.exec(`
      INSERT INTO templateFolder (id, name, position) VALUES (1, 'Plan', 0);
      INSERT INTO template (id, name, folderId, position, createdAt, updatedAt) VALUES
        (1, 'First', 1, 0, 'a', 'a'), (2, 'Second', 1, 1, 'a', 'a'), (3, 'Empty', 1, 2, 'a', 'a');
      INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Press', 'custom', 'a');
      INSERT INTO exerciseMuscle VALUES (1, 'chest', 'primary'), (1, 'triceps', 'secondary');
      INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 1, 0), (2, 2, 1, 0);
      INSERT INTO templateSet (templateExerciseId, position, kind) VALUES
        (1, 0, 'warmup'), (1, 1, 'working'), (1, 2, 'drop'), (1, 3, 'failure'), (2, 0, 'working');
    `);
    const one = templateMuscleSummary(db, { templateId: 1 });
    expect(one).toMatchObject({ sets: 3, workouts: 1, exercises: 1 });
    expect(one.muscles.find((row) => row.muscle === 'chest')).toMatchObject({
      direct: 3,
      indirect: 0,
      fractional: 3,
      frequency: 1,
    });
    expect(one.muscles.find((row) => row.muscle === 'triceps')).toMatchObject({
      direct: 0,
      indirect: 3,
      fractional: 1.5,
      frequency: 1,
    });
    db.exec(`
      INSERT INTO exercise (id, name, source, createdAt) VALUES (2, 'A Press', 'custom', 'a');
      INSERT INTO exerciseMuscle VALUES (2, 'chest', 'primary');
      INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (3, 1, 1, 1), (4, 2, 2, 1);
      INSERT INTO templateSet (templateExerciseId, position, kind) VALUES (3, 0, 'working'), (4, 0, 'working');
    `);
    const plan = templateMuscleSummary(db, { folderId: 1 });
    expect(plan).toMatchObject({ sets: 6, workouts: 3, exercises: 4 });
    expect(plan.muscles.find((row) => row.muscle === 'triceps')).toMatchObject({
      indirect: 5,
      fractional: 2.5,
      frequency: 1,
    });
    const chest = plan.muscles.find((row) => row.muscle === 'chest');
    expect(chest?.contributions).toEqual([
      { exerciseId: 1, name: 'Press', direct: 5, indirect: 0, fractional: 5, workouts: ['First', 'Second'] },
      { exerciseId: 2, name: 'A Press', direct: 1, indirect: 0, fractional: 1, workouts: ['Second'] },
    ]);
    for (const row of plan.muscles) {
      expect(row.contributions.reduce((sum, item) => sum + item.fractional, 0)).toBe(row.fractional);
      expect(row.contributions.reduce((sum, item) => sum + item.direct, 0)).toBe(row.direct);
      expect(row.contributions.reduce((sum, item) => sum + item.indirect, 0)).toBe(row.indirect);
    }
    expect(templateMuscleSummary(db, { templateId: 3 })).toMatchObject({ sets: 0, exercises: 0, workouts: 1 });
  } finally {
    db.close();
  }
});

it('sorts equally weighted contributions by name', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    db.exec(`
      INSERT INTO template (id, name, position, createdAt, updatedAt) VALUES (1, 'Workout', 0, 'a', 'a');
      INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Z Press', 'custom', 'a'), (2, 'A Press', 'custom', 'a');
      INSERT INTO exerciseMuscle VALUES (1, 'chest', 'primary'), (2, 'chest', 'primary');
      INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 1, 0), (2, 1, 2, 1);
      INSERT INTO templateSet (templateExerciseId, position, kind) VALUES (1, 0, 'working'), (2, 0, 'working');
    `);
    const row = templateMuscleSummary(db, { templateId: 1 }).muscles.find((item) => item.muscle === 'chest');
    expect(row?.contributions.map((item) => item.name)).toEqual(['A Press', 'Z Press']);
  } finally {
    db.close();
  }
});
