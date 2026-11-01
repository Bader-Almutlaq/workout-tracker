import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, it } from 'vitest';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { ScopedTemplateAnalyticsContent } from './ScopedTemplateAnalyticsContent';

type Report = ReturnType<typeof TemplateAnalytics>;
const report: Report = {
  sessionCount: 1,
  typicalSessionSeconds: 3600,
  weeksOnPlan: 2,
  weeksAvailable: 1,
  sessionsPerWeek: 1,
  plannedWorkouts: 2,
  lastSession: { workingSets: 2, plannedWorkingSets: 3 },
  exercises: [
    {
      id: 4,
      name: 'Upper',
      weekday: 1,
      exercises: [
        {
          exerciseId: 8,
          templateId: 4,
          name: 'Press',
          sessions: [
            {
              date: '2026-01-05T12:00:00Z',
              workoutId: 1,
              isDeload: true,
              bestEstimatedOneRepMax: 100,
              topSet: { weightKilograms: 80, reps: 5, rpe: 8 },
              workingSetCount: 2,
              averageRpe: 8,
            },
          ],
          changes: null,
          latestTopSet: { weightKilograms: 80, reps: 5, rpe: 8 },
        },
      ],
    },
  ],
  perSession: [{ date: '2026-01-05T12:00:00Z', workoutId: 1, isDeload: true, hardSets: 2, averageRir: 2 }],
  weekly: [{ weekStart: '2026-01-05', hardSets: 2, averageRir: 2, hasDeload: true }],
  musclesDoneVsPlanned: [
    { muscle: 'chest', done: 2, planned: 3, contributions: [{ exerciseId: 8, name: 'Press', fractional: 2 }] },
  ],
};
function render(plan: boolean, value = report) {
  return renderToStaticMarkup(
    createElement(MemoryRouter, {}, createElement(ScopedTemplateAnalyticsContent, { report: value, plan })),
  );
}
it('orders workout sections, links the scoped exercise and marks deloads', () => {
  const html = render(false);
  expect(html.indexOf('Sessions')).toBeLessThan(html.indexOf('Exercise progress'));
  expect(html.indexOf('Exercise progress')).toBeLessThan(html.indexOf('Hard sets per session'));
  expect(html.indexOf('Hard sets per session')).toBeLessThan(html.indexOf('Effort per session'));
  expect(html).toContain('/workout/workouts/4/exercises/8');
  expect(html).toContain('var(--color-deload)');
  expect(html).toContain('RPE 8.0');
});
it('orders plan sections and shows done and planned muscle sets', () => {
  const html = render(true);
  expect(html.indexOf('On this plan')).toBeLessThan(html.indexOf('Sets per muscle, per week'));
  expect(html.indexOf('Sets per muscle, per week')).toBeLessThan(html.indexOf('Weekly hard sets'));
  expect(html.indexOf('Weekly effort')).toBeLessThan(html.indexOf('Progress by workout'));
  expect(html).toContain('2 / 3');
  expect(html).toContain('1 full week');
  expect(html).toContain('/workout/workouts/4/exercises/8');
});
it('shows the empty state for either scope', () => {
  for (const plan of [true, false]) expect(render(plan, { ...report, sessionCount: 0 })).toContain('No sessions yet');
});
