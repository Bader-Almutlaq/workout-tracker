import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test, vi } from 'vitest';
import { MuscleDashboardTable } from './MuscleDashboardTable';
import { PinnedLifts } from './PinnedLifts';
import { ActivePlanRow } from './ActivePlanRow';

vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: (key: string) =>
    key.startsWith('pins-')
      ? {
          status: 'ready',
          value: { cards: [], suggestions: [{ id: 1, name: 'Squat (Barbell)' }], ranking: { lifts: [] } },
        }
      : { status: 'ready', value: null },
}));

test('empty pins offer suggestions and no active plan renders no row', () => {
  const pins = renderToStaticMarkup(
    <MemoryRouter>
      <PinnedLifts from="a" to="b" />
    </MemoryRouter>,
  );
  expect(pins).toContain('Pin lifts from an exercise');
  expect(pins).toContain('Pin Squat (Barbell)');
  expect(
    renderToStaticMarkup(
      <MemoryRouter>
        <ActivePlanRow />
      </MemoryRouter>,
    ),
  ).toBe('');
});

test('muscle rows sort by sets and mute fewer than four', () => {
  const rows = [
    { muscle: 'chest' as const, setsPerWeek: 2, strengthChangePercent: null, averageRir: null, shares: [] },
    { muscle: 'quads' as const, setsPerWeek: 8, strengthChangePercent: 2, averageRir: 1, shares: [] },
  ];
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <MuscleDashboardTable muscles={rows} period="12W" />
    </MemoryRouter>,
  );
  expect(html.indexOf('Quads')).toBeLessThan(html.indexOf('Chest'));
  expect(html).toContain('muted');
  expect(html).toContain('/analytics/muscles/chest?period=12W');
});
