import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { WeeklyCharts } from './WeeklyCharts';
import * as sets from './WeeklySetsChart';
import * as effort from './WeeklyEffortChart';

const worker = vi.hoisted(() => ({ firstFinishedWorkout: vi.fn(), weeklyEffort: vi.fn() }));
vi.mock('../../data/database', () => ({ database: worker }));
beforeEach(() => {
  worker.firstFinishedWorkout.mockResolvedValue('2024-01-01T12:00:00Z');
  worker.weeklyEffort.mockResolvedValue([{ weekStart: '2024-01-01', hardSets: 12, averageRir: null, hasDeload: true }]);
});
afterEach(() => vi.restoreAllMocks());

test('period-filtered inline charts load whole history only on expansion and retain missing effort', async () => {
  const setsRender = vi.spyOn(sets, 'WeeklySetsChart');
  const effortRender = vi.spyOn(effort, 'WeeklyEffortChart');
  renderToStaticMarkup(
    createElement(WeeklyCharts, {
      points: [{ weekStart: '2026-01-05', hardSets: 2, averageRir: 3, hasDeload: false }],
    }),
  );
  expect(worker.firstFinishedWorkout).not.toHaveBeenCalled();
  const loadSets = setsRender.mock.calls[0]?.[0].loadHistory;
  const loadEffort = effortRender.mock.calls[0]?.[0].loadHistory;
  if (loadSets === undefined || loadEffort === undefined) throw new Error('Expected full-history loaders');
  expect(await loadSets()).toEqual([
    { name: 'Weekly hard sets', points: [{ date: '2024-01-01', value: 12, deload: true }] },
  ]);
  expect(await loadEffort()).toEqual([
    { name: 'Weekly effort', points: [{ date: '2024-01-01', value: null, deload: true }] },
  ]);
  expect(worker.weeklyEffort).toHaveBeenCalledWith('2024-01-01T12:00:00Z', expect.any(String));
});

test('plan charts already have scoped whole history and never offer a global-history loader', () => {
  const setsRender = vi.spyOn(sets, 'WeeklySetsChart');
  const effortRender = vi.spyOn(effort, 'WeeklyEffortChart');
  renderToStaticMarkup(createElement(WeeklyCharts, { points: [], completeHistory: true }));
  expect(setsRender.mock.calls[0]?.[0].loadHistory).toBeUndefined();
  expect(effortRender.mock.calls[0]?.[0].loadHistory).toBeUndefined();
});
