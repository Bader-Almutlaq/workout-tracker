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
    const plan = templateMuscleSummary(db, { folderId: 1 });
    expect(plan).toMatchObject({ sets: 4, workouts: 3, exercises: 2 });
    expect(plan.muscles.find((row) => row.muscle === 'triceps')).toMatchObject({
      indirect: 4,
      fractional: 2,
      frequency: 1,
    });
    expect(templateMuscleSummary(db, { templateId: 3 })).toMatchObject({ sets: 0, exercises: 0, workouts: 1 });
  } finally {
    db.close();
  }
});
