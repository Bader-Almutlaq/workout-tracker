import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { liveWorkoutSnapshot } from './LiveWorkout';

test('snapshot returns plain workout data or undefined when absent', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.run(`INSERT INTO workout (id, startedAt, name, source, isInProgress) VALUES (1, '2026-01-01', 'Push', 'app', 1)`);
  expect(liveWorkoutSnapshot(db, 1)).toMatchObject({
    workout: { id: 1, name: 'Push', isInProgress: true },
    entries: [],
  });
  expect(liveWorkoutSnapshot(db, 999)).toBeUndefined();
});
