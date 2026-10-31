import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import { WorkoutExerciseRow } from './WorkoutExerciseRow';

test('only the question mark links to the exercise in the workout', () => {
  const exercise = {
    exerciseId: 8,
    supersetGroup: null,
    notes: null,
    machineBrand: 'Panatta',
    sets: [{ kind: 'working' as const, targetRepsLow: 6, targetRepsHigh: 8, targetRpe: null }],
  };
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      {},
      createElement(WorkoutExerciseRow, {
        exercise,
        detail: null,
        to: '/workout/workouts/4/exercises/8',
      }),
    ),
  );
  expect(html).toContain('1 × Archived exercise');
  expect(html).toContain('6–8 · Panatta');
  expect(html).toMatch(/<a[^>]*href="\/workout\/workouts\/4\/exercises\/8"[^>]*>\?<\/a>/);
  expect(html.match(/<a\b/g)).toHaveLength(1);
  expect(html).toMatch(/^<div/);
});
