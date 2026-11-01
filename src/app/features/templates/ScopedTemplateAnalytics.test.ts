import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, it } from 'vitest';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import layout from './TemplateAnalytics.module.css';
import { ScopedTemplateAnalyticsContent } from './ScopedTemplateAnalyticsContent';

type Report = ReturnType<typeof TemplateAnalytics>;
const report: Report = {
  sessionCount: 1,
  typicalSessionSeconds: 3600,
  windowEnd: '2026-01-11',
  windowIsHistorical: false,
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
  muscleDashboard: [],
  intensityMix: null,
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
  expect(html).toContain('Deload');
  expect(html).toContain('2.0 RIR');
});
it('orders plan sections and shows done and planned muscle sets', () => {
  const html = render(true);
  expect(html.indexOf('Workouts')).toBeLessThan(html.indexOf('Sets per muscle, per week'));
  expect(html.indexOf('Sets per muscle, per week')).toBeLessThan(html.indexOf('Weekly hard sets'));
  expect(html.indexOf('Weekly effort')).toBeLessThan(html.indexOf('Progress by workout'));
  expect(html).toContain('2 / 3');
  expect(html).toContain('1 full week');
  expect(html).toContain('/workout/workouts/4/exercises/8');
});
it('shows the empty state for either scope', () => {
  for (const plan of [true, false]) expect(render(plan, { ...report, sessionCount: 0 })).toContain('No sessions yet');
});

it('uses dated axes, short chart headings and a three-tile container', () => {
  const html = render(false);
  expect(html).toContain('Jan');
  expect(html).toContain('sets</text>');
  expect(html).toContain('RIR</text>');
  expect(html.match(/<table/g)?.length).toBeGreaterThanOrEqual(2);
  expect(html).not.toContain('Show as table');
  expect(html).not.toMatch(/<h2>[^<]*[Ee]ach/);
  expect(html).toContain('use arrow keys to inspect values');
  for (const plan of [false, true]) {
    expect(render(plan)).toContain(layout.tiles);
  }
});

it('hides muscles with neither done nor planned sets', () => {
  const html = render(true, {
    ...report,
    musclesDoneVsPlanned: [
      ...report.musclesDoneVsPlanned,
      { muscle: 'biceps', done: 0, planned: 0, contributions: [] },
    ],
  });
  expect(html).not.toContain('Biceps');
  expect(html).toContain('Show smaller muscles');
});

it('uses top-set load and the four-session comparison when an estimate is absent', () => {
  const group = report.exercises[0];
  const exercise = group?.exercises[0];
  if (!group || !exercise) throw new Error('Missing fixture');
  const topSet = { weightKilograms: 80, reps: 20, rpe: null };
  const value: Report = {
    ...report,
    exercises: [
      {
        ...group,
        exercises: [
          {
            ...exercise,
            sessions: [
              {
                ...exercise.sessions[0],
                date: '2026-01-05',
                workoutId: 1,
                isDeload: false,
                bestEstimatedOneRepMax: null,
                topSet,
                workingSetCount: 2,
                averageRpe: null,
              },
            ],
            latestTopSet: topSet,
            changes: {
              estimatedOneRepMaxPercent: null,
              topSet: { before: { ...topSet, weightKilograms: 70 }, after: topSet },
              workingSetCount: { before: 2, after: 2 },
            },
          },
        ],
      },
    ],
  };
  const html = render(false, value);
  expect(html).toContain('80 kg');
  expect(html).toContain('Top set');
  expect(html).toContain('+10.0 kg');
});

it('shows total workouts and short recent-window details in plan tiles', () => {
  const current = render(true);
  expect(current).toContain('Workouts');
  expect(current).toContain('Per week');
  expect(current).toContain('of 2 planned');
  expect(current).not.toContain('On this plan');
  const historical = render(true, { ...report, weeksAvailable: 4, windowEnd: '2026-10-12', windowIsHistorical: true });
  expect(historical).toContain('4 wk to 12 Oct');
  expect(historical).not.toContain('of 2 planned');
});

it('renders three workout trends and an unavailable effort value', () => {
  const group = report.exercises[0];
  const exercise = group?.exercises[0];
  const session = exercise?.sessions[0];
  if (!group || !exercise || !session) throw new Error('Missing fixture');
  const html = render(false, {
    ...report,
    exercises: [{ ...group, exercises: [{ ...exercise, sessions: [{ ...session, averageRpe: null }] }] }],
  });
  expect(html).toContain('Est. 1RM');
  expect(html).toContain('Sets');
  expect(html).toContain('RPE');
  expect(html).toContain('100 kg');
  expect(html).toContain('—');
  expect(html).toContain('var(--color-deload)');
});

it('renders plan muscle and distribution data between the weekly charts and workout progress', () => {
  const bucket = { label: '6–10', count: 2, percent: 100 };
  const html = render(true, {
    ...report,
    muscleDashboard: [{ muscle: 'chest', setsPerWeek: 2, strengthChangePercent: 5, averageRir: 2, shares: [] }],
    intensityMix: { reps: [bucket], effort: [bucket], notLogged: 0, percentOfMax: [bucket] },
  });
  expect(html.indexOf('Sets per muscle, per week')).toBeLessThan(html.indexOf('<h2>Muscles</h2>'));
  expect(html.indexOf('<h2>Muscles</h2>')).toBeLessThan(html.indexOf('Weekly hard sets'));
  expect(html.indexOf('Weekly effort')).toBeLessThan(html.indexOf('Effort and reps'));
  expect(html.indexOf('Effort and reps')).toBeLessThan(html.indexOf('Progress by workout'));
  expect(html).toContain('Chest');
  expect(html).toContain('+5.0%');
  expect(html).toContain('6–10');
});
