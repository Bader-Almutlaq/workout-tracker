/** Both mechanics an exercise can have. Values match the `exercise.mechanic` CHECK constraint. */
export const MECHANICS = ['compound', 'isolation'] as const;

/**
 * Whether an exercise moves one joint or several. Stored in `exercise.mechanic`.
 *
 * - `compound`: several joints move (squat, row, press).
 * - `isolation`: one joint moves (curl, leg extension, lateral raise).
 */
export type Mechanic = (typeof MECHANICS)[number];

/** Name of each mechanic shown in the UI. */
export const MECHANIC_DISPLAY_NAMES: Readonly<Record<Mechanic, string>> = {
  compound: 'Compound',
  isolation: 'Isolation',
};
