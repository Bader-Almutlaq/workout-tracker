import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test, vi } from 'vitest';
import { AnalyticsScreen } from './AnalyticsScreen';
import { SummaryTiles } from './SummaryTiles';
import { LiftTrendList } from './LiftTrendList';
vi.mock('../../data/database', () => ({ database: {}, useDatabaseQuery: () => ({ status: 'loading' }) }));
test('reads view and period from the URL', () => {
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/analytics?view=muscles&period=4W'] },
      createElement(AnalyticsScreen),
    ),
  );
  expect(html).toMatch(/aria-checked="true"[^>]*>Muscles/);
  expect(html).toMatch(/aria-pressed="true"[^>]*>4W/);
});
test('shows comparison and links lift to Charts', () => {
  const current = { workoutsPerWeek: 2, hardSetsPerWeek: 4, secondsPerWeek: 3600, volumePerWeek: 100, workouts: [] };
  const previous = { ...current, workoutsPerWeek: 1 };
  const tiles = renderToStaticMarkup(createElement(SummaryTiles, { current, previous, weeks: 12 }));
  expect(tiles).toContain('+100% vs previous 12 weeks');
  const lifts = [
    {
      id: 7,
      name: 'Bench',
      unit: 'kg' as const,
      sessions: 3,
      latest: 100,
      changePercent: 4.1,
      mixedMachines: false,
      points: [96, 98, 100],
    },
  ];
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(LiftTrendList, { lifts })));
  expect(html).toContain('/exercises/7?tab=charts');
  expect(html).toContain('+4.1%');
});
