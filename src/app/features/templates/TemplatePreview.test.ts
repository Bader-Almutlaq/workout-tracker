import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import type { TemplateSessionReport } from '../../../core/queries/TemplateSessions';
import { TemplateSessionCharts } from './TemplateSessionCharts';
import { TemplateSessionHistory } from './TemplateSessionHistory';

const report: TemplateSessionReport = {
  sessions: [
    {
      id: 22,
      templateId: 1,
      name: 'Synthetic session',
      startedAt: '2024-01-01T12:00:00Z',
      endedAt: null,
      durationSeconds: null,
      workingSetCount: 2,
      volumeKilograms: 420,
      bestEstimatedOneRepMaxKilograms: 75,
    },
  ],
  workouts: [],
  topExercise: { id: 1, name: 'Synthetic press' },
};

test('session history links to History and keeps unknown duration explicit', () => {
  const markup = renderToStaticMarkup(
    createElement(MemoryRouter, {}, createElement(TemplateSessionHistory, { sessions: report.sessions })),
  );
  expect(markup).toContain('href="/history/22"');
  expect(markup).toContain('2 working sets');
  expect(markup).toContain('420 kg');
  expect(markup).toContain('Duration unknown');
});

test('analytics use weekly sums for plans, means for totals, and a named exercise best for workout strength', () => {
  const plan = renderToStaticMarkup(createElement(TemplateSessionCharts, { report, isPlan: true }));
  expect(plan).toContain('Weekly total');
  expect(plan).toContain('Session volume');
  expect(plan).toContain('Session duration');
  expect(plan).toContain('No data in this range.');
  const workout = renderToStaticMarkup(createElement(TemplateSessionCharts, { report }));
  expect(workout).toContain('Synthetic press best e1RM');
  expect(workout).not.toContain('Sessions per week');
});
