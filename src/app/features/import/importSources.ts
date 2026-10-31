import type { WorkoutFileFormat } from '../../../core/import/formats/detectWorkoutFileFormat';
import { ImportError } from '../../../core/import/ImportError';

/** An app whose workout export can be imported. */
export type ImportSource = Exclude<WorkoutFileFormat, 'unknown'>;

/** Export instructions and verification status for each supported app. */
export const importSources = Object.freeze({
  strong: Object.freeze({
    name: 'Strong',
    summary: 'Workouts and body measurements',
    steps: Object.freeze([
      'In Strong, open Settings → Export Data.',
      'Save the files to Files.',
      'Choose the workouts file. You can also choose the measurement files.',
    ]),
    acceptsMeasurements: true,
    verified: true,
  }),
  hevy: Object.freeze({
    name: 'Hevy',
    summary: 'Workouts',
    steps: Object.freeze([
      'In Hevy, open Profile → Settings → Export & Import Data.',
      'Tap Export Data, then export your workouts.',
      'Save the CSV to Files, then choose it here.',
    ]),
    acceptsMeasurements: false,
    verified: false,
  }),
  fitnotes: Object.freeze({
    name: 'FitNotes',
    summary: 'Workouts (Android app)',
    steps: Object.freeze([
      'In FitNotes, open Settings and choose Spreadsheet Export.',
      'Send the CSV to your iPhone and save it to Files.',
      'Choose it here.',
    ]),
    acceptsMeasurements: false,
    verified: false,
  }),
  fitbod: Object.freeze({
    name: 'Fitbod',
    summary: 'Workouts',
    steps: Object.freeze([
      'In Fitbod, open Settings and choose Export workout data.',
      'Save the CSV to Files.',
      'Choose it here.',
    ]),
    acceptsMeasurements: false,
    verified: false,
  }),
} satisfies Record<
  ImportSource,
  {
    readonly name: string;
    readonly summary: string;
    readonly steps: readonly string[];
    readonly acceptsMeasurements: boolean;
    readonly verified: boolean;
  }
>);

/** Identifies a valid route source without accepting inherited object properties. */
export function isImportSource(value: string | undefined): value is ImportSource {
  return value !== undefined && Object.hasOwn(importSources, value);
}

/** Recover the detected source from Comlink's serialized error message. */
export function wrongImportSource(message: string, expected: ImportSource): ImportSource | undefined {
  // The frozen table has exactly the ImportSource keys declared above.
  return (Object.keys(importSources) as ImportSource[]).find(
    (detected) =>
      detected !== expected && message === new ImportError({ kind: 'wrongWorkoutFile', expected, detected }).message,
  );
}
