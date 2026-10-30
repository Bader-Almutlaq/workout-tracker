import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { workoutDaysInMonth } from './WorkoutCalendar';

describe('workoutDaysInMonth', () => {
  test('groups finished workouts by local day across month boundaries', async () => {
    const db = await Database.openInMemory();
    migrate(db);
    const add = (date: Date, inProgress = 0) =>
      db.run("INSERT INTO workout (startedAt, name, source, isInProgress) VALUES (?, 'Synthetic', 'app', ?)", [
        date.toISOString(),
        inProgress,
      ]).lastInsertRowId;
    const last = add(new Date(2024, 0, 31, 23, 30));
    const earlier = add(new Date(2024, 0, 31, 12));
    const next = add(new Date(2024, 1, 1, 0, 30));
    add(new Date(2024, 0, 15, 12), 1);
    expect(workoutDaysInMonth(db, 2024, 1)).toEqual([{ date: '2024-01-31', workoutIds: [last, earlier] }]);
    expect(workoutDaysInMonth(db, 2024, 2)).toEqual([{ date: '2024-02-01', workoutIds: [next] }]);
    expect(workoutDaysInMonth(db, 2024, 3)).toEqual([]);
    db.close();
  });
});
