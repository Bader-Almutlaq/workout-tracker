import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import { rpeText } from '../../format/setText';
import { weightText } from '../../format/weightText';

/** Logged set in its entry unit; timed sets show seconds and bodyweight additions/assistance retain their signed load. */
export function exerciseSetText(set: WorkoutSet, tracking: ExerciseTracking): string {
  const timed = tracking === 'duration' || tracking === 'weight-duration';
  const amount = timed ? `${set.durationSeconds ?? '—'} s` : `${set.reps} reps`;
  const load =
    tracking === 'duration'
      ? ''
      : tracking === 'bodyweight-reps' && set.weightKilograms === 0
        ? 'Bodyweight × '
        : `${weightText(set.weightKilograms, set.entryUnit)} × `;
  return `${load}${amount} @ ${set.rpe === null ? 'RPE unknown' : rpeText(set.rpe)}`;
}
