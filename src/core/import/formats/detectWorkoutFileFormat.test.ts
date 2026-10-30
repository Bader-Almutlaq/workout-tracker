import { describe, expect, test } from 'vitest';
import { detectWorkoutFileFormat } from './detectWorkoutFileFormat';
import { WorkoutFileFixtures } from './fixtures/WorkoutFileFixtures';
import { NEWER_LAYOUT, OLDER_LAYOUT } from '../fixtures/StrongFixtures';

describe('workout dialect detection', () => {
  test.each([
    [OLDER_LAYOUT, 'strong'],
    [NEWER_LAYOUT, 'strong'],
    [WorkoutFileFixtures.hevy, 'hevy'],
    [WorkoutFileFixtures.fitnotes, 'fitnotes'],
    [WorkoutFileFixtures.fitbod, 'fitbod'],
    ['REPS;EXERCISE;WEIGHT(KG);DATE\n', 'fitbod'],
    ['\uFEFF"EXERCISE_TITLE",TITLE,START_TIME', 'hevy'],
    ['Date,Exercise,Weight (kgs)', 'fitnotes'],
    ['Date,Workout Name,Exercise Name,Set Order,Category', 'strong'],
    ['Date,Exercise,Reps', 'unknown'],
    ['Date,Measurement Type,Value,Unit,Source', 'unknown'],
    ['Date,Exercise Title,weight_kg', 'unknown'],
    ['title,description', 'unknown'],
    ['Category,Weight (kgs)', 'unknown'],
    ['isWarmup,multiplier', 'unknown'],
    ['Workout Name,Duration', 'unknown'],
    ['Date,Weight', 'unknown'],
  ])('identifies header without consulting data: %s', (text, format) => {
    expect(detectWorkoutFileFormat(text)).toBe(format);
  });

  test('damaged but identifiable headers still reach missing-column validation', () => {
    expect(detectWorkoutFileFormat('title,exercise_title')).toBe('hevy');
    expect(detectWorkoutFileFormat('Exercise,Category')).toBe('fitnotes');
    expect(detectWorkoutFileFormat('Exercise,isWarmup')).toBe('fitbod');
  });

  test('empty and malformed CSVs retain their readable errors', () => {
    expect(() => detectWorkoutFileFormat('')).toThrow('The file is empty.');
    expect(() => detectWorkoutFileFormat('"Date,Exercise')).toThrow('quoted value');
  });
});
