import { describe, expect, test } from 'vitest';
import type { WorkoutSummary } from './WorkoutHistory';
import { groupWorkoutsByMonth } from './WorkoutMonthGroups';

function summary(id: number, startedAt: string): WorkoutSummary {
  return { id, startedAt, endedAt: null, name: `Workout ${id}`, exerciseCount: 0, setCount: 0, volumeKilograms: 0 };
}

describe('groupWorkoutsByMonth', () => {
  test('Groups newest month first and keeps the order inside a month', () => {
    const groups = groupWorkoutsByMonth(
      [
        summary(4, '2024-02-03T10:00:00.000Z'),
        summary(3, '2024-01-20T10:00:00.000Z'),
        summary(2, '2024-01-08T10:00:00.000Z'),
        summary(1, '2023-12-30T10:00:00.000Z'),
      ],
      'UTC',
    );
    expect(groups.map((group) => [group.year, group.month, group.workouts.map((workout) => workout.id)])).toEqual([
      [2024, 2, [4]],
      [2024, 1, [3, 2]],
      [2023, 12, [1]],
    ]);
  });

  test('Uses the time zone: a late session on the 31st stays in its own month', () => {
    // 22:30 UTC on 31 January is 01:30 on 1 February in Riyadh (UTC+3).
    const late = summary(1, '2024-01-31T22:30:00.000Z');
    expect(groupWorkoutsByMonth([late], 'UTC')[0]?.month).toBe(1);
    expect(groupWorkoutsByMonth([late], 'Asia/Riyadh')[0]?.month).toBe(2);
  });

  test('No workouts gives no groups', () => {
    expect(groupWorkoutsByMonth([], 'UTC')).toEqual([]);
  });
});
