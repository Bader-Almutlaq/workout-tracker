import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { ExerciseDetailScreen } from './ExerciseDetailScreen';

const queryKeys = vi.hoisted(() => new Set<string>());
const detail: ExerciseCatalogDetail = {
  exercise: {
    id: 1,
    name: 'Synthetic exercise',
    equipment: 'barbell',
    movementPattern: 'horizontal-push',
    mechanic: 'compound',
    source: 'custom',
    libraryKey: null,
    isLengthenedBiased: false,
    tracking: 'weight-reps',
    defaultEntryUnit: 'kg',
    restTargetSeconds: null,
    isArchived: false,
    createdAt: '2026-01-01',
  },
  primaryMuscles: [],
  secondaryMuscles: [],
  aliases: [],
  workoutCount: 0,
  setCount: 0,
  warmupCount: 0,
  firstUsedAt: null,
  lastUsedAt: null,
  recentSessions: [],
};
vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: (key: string) => {
    queryKeys.add(key);
    return key === 'exercise-1' ? { status: 'ready', value: detail } : { status: 'loading' };
  },
}));
beforeEach(() => queryKeys.clear());

function render(url: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/exercises/:exerciseId', element: createElement(ExerciseDetailScreen) }),
      ),
    ),
  );
}

test.each([
  ['summary', 'exercise-strength-1'],
  ['history', 'exercise-history-1-0'],
  ['charts', 'exercise-progress-1-undefined-null'],
  ['records', 'exercise-records-1'],
])('the %s URL selects that section and queries only its data', (tab, key) => {
  const markup = render(`/exercises/1?tab=${tab}`);
  expect(markup).toContain('Exercise sections');
  expect(queryKeys).toEqual(new Set(tab === 'summary' ? ['exercise-1', key, 'pinned-exercises'] : ['exercise-1', key]));
  expect(markup).toContain('aria-checked="true"');
});

test('How-to URL loads no history, chart or record query and renders its empty state', () => {
  const markup = render('/exercises/1?tab=how-to');
  expect(markup).toContain('No instructions for this exercise.');
  expect(queryKeys).toEqual(new Set(['exercise-1']));
});

test('invalid URL tab opens Summary', () => {
  render('/exercises/1?tab=invalid');
  expect(queryKeys).toEqual(new Set(['exercise-1', 'exercise-strength-1', 'pinned-exercises']));
});
