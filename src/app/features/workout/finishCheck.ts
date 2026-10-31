import type { Workout } from '../../../core/models/Workout';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';

interface FinishCheckDetail {
  readonly workout: Pick<Workout, 'startedAt'>;
  readonly entries: readonly { readonly sets: readonly Pick<WorkoutSet, 'isCompleted' | 'completedAt'>[] }[];
}

/** Heuristic: the owner's requested short and idle thresholds, in milliseconds. */
export const FinishCheckLimits = Object.freeze({ short: 5 * 60_000, idle: 60 * 60_000 });

/** The next finishing question, or undefined when the requested checks are satisfied. */
export function finishCheck(
  detail: FinishCheckDetail,
  now: Date,
  stage: 'short' | 'idle',
): 'empty' | 'short' | 'idle' | undefined {
  const completed = detail.entries.flatMap((entry) => entry.sets).filter((set) => set.isCompleted);
  if (completed.length === 0) return 'empty';
  if (stage === 'short' && now.getTime() - new Date(detail.workout.startedAt).getTime() < FinishCheckLimits.short)
    return 'short';
  const last = completed
    .map((set) => set.completedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);
  if (last !== undefined && now.getTime() - new Date(last).getTime() > FinishCheckLimits.idle) return 'idle';
  return undefined;
}
