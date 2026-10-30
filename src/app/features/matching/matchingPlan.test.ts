import { describe, expect, test } from 'vitest';
import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import type { ExerciseCatalogUnmatchedImport } from '../../../core/queries/ExerciseCatalog';
import { mergeQuestion, SUGGESTION_LIMIT, topSuggestionMerges, withSuggestions } from './matchingPlan';

function library(id: number, name: string): ExerciseSearchEntry {
  return {
    id,
    name,
    aliases: [],
    equipment: null,
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    isCustom: false,
    usageCount: 0,
    lastUsedAt: null,
  };
}

function imported(id: number, name: string, workoutCount: number): ExerciseCatalogUnmatchedImport {
  return {
    exercise: {
      id,
      name,
      equipment: null,
      movementPattern: null,
      mechanic: null,
      source: 'strong',
      libraryKey: null,
      isLengthenedBiased: false,
      tracking: 'weight-reps',
      defaultEntryUnit: 'kg',
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    workoutCount,
    setCount: workoutCount * 3,
  };
}

describe('matching plan', () => {
  const bayesian = library(1, 'Bayesian Curl (Cable)');
  const items = withSuggestions(
    [imported(10, 'Bayesian Cable Curl', 236), imported(11, 'Cable Grip', 4)],
    (name, limit) => (name === 'Bayesian Cable Curl' && limit === SUGGESTION_LIMIT ? [bayesian] : []),
  );

  test('Each imported exercise gets the suggestions for its name', () => {
    expect(items[0]?.suggestions).toEqual([bayesian]);
    expect(items[1]?.suggestions).toEqual([]);
  });

  test('Match all proposes the top suggestion and skips exercises without one', () => {
    const merges = topSuggestionMerges(items);
    expect(merges).toHaveLength(1);
    expect(merges[0]?.source.exercise.id).toBe(10);
    expect(merges[0]?.target.id).toBe(1);
  });

  test('The question names both exercises and the sessions that move', () => {
    const [merge] = topSuggestionMerges(items);
    expect(merge && mergeQuestion(merge)).toBe(
      'Move 236 sessions of “Bayesian Cable Curl” into “Bayesian Curl (Cable)”?',
    );
    expect(mergeQuestion({ source: imported(12, 'X', 1), target: bayesian })).toBe(
      'Move 1 session of “X” into “Bayesian Curl (Cable)”?',
    );
  });
});
