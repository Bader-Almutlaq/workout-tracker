import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test, vi } from 'vitest';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { ExerciseActions } from './ExerciseActions';

const state = vi.hoisted(() => ({ pinned: false }));
vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: () => ({ status: 'ready', value: state.pinned ? [{ exerciseId: 1 }] : [] }),
}));
const detail: ExerciseCatalogDetail = {
  exercise: {
    id: 1,
    name: 'Test lift',
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
  firstUsedAt: null,
  lastUsedAt: null,
  recentSessions: [],
};
test('exercise actions offer pin or unpin according to stored state', () => {
  state.pinned = false;
  const unpinned = renderToStaticMarkup(
    <MemoryRouter>
      <ExerciseActions detail={detail} />
    </MemoryRouter>,
  );
  expect(unpinned).toContain('Pin to Analytics');
  state.pinned = true;
  const pinned = renderToStaticMarkup(
    <MemoryRouter>
      <ExerciseActions detail={detail} />
    </MemoryRouter>,
  );
  expect(pinned).toContain('Unpin from Analytics');
});
