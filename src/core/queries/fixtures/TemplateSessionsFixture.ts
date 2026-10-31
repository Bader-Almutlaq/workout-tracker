import type { Database } from '../../db/Database';

/** Small synthetic history: two plans, a never-performed workout and an unfiled workout; no owner data. */
export const TemplateSessionsFixture = Object.freeze({
  /** Seeds a migrated empty database with completed, warm-up, incomplete and ongoing examples. */
  seed(db: Database): void {
    db.exec(`
      INSERT INTO exercise (id, name, source, createdAt, equipment, mechanic, movementPattern)
      VALUES (1, 'Synthetic press', 'custom', '2024-01-01', 'barbell', 'compound', 'horizontal-push'),
             (2, 'Synthetic row', 'custom', '2024-01-01', 'dumbbell', 'compound', 'horizontal-pull');
      INSERT INTO templateFolder (id, name, position) VALUES (1, 'Plan Alpha', 0), (2, 'Plan Beta', 1);
      INSERT INTO template (id, name, folderId, position, createdAt, updatedAt)
      VALUES (1, 'Workout Alpha', 1, 0, '2024-01-01', '2024-01-01'),
             (2, 'Workout Delta', 1, 1, '2024-01-01', '2024-01-01'),
             (3, 'Workout Beta', 2, 0, '2024-01-01', '2024-01-01'),
             (4, 'Workout Solo', NULL, 0, '2024-01-01', '2024-01-01'),
             (5, 'Workout Empty', 1, 2, '2024-01-01', '2024-01-01');
      INSERT INTO templateExercise (templateId, exerciseId, position) VALUES (1, 1, 0), (1, 2, 1);
      INSERT INTO workout (id, name, templateId, startedAt, endedAt, source, isInProgress)
      VALUES (1, 'Earlier Alpha', 1, '2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z', 'app', 0),
             (2, 'Later Alpha', 1, '2024-01-01T17:00:00Z', NULL, 'app', 0),
             (3, 'Delta', 2, '2024-01-03T09:00:00Z', '2024-01-03T09:30:00Z', 'app', 0),
             (4, 'Beta', 3, '2024-01-04T09:00:00Z', '2024-01-04T09:45:00Z', 'app', 0),
             (5, 'Solo', 4, '2024-01-05T09:00:00Z', '2024-01-05T09:20:00Z', 'app', 0),
             (6, 'Active Alpha', 1, '2024-01-06T09:00:00Z', NULL, 'app', 1);
      INSERT INTO workoutExercise (id, workoutId, exerciseId, position)
      VALUES (1, 1, 1, 0), (2, 2, 1, 0), (3, 3, 2, 0), (4, 4, 2, 0),
             (5, 5, 2, 0), (6, 6, 1, 0), (7, 1, 1, 1), (8, 1, 2, 2);
      INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted)
      VALUES (1, 0, 'warmup', 200, 'kg', 1, 10, 1),
             (1, 1, 'working', 50, 'kg', 5, 10, 1),
             (1, 2, 'drop', 40, 'kg', 5, NULL, 1),
             (1, 3, 'working', 900, 'kg', 5, 10, 0),
             (2, 0, 'failure', 60, 'kg', 1, NULL, 1),
             (3, 0, 'working', 10, 'kg', 5, 2, 1),
             (4, 0, 'working', 10, 'kg', 5, NULL, 1),
             (5, 0, 'working', 10, 'kg', 5, NULL, 1),
             (6, 0, 'working', 500, 'kg', 1, 10, 1),
             (7, 0, 'failure', 70, 'kg', 1, NULL, 1),
             (8, 0, 'failure', 100, 'kg', 1, NULL, 1);
    `);
  },
});
