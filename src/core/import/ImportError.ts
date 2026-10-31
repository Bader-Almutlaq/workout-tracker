import type { WorkoutFileFormat } from './formats/detectWorkoutFileFormat';

/** What went wrong reading a Strong export, with the values the message needs. */
export type ImportErrorDetails =
  /** The file has no header row. */
  | { readonly kind: 'emptyFile' }
  /** A quoted field is never closed. `line` is where the quoted value starts, roughly. */
  | { readonly kind: 'unterminatedQuote'; readonly line: number }
  /** A required column is missing, e.g. "Exercise Name". */
  | { readonly kind: 'missingColumn'; readonly column: string }
  /** No supported workout dialect can be identified from the header. */
  | { readonly kind: 'unsupportedWorkoutFile' }
  /** A recognized workout file belongs to a different app. */
  | {
      readonly kind: 'wrongWorkoutFile';
      readonly expected: Exclude<WorkoutFileFormat, 'unknown'>;
      readonly detected: Exclude<WorkoutFileFormat, 'unknown'>;
    }
  /** A value can't be read, e.g. a date or number in an unexpected format. */
  | { readonly kind: 'invalidValue'; readonly column: string; readonly value: string; readonly line: number }
  /** The file isn't a Strong workouts or measurements export. */
  | { readonly kind: 'unrecognisedFile'; readonly name: string };

/** The `kind` values of `ImportErrorDetails`. */
export type ImportErrorKind = ImportErrorDetails['kind'];

/** The message shown to the owner for `details` (the native app's wording). */
function describe(details: ImportErrorDetails): string {
  switch (details.kind) {
    case 'emptyFile':
      return 'The file is empty.';
    case 'unterminatedQuote':
      return `The file is damaged: a quoted value starting near line ${details.line} never ends.`;
    case 'missingColumn':
      return `This export is missing the "${details.column}" column.`;
    case 'unsupportedWorkoutFile':
      return "This file isn't a Strong, Hevy, FitNotes or Fitbod workout export.";
    case 'wrongWorkoutFile': {
      const names = { strong: 'Strong', hevy: 'Hevy', fitnotes: 'FitNotes', fitbod: 'Fitbod' };
      return `This looks like a ${names[details.detected]} export, not a ${names[details.expected]} export.`;
    }
    case 'invalidValue':
      return `Line ${details.line}: "${details.value}" isn't a valid ${details.column}.`;
    case 'unrecognisedFile':
      return `${details.name} isn't a Strong workouts or measurements export.`;
  }
}

/** Reasons a Strong export can't be read. The message is written for the owner. */
export class ImportError extends Error {
  override readonly name = 'ImportError';

  constructor(readonly details: ImportErrorDetails) {
    super(describe(details));
  }

  /** Which kind of problem this is. */
  get kind(): ImportErrorKind {
    return this.details.kind;
  }
}
