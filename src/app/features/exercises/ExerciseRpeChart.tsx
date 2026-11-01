import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';
import { ExerciseRpeChartContent } from './ExerciseRpeChartContent';

/** Deferred Records query; weights are already rounded by the worker using the lift's entry-unit load ladder. */
export function ExerciseRpeChart({ exerciseId, unit }: { readonly exerciseId: number; readonly unit: WeightUnit }) {
  const query = useDatabaseQuery(`exercise-rpe-${exerciseId}`, () => database.exerciseRpeChart(exerciseId));
  // Hook ownership stays in the content so the first ready result establishes the correct default mode.
  if (query.status !== 'ready') return <ExerciseQueryMessage query={query} />;
  return <ExerciseRpeChartContent key={exerciseId} chart={query.value} unit={unit} />;
}
