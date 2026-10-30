import { describe, expect, test } from 'vitest';
import { cellsInOrder, nextCell } from './cellOrder';
import { makeExercise, makeSet } from './workoutTestData';

const entries = [
  { exercise: makeExercise({ id: 1 }), sets: [makeSet({ id: 10 }), makeSet({ id: 11 })] },
  { exercise: makeExercise({ id: 2, tracking: 'duration' }), sets: [makeSet({ id: 20 })] },
];

describe('cell order', () => {
  test('Cells run weight, reps, RPE across each set, then the next set', () => {
    expect(cellsInOrder(entries).map((cell) => `${cell.setId}:${cell.field}`)).toEqual([
      '10:weight',
      '10:reps',
      '10:rpe',
      '11:weight',
      '11:reps',
      '11:rpe',
      '20:reps',
      '20:rpe',
    ]);
  });

  test('Next moves along the row and then to the next row', () => {
    expect(nextCell(entries, { setId: 10, field: 'weight' })).toEqual({ setId: 10, field: 'reps' });
    expect(nextCell(entries, { setId: 10, field: 'rpe' })).toEqual({ setId: 11, field: 'weight' });
  });

  test('Next crosses into the following exercise, skipping a missing weight cell', () => {
    expect(nextCell(entries, { setId: 11, field: 'rpe' })).toEqual({ setId: 20, field: 'reps' });
  });

  test('After the last cell, and for an unknown cell, there is no next cell', () => {
    expect(nextCell(entries, { setId: 20, field: 'rpe' })).toBeUndefined();
    expect(nextCell(entries, { setId: 99, field: 'weight' })).toBeUndefined();
  });
});
