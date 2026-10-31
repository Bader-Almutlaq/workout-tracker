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

test('fewer than two session points hide the chart behind a one-line note', () => {
  for (const subset of [[], points.slice(0, 1)]) {
    const markup = renderToStaticMarkup(
      createElement(ExerciseChart, { title: 'Synthetic chart', points: subset, formatValue: String }),
    );
    expect(markup).toContain('at least two qualifying sessions');
    expect(markup).not.toContain('<svg');
    expect(markup).not.toContain('Tap to expand');
  }
  const markup = renderToStaticMarkup(
    createElement(ExerciseChart, { title: 'Synthetic chart', points, formatValue: String }),
  );
  expect(markup).toContain('<svg');
  expect(markup).toContain('Open Synthetic chart full screen');
  expect(markup).toContain('Show as table');
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
