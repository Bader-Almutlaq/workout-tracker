/**
 * An optional value beside a cell, accepted only on tap. Values use the cell's display unit
 * (seconds for time). Warm-ups supply it now; future callers can supply progression unchanged.
 */
export interface ValueSuggestion {
  readonly value: number;
  readonly text: string;
  readonly onAccept: (value: number) => void;
}
