import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { isSameCell, type Cell, type Field } from './Cell';
import { recordsWeight } from './trackingKinds';

const WEIGHT_REPS_RPE: readonly Field[] = ['weight', 'reps'];
const REPS_RPE: readonly Field[] = ['reps'];

/**
 * Every editable cell of the workout in reading order: for each set, weight, reps, RPE, then the
 * next set's weight. Exercises without a weight cell skip it.
 */
export function cellsInOrder(entries: readonly Pick<LiveWorkoutEntry, 'exercise' | 'sets'>[]): Cell[] {
  return entries.flatMap(({ exercise, sets }) => {
    const fields = recordsWeight(exercise.tracking) ? WEIGHT_REPS_RPE : REPS_RPE;
    return sets.flatMap((set) => fields.map((field): Cell => ({ setId: set.id, field })));
  });
}

/** The cell the Next key moves to, or `undefined` after the last one (the pad then closes). */
export function nextCell(
  entries: readonly Pick<LiveWorkoutEntry, 'exercise' | 'sets'>[],
  cell: Cell,
): Cell | undefined {
  const order = cellsInOrder(entries);
  const current = cell.field === 'rpe' ? { ...cell, field: 'reps' as const } : cell;
  const index = order.findIndex((candidate) => isSameCell(candidate, current));
  return index === -1 ? undefined : order[index + 1];
}
