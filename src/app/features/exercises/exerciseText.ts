import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { MECHANIC_DISPLAY_NAMES } from '../../../core/library/Mechanic';
import { MOVEMENT_PATTERN_DISPLAY_NAMES } from '../../../core/library/MovementPattern';
import { EQUIPMENT_DISPLAY_NAMES } from '../../../core/library/Equipment';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import type { Exercise } from '../../../core/models/Exercise';
import { FORMAT_LOCALE } from '../../format/formatLocale';
import { weightText } from '../../format/weightText';

const countFormat = new Intl.NumberFormat(FORMAT_LOCALE);

/** Search counts are shown rounded down to this step ("420 exercises", not "423"). */
const PLACEHOLDER_COUNT_STEP = 10;

/** "Search 420 exercises": the real count, rounded down to the nearest ten. */
export function searchPlaceholder(exerciseCount: number): string {
  const rounded = Math.floor(exerciseCount / PLACEHOLDER_COUNT_STEP) * PLACEHOLDER_COUNT_STEP;
  return `Search ${countFormat.format(rounded)} exercises`;
}

/** A row's second line: the primary muscles, then "236×" when the exercise has been logged. */
export function exerciseSubtitle(entry: Pick<ExerciseSearchEntry, 'primaryMuscles' | 'usageCount'>): string {
  const parts = entry.primaryMuscles.map((muscle) => MUSCLE_DISPLAY_NAMES[muscle]);
  if (entry.usageCount > 0) parts.push(`${countFormat.format(entry.usageCount)}×`);
  return parts.join(' · ');
}

/** "236 sessions · 1,402 sets". A session is one workout the exercise appears in. */
export function usageText(workoutCount: number, setCount: number): string {
  const sessions = workoutCount === 1 ? '1 session' : `${countFormat.format(workoutCount)} sessions`;
  const sets = setCount === 1 ? '1 set' : `${countFormat.format(setCount)} sets`;
  return `${sessions} · ${sets}`;
}

/** The best work set of a session, e.g. "135 lb × 8", "Bodyweight × 12", or "Warm-ups only" when it has none. */
export function topSetText(set: Pick<WorkoutSet, 'weightKilograms' | 'entryUnit' | 'reps'> | null): string {
  if (set === null) return 'Warm-ups only';
  const load = set.weightKilograms > 0 ? weightText(set.weightKilograms, set.entryUnit) : 'Bodyweight';
  return `${load} × ${set.reps}`;
}

/** "Dumbbell · Lateral raise · Isolation · Long-length bias": what an exercise is, skipping what is unset. */
export function exerciseTraitsText(
  exercise: Pick<Exercise, 'equipment' | 'movementPattern' | 'mechanic' | 'isLengthenedBiased'>,
): string {
  const parts: string[] = [];
  if (exercise.equipment !== null) parts.push(EQUIPMENT_DISPLAY_NAMES[exercise.equipment]);
  if (exercise.movementPattern !== null) parts.push(MOVEMENT_PATTERN_DISPLAY_NAMES[exercise.movementPattern]);
  if (exercise.mechanic !== null) parts.push(MECHANIC_DISPLAY_NAMES[exercise.mechanic]);
  if (exercise.isLengthenedBiased) parts.push('Long-length bias');
  return parts.join(' · ');
}
