/**
 * An optional value beside a cell, accepted only on tap. Values use the cell's display unit
 * (seconds for time). Warm-ups and progression share this slot.
 */
export interface ValueSuggestion {
  /** Progression keeps even equal previous and suggested numbers separate and tappable. */
  readonly keepsPrevious?: boolean;
  readonly value: number;
  readonly text: string;
  readonly onAccept: (value: number) => void;
}
