import { isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import type { ExerciseProgressReport } from '../../../core/queries/ExerciseProgress';
import { ExerciseProgressTiles } from './ExerciseProgressTiles';

const state = vi.hoisted(() => ({ selected: null as 'now' | 'best' | null }));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useState: () => [
    state.selected,
    (value: 'now' | 'best' | null) => {
      state.selected = value;
    },
  ],
}));

const source = {
  date: '2026-01-01T12:00:00.000Z',
  set: { weightKilograms: 80, reps: 5, rpe: 8, kind: 'working' as const },
};
const report: ExerciseProgressReport = {
  sessions: [],
  trendNow: 100,
  bestEstimate: { value: 100, date: source.date },
  changes: null,
  latestEstimateSource: source,
  bestEstimateSource: { ...source, set: { ...source.set, rpe: null } },
  curve: { k: 30, kStart: 30, personalSets: 12, isPersonal: true },
  otherWorkouts: [],
  machineBrands: [],
};
function findButton(node: ReactNode, heading: string): (() => void) | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findButton(child, heading);
      if (found !== undefined) return found;
    }
  }
  if (isValidElement<{ children?: ReactNode; onClick?: () => void }>(node)) {
    if (node.type === 'button' && renderToStaticMarkup(node).includes(heading)) return node.props.onClick;
    return findButton(node.props.children, heading);
  }
  return undefined;
}
test('both estimate tiles open a sheet with their source set, effort and curve', () => {
  state.selected = null;
  let tree = ExerciseProgressTiles({ report, unit: 'kg', bodyweight: false });
  const now = findButton(tree, 'e1RM now');
  expect(now).toBeDefined();
  now?.();
  tree = ExerciseProgressTiles({ report, unit: 'kg', bodyweight: false });
  let html = renderToStaticMarkup(tree);
  expect(html).toContain('80 kg × 5');
  expect(html).toContain('2026');
  expect(html).toContain('RPE 8');
  expect(html).toContain('k = 30');
  expect(html).toContain('learned from your sets, n = 12');
  const best = findButton(tree, 'Best e1RM');
  expect(best).toBeDefined();
  best?.();
  html = renderToStaticMarkup(ExerciseProgressTiles({ report, unit: 'kg', bodyweight: false }));
  expect(html).toContain('RPE not logged: counted as 2 reps left');
  expect(html).toContain('80 kg × 5');
});
