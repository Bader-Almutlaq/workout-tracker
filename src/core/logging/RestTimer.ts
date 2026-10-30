import type { Database } from '../db/Database';
import type { Exercise } from '../models/Exercise';
import { WorkoutLoggerError } from './WorkoutLoggerError';

/**
 * The rest timer's starting value and limits, in seconds.
 *
 * Heuristic: `targetSeconds` is only the number the countdown starts from before the owner has chosen
 * one for an exercise. It is not a recommendation; the owner changes it per exercise and the choice is
 * remembered. The limits only keep a mistyped tap from storing nonsense (15 s to 30 min).
 */
export const RestTimerDefaults = {
  targetSeconds: 120,
  stepSeconds: 15,
  minimumSeconds: 15,
  maximumSeconds: 1800,
} as const;

/** How far into a rest the owner is, measured from the moment the last set was completed. */
export interface RestState {
  /** Seconds since the last completed set. Never negative: a clock set back reads as zero. */
  readonly elapsedSeconds: number;
  /** Seconds left until the target; 0 once it is reached. */
  readonly remainingSeconds: number;
  /** `true` once `elapsedSeconds` has reached the target. */
  readonly isTargetReached: boolean;
}

/** The rest target for an exercise in seconds: the owner's choice, or the app default when none was made. */
export function restTarget(exercise: Pick<Exercise, 'restTargetSeconds'>): number {
  return exercise.restTargetSeconds ?? RestTimerDefaults.targetSeconds;
}

/** Finite `seconds` rounded and clamped to `RestTimerDefaults`; nonfinite input throws `invalidRestTarget`. */
export function clampedRestTarget(seconds: number): number {
  if (!Number.isFinite(seconds)) throw new WorkoutLoggerError('invalidRestTarget', seconds);
  return Math.min(RestTimerDefaults.maximumSeconds, Math.max(RestTimerDefaults.minimumSeconds, Math.round(seconds)));
}

/** The target one step (`RestTimerDefaults.stepSeconds`) longer (`1`) or shorter (`-1`), kept within the limits. */
export function steppedRestTarget(currentSeconds: number, direction: 1 | -1): number {
  return clampedRestTarget(currentSeconds + direction * RestTimerDefaults.stepSeconds);
}

/**
 * Remembers the owner's rest target for an exercise. The value is rounded to whole seconds and kept
 * within the limits in `RestTimerDefaults`; nonfinite input throws `invalidRestTarget`.
 * Throws `WorkoutLoggerError('exerciseNotFound')` when the
 * exercise doesn't exist.
 */
export function setRestTarget(db: Database, exerciseId: number, seconds: number): void {
  const result = db.run('UPDATE exercise SET restTargetSeconds = ? WHERE id = ?', [
    clampedRestTarget(seconds),
    exerciseId,
  ]);
  if (result.changes === 0) throw new WorkoutLoggerError('exerciseNotFound');
}

/**
 * Where a rest stands at `now`: elapsed = now − `lastCompletedAt`, remaining = max(0, target − elapsed).
 * Derived from timestamps only, so it is right after a reload or time in the background.
 * `lastCompletedAt` is the ISO timestamp of the last completed set.
 */
export function restState(lastCompletedAt: string, targetSeconds: number, now: Date): RestState {
  const elapsedSeconds = Math.max(0, (now.getTime() - Date.parse(lastCompletedAt)) / 1000);
  return {
    elapsedSeconds,
    remainingSeconds: Math.max(0, targetSeconds - elapsedSeconds),
    isTargetReached: elapsedSeconds >= targetSeconds,
  };
}
