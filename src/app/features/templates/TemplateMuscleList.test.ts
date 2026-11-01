import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import type { TemplateMuscleSummary } from '../../../core/queries/TemplateMuscleSummary';
import { TemplateMuscleList } from './TemplateMuscleList';

const summary: TemplateMuscleSummary = {
  sets: 3,
  workouts: 2,
  exercises: 1,
  secondaryWeight: 0.5,
  muscles: [
    { muscle: 'chest', direct: 1, indirect: 0, fractional: 1, frequency: 1, contributions: [] },
    { muscle: 'biceps', direct: 0, indirect: 1, fractional: 0.5, frequency: 0, contributions: [] },
    { muscle: 'triceps', direct: 2, indirect: 1, fractional: 2.5, frequency: 2, contributions: [] },
    { muscle: 'quads', direct: 0, indirect: 0, fractional: 0, frequency: 0, contributions: [] },
  ],
};

test('workout hides untrained muscles and omits zero detail parts', () => {
  const html = renderToStaticMarkup(createElement(TemplateMuscleList, { summary, weekly: false }));
  expect(html).not.toContain('Quads');
  expect(html).toContain('1 direct');
  expect(html).toContain('1 indirect');
  expect(html).toContain('2 direct + 1 indirect');
  expect(html).not.toContain('0 direct');
  expect(html).not.toContain('0 indirect');
});

test('plan retains untrained rows and shows only nonzero frequency', () => {
  const html = renderToStaticMarkup(createElement(TemplateMuscleList, { summary, weekly: true }));
  expect(html).toContain('Quads');
  expect(html).toContain('Not trained');
  expect(html).toContain('1× a week');
  expect(html).toContain('2× a week');
  expect(html).not.toContain('0× a week');
});
