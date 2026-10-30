import { useRef, useState } from 'react';
import { RestTimerDefaults, restState, restTarget, steppedRestTarget } from '../../../core/logging/RestTimer';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { latestCompletion } from './latestCompletion';
import type { RestBarModel } from './RestBarModel';
import { useClock } from './useClock';
import { setRestTarget } from './workoutActions';

/** The target the owner last chose, which the saved value may not show yet. */
interface ChosenTarget {
  readonly exerciseId: number;
  readonly seconds: number;
}

/**
 * The rest bar's state, counted from the most recently completed set. `undefined` when no set is
 * completed or the owner dismissed the bar for that set. Nothing is stored for the countdown: it
 * is worked out from the set's saved time, so it survives a reload.
 */
export function useRestBar(entries: readonly LiveWorkoutEntry[]): RestBarModel | undefined {
  const now = useClock();
  const [dismissedCompletedAt, setDismissedCompletedAt] = useState<string | undefined>(undefined);
  const lastChosen = useRef<ChosenTarget | undefined>(undefined);
  const completion = latestCompletion(entries);
  if (completion === undefined || completion.completedAt === dismissedCompletedAt) return undefined;

  const { exercise, completedAt } = completion;
  const targetSeconds = restTarget(exercise);
  // Taps arrive faster than the saved value comes back, so a step starts from the last one chosen.
  const step = (direction: 1 | -1) => {
    const previous = lastChosen.current;
    const base = previous?.exerciseId === exercise.id ? previous.seconds : targetSeconds;
    const seconds = steppedRestTarget(base, direction);
    lastChosen.current = { exerciseId: exercise.id, seconds };
    setRestTarget(exercise.id, seconds);
  };
  return {
    state: restState(completedAt, targetSeconds, now),
    targetSeconds,
    canShorten: targetSeconds > RestTimerDefaults.minimumSeconds,
    canLengthen: targetSeconds < RestTimerDefaults.maximumSeconds,
    shorten: () => step(-1),
    lengthen: () => step(1),
    dismiss: () => setDismissedCompletedAt(completedAt),
  };
}
