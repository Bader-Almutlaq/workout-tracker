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
      machineBrands: [],
      deloadDates: ['2026-01-02'],
      duration: [
        { date: '2026-01-01', value: 45 },
        { date: '2026-01-02', value: 40 },
      ],
      heaviestWeight: [],
    },
  }),
}));

test('timed exercise charts retain deload annotations', () => {
  const render = vi.spyOn(chart, 'ExerciseChart');
  renderToStaticMarkup(createElement(ExerciseChartsTab, { exerciseId: 1, tracking: 'duration' }));
  const inputs = render.mock.calls.map(([props]) => props);
  expect(inputs.find((props) => props.title === 'Longest duration')?.marks).toEqual([
    { date: '2026-01-02', kind: 'deload' },
  ]);
  render.mockRestore();
});
