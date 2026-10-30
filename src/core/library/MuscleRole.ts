/** Both ways an exercise can train a muscle. Values match the `exerciseMuscle.role` CHECK constraint. */
export const MUSCLE_ROLES = ['primary', 'secondary'] as const;

/**
 * How an exercise trains a muscle. Stored in `exerciseMuscle.role`.
 *
 * - `primary`: a prime mover, the muscle the exercise is chosen for.
 * - `secondary`: a meaningful synergist that also gets trained.
 *
 * Analytics weight sets by role when counting fractional sets (primary 1.0, secondary 0.5;
 * Pelland 2025, report section 12). That weighting lives with the analytics, not here.
 */
export type MuscleRole = (typeof MUSCLE_ROLES)[number];
