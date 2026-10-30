import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import { SetRow } from './SetRow';

test('Shows the note beneath its set and omits an empty note', () => {
  const set: WorkoutSet = {
    id: 1,
    workoutExerciseId: 1,
    position: 0,
    kind: 'working',
    weightKilograms: 60,
    entryUnit: 'kg',
    reps: 8,
    rpe: null,
    durationSeconds: null,
    distanceMeters: null,
    side: 'both',
    restBeforeSeconds: null,
    completedAt: null,
    isCompleted: true,
    notes: 'Slow tempo',
  };
  expect(renderToStaticMarkup(createElement(SetRow, { set, label: '1' }))).toContain('Slow tempo');
  expect(renderToStaticMarkup(createElement(SetRow, { set: { ...set, notes: null }, label: '1' }))).not.toContain('<p');
});
