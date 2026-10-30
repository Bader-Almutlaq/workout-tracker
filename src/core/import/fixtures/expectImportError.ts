import { expect } from 'vitest';
import { ImportError, type ImportErrorDetails } from '../ImportError';

/** Asserts that `work` throws an `ImportError` with exactly these details. */
export function expectImportError(work: () => unknown, details: ImportErrorDetails): void {
  let thrown: unknown;
  try {
    work();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ImportError);
  expect(thrown instanceof ImportError ? thrown.details : undefined).toEqual(details);
}
