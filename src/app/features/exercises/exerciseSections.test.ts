import { describe, expect, test } from 'vitest';
import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { groupByInitial, recentExercises } from './exerciseSections';

function entry(id: number, name: string, lastUsedAt: string | null): ExerciseSearchEntry {
  return {
    id,
    name,
    aliases: [],
    equipment: null,
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    isCustom: false,
    usageCount: lastUsedAt === null ? 0 : 1,
    lastUsedAt: lastUsedAt === null ? null : new Date(lastUsedAt),
  };
}

describe('exercise sections', () => {
  test('Recent lists the newest used first and skips never-used exercises', () => {
    const entries = [
      entry(1, 'Curl', '2026-01-01T00:00:00Z'),
      entry(2, 'Press', null),
      entry(3, 'Row', '2026-03-01T00:00:00Z'),
      entry(4, 'Squat', '2026-02-01T00:00:00Z'),
    ];
    expect(recentExercises(entries).map((item) => item.id)).toEqual([3, 4, 1]);
  });

  test('Recent stops at the limit', () => {
    const entries = [1, 2, 3, 4].map((id) => entry(id, `Exercise ${id}`, `2026-01-0${id}T00:00:00Z`));
    expect(recentExercises(entries, 2).map((item) => item.id)).toEqual([4, 3]);
  });

  test('The full list groups by first letter, sorted, with symbols last', () => {
    const groups = groupByInitial([
      entry(1, 'Squat', null),
      entry(2, '21s Curl', null),
      entry(3, 'bench Press', null),
      entry(4, 'Back Extension', null),
    ]);
    expect(groups.map((group) => group.heading)).toEqual(['B', 'S', '#']);
    expect(groups[0]?.entries.map((item) => item.name)).toEqual(['Back Extension', 'bench Press']);
  });
});
