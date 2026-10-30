import { CsvTable } from '../CsvTable';

/** Supported workout CSV dialects; unknown headers are never guessed from filenames or data. */
export type WorkoutFileFormat = 'strong' | 'hevy' | 'fitnotes' | 'fitbod' | 'unknown';

/**
 * Identifies a dialect by case-insensitive header names, allowing reordered and extra columns.
 * Heuristic: require both an identifying column and a related identity column, so damaged
 * exports can reach their adapter's missing-column error without accepting generic CSVs.
 * CSV syntax errors (including an empty file) remain readable ImportErrors.
 */
export function detectWorkoutFileFormat(text: string): WorkoutFileFormat {
  const table = CsvTable.parse(text);
  const has = (...names: string[]) => table.columnIndex(...names) !== undefined;
  // A complete Strong signature wins over incidental columns such as an added Category.
  if (has('Date') && has('Workout Name') && has('Exercise Name') && has('Set Order')) return 'strong';
  if (has('exercise_title') && has('start_time', 'title')) return 'hevy';
  if (has('Date', 'Exercise')) {
    if (has('Category', 'Weight (kgs)', 'Weight (lbs)', 'Distance Unit')) return 'fitnotes';
    if (has('Weight(kg)', 'Weight(lb)', 'Duration(s)', 'Distance(m)', 'isWarmup', 'multiplier')) return 'fitbod';
  }
  if (has('Workout Name', 'Set Order') && has('Date', 'Exercise Name')) return 'strong';
  return 'unknown';
}
