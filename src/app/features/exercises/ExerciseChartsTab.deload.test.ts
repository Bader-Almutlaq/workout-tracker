import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { ExerciseChartsTab } from './ExerciseChartsTab';
import * as chart from './ExerciseChart';

vi.mock('../../data/database', () => ({
  database: {},
  useDatabaseQuery: () => ({
    status: 'ready',
    value: {
      deloadDates: ['2026-01-02'],
      estimatedOneRepMax: [
        { date: '2026-01-01', value: 100 },
        { date: '2026-01-02', value: 110 },
      ],
      heaviestWeight: [],
      sessionVolume: [],
      bestReps: [],
      progression: [],
      duration: [],
    },
  }),
}));

test('exercise charts pass deload dates to performance plots while leaving the PR step line unmarked', () => {
  const render = vi.spyOn(chart, 'ExerciseChart');
  renderToStaticMarkup(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'weight-reps' }));
  const inputs = render.mock.calls.map(([props]) => props);
  expect(inputs.find((props) => props.title === 'Best set, est. 1RM')?.marks).toEqual([
    { date: '2026-01-02', kind: 'deload' },
  ]);
  const personalRecords = inputs.find((props) => props.shape === 'step');
  expect(personalRecords).toBeDefined();
  expect(personalRecords?.marks).toBeUndefined();
  render.mockRestore();
});
