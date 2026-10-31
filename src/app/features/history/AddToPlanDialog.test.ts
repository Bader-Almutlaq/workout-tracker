import { jsx as _jsx } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { AddToPlanDialog } from './AddToPlanDialog';
const state = vi.hoisted(() => ({
  active: 2 as number | null,
  folders: [
    { id: 1, name: 'First' },
    { id: 2, name: 'Active' },
  ],
}));
vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: (key: string) => ({
    status: 'ready',
    value: key === 'active-plan' ? state.active : { folders: state.folders },
  }),
}));
test('defaults to the active plan, then the first plan, then a new plan', () => {
  const render = () =>
    renderToStaticMarkup(_jsx(AddToPlanDialog, { workoutId: 1, name: 'Workout', onClose: () => {} }));
  expect(render()).toContain('value="2" selected');
  state.active = null;
  expect(render()).toContain('value="1" selected');
  state.folders = [];
  expect(render()).toContain('Plan name');
});
