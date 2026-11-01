import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { ExerciseChart } from './ExerciseChart';
import { ExerciseRepMaxTable } from './ExerciseRepMaxTable';
import { exerciseSetText } from './exerciseSetText';

const points = [
  { date: '2026-01-01', value: 87 },
  { date: '2026-01-08', value: 99 },
];

test('empty, single-point and populated charts share the compact accessible frame', () => {
  for (const subset of [[], points.slice(0, 1), points]) {
    const markup = renderToStaticMarkup(
      createElement(ExerciseChart, { title: 'Synthetic chart', unit: 'kg', points: subset, formatValue: String }),
    );
    expect(markup).toContain('Expand Synthetic chart');
    expect(markup).toContain('<table');
    expect(markup).not.toContain('Show as table');
    expect(markup).not.toContain('Tap to expand');
    if (subset.length === 0) expect(markup).toContain('No data in this range.');
    else expect(markup).toContain('<svg');
  }
});

test('predictions remain visible with no performance and use shared kg/lb estimate rounding', () => {
  for (const [unit, expected] of [
    ['kg', '71.5 kg'],
    ['lb', '158 lb'],
  ] as const) {
    const markup = renderToStaticMarkup(
      createElement(ExerciseRepMaxTable, { unit, rows: [{ reps: 12, best: null, predictedKilograms: 71.6 }] }),
    );
    expect(markup).toContain(expected);
    expect(markup).toContain('—');
  }
});

test('timed history uses seconds and bodyweight assistance retains its signed load', () => {
  const set = {
    id: 1,
    workoutExerciseId: 1,
    position: 0,
    kind: 'working',
    weightKilograms: -12,
    entryUnit: 'kg',
    reps: 8,
    rpe: null,
    durationSeconds: 45,
    distanceMeters: null,
    side: 'both',
    restBeforeSeconds: null,
    completedAt: null,
    isCompleted: true,
    notes: null,
  } as const;
  expect(exerciseSetText(set, 'duration')).toBe('45 s');
  expect(exerciseSetText({ ...set, rpe: 8 }, 'duration')).toBe('45 s @ RPE 8');
  expect(exerciseSetText(set, 'bodyweight-reps')).toBe('-12 kg × 8 reps');
});
