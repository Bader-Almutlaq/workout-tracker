import { expect, test } from 'vitest';
import { WorkoutLoggerError } from './WorkoutLoggerError';

test('logging errors expose their kind, value and readable message', () => {
  const error = new WorkoutLoggerError('invalidWeight', -1);
  expect(error).toBeInstanceOf(Error);
  expect(error.kind).toBe('invalidWeight');
  expect(error.value).toBe(-1);
  expect(error.message).toBe('-1 kg isn’t a valid weight.');
});
