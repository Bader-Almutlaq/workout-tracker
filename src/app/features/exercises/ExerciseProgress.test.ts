import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, test, vi } from 'vitest';
import type { ExerciseProgressReport } from '../../../core/queries/ExerciseProgress';
import { ExerciseChartsTab } from './ExerciseChartsTab';
import { ExerciseProgressContent } from './ExerciseProgressContent';
import { progressTopSetText } from './progressText';

const state = vi.hoisted((): { report: ExerciseProgressReport | null; status: string; message: string } => ({
  report: null,
  status: 'ready',
  message: 'Could not load progress',
}));
const report: ExerciseProgressReport = {
  sessions: [
    {
      date: '2026-01-01T12:00:00.000Z',
      workoutId: 1,
      isDeload: false,
      bestEstimatedOneRepMax: 100,
      topSet: { weightKilograms: 80, reps: 5, rpe: 8 },
      workingSetCount: 3,
      averageRpe: 8,
    },
    {
      date: '2026-01-08T12:00:00.000Z',
      workoutId: 2,
      isDeload: true,
      bestEstimatedOneRepMax: 80,
      topSet: { weightKilograms: 60, reps: 5, rpe: null },
      workingSetCount: 2,
      averageRpe: null,
    },
  ],
  trendNow: 100,
  bestEstimate: { value: 100, date: '2026-01-01' },
  changes: null,
  otherWorkouts: [{ id: 20, name: 'Light day', weekday: 4 }],
  machineBrands: ['Panatta', null],
};
vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: (key: string) =>
    key.startsWith('exercise-comparisons-')
      ? { status: 'ready', value: [] }
      : { status: state.status, value: state.report, message: state.message },
}));
beforeEach(() => {
  state.report = report;
  state.status = 'ready';
});
function render(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(MemoryRouter, null, element));
}
test('Progress renders three tiles, five named session charts, deload markers and table controls', () => {
  const markup = render(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'weight-reps', templateId: 10 }));
  for (const label of [
    'e1RM now',
    'Best e1RM',
    'Top set',
    'Best-set e1RM',
    'Top-set weight',
    'Reps on the top set',
    'Working sets',
    'Average RPE',
    'Show as table',
    'Deload',
    'Machine filter',
  ])
    expect(markup).toContain(label);
  expect(markup).toContain('100 kg');
  expect(markup).toContain('Compare days');
  expect(markup).toContain('Light day');
  expect(markup).toContain('Latest non-deload: 80 kg');
});
test('compare chips appear only in a saved workout with other workouts', () => {
  const all = render(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'weight-reps' }));
  expect(all).toContain('By workout');
  expect(all).not.toContain('Compare days');
  const single = render(
    createElement(ExerciseProgressContent, {
      report: { ...report, otherWorkouts: [] },
      exerciseId: 1,
      templateId: 10,
      unit: 'kg',
      bodyweight: false,
    }),
  );
  expect(single).not.toContain('Compare days');
});
test('bodyweight additions retain plus, and lb conversion happens in display text', () => {
  expect(progressTopSetText({ weightKilograms: 20, reps: 8, rpe: 8 }, 'kg', true)).toBe('+20 kg × 8 @ RPE 8');
  expect(progressTopSetText({ weightKilograms: -20, reps: 8, rpe: null }, 'kg', true)).toBe('-20 kg × 8');
  expect(progressTopSetText({ weightKilograms: 0, reps: 8, rpe: null }, 'kg', true)).toBe('Bodyweight × 8');
  expect(render(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'weight-reps', unit: 'lb' }))).toContain(
    '220.46 lb',
  );
});
test('empty, loading and error states are readable', () => {
  state.report = { ...report, sessions: [], trendNow: null, bestEstimate: null, otherWorkouts: [], machineBrands: [] };
  expect(render(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'weight-reps' }))).toContain(
    'No qualifying sessions yet.',
  );
  state.status = 'loading';
  expect(render(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'weight-reps' }))).toContain('Loading…');
  state.status = 'failed';
  expect(render(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'weight-reps' }))).toContain(
    'Could not load progress',
  );
});
