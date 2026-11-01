import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test, vi } from 'vitest';
import { ActivePlanRow } from './ActivePlanRow';
import { PinnedLifts } from './PinnedLifts';
import styles from './Analytics.module.css';

vi.mock('../../data/database', () => ({
  database: {},
  messageOf: String,
  useDatabaseQuery: (key: string) =>
    key.startsWith('pins-')
      ? {
          status: 'ready',
          value: { cards: [], suggestions: [{ id: 1, name: 'Bench Press (Barbell)' }], ranking: { lifts: [] } },
        }
      : { status: 'ready', value: { folder: { id: 2, name: 'Upper lower' }, first: undefined, now: 0 } },
}));

test('pin suggestions are individual chip buttons', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <PinnedLifts from="a" to="b" />
    </MemoryRouter>,
  );
  expect(html).toContain(styles.pins);
  expect(html).toMatch(/<button[^>]*>\+ Bench Press \(Barbell\)<\/button>/);
});

test('active plan links directly to analytics with its row style', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <ActivePlanRow />
    </MemoryRouter>,
  );
  expect(html).toContain('/workout/plans/2?tab=analytics');
  expect(html).toContain(styles.plan);
  expect(html).toContain('Plan analytics');
});
