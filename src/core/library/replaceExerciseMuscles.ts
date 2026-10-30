import type { Database } from '../db/Database';
import type { Muscle } from './Muscle';

/**
 * Sets an exercise's muscles to exactly `primary` and `secondary`, replacing what was there.
 * The one place `exerciseMuscle` rows are written (seeding and custom exercises both use it).
 */
export function replaceExerciseMuscles(
  db: Database,
  exerciseId: number,
  primary: readonly Muscle[],
  secondary: readonly Muscle[],
): void {
  db.run('DELETE FROM exerciseMuscle WHERE exerciseId = ?', [exerciseId]);
  const insert = 'INSERT INTO exerciseMuscle (exerciseId, muscleId, role) VALUES (?, ?, ?)';
  for (const muscle of primary) db.run(insert, [exerciseId, muscle, 'primary']);
  for (const muscle of secondary) db.run(insert, [exerciseId, muscle, 'secondary']);
}
