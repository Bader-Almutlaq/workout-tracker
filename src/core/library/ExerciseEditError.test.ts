import { expect, it } from 'vitest';
import { ExerciseEditError } from './ExerciseEditError';

it('exposes a readable error and its kind', () => {
  const error = new ExerciseEditError('nameInUse', 'Example');
  expect(error.kind).toBe('nameInUse');
  expect(error.message).toBe('An exercise called “Example” already exists.');
});
