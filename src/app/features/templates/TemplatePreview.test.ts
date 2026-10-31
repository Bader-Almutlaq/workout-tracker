import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import type { TemplateSessionReport } from '../../../core/queries/TemplateSessions';
import { TemplatePreview } from './TemplatePreview';
import { TemplateSessionCharts } from './TemplateSessionCharts';
import { TemplateSessionHistory } from './TemplateSessionHistory';
import { WorkoutSheet } from './WorkoutSheet';

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

test('workout preview offers its description and all three sections, with an honest empty exercise state', () => {
  const markup = renderToStaticMarkup(
    createElement(TemplatePreview, {
      template: { name: 'Synthetic workout', folderId: null, notes: null, exercises: [] },
      details: [],
      report,
      onEdit: () => undefined,
    }),
  );
  expect(markup).toContain('Add a description');
  expect(markup).toContain('Last performed:');
  for (const label of ['Exercises', 'History', 'Analytics']) expect(markup).toContain(`>${label}<`);
  expect(markup).toContain('No exercises yet.');
});

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

test('Start workout is a separate footer after the scrolling content, disabled until the workout is available', () => {
  const markup = renderToStaticMarkup(
    createElement(WorkoutSheet, {
      title: 'Synthetic workout',
      isBusy: false,
      canStart: false,
      onStart: () => undefined,
      onEdit: () => undefined,
      onClose: () => undefined,
      children: createElement('p', {}, 'Scrolling details'),
    }),
  );
  expect(markup).toMatch(/<footer[^>]*>.*disabled="".*Start workout/s);
  expect(markup.indexOf('Scrolling details')).toBeLessThan(markup.indexOf('<footer'));
  expect(markup).toContain('Close');
});
