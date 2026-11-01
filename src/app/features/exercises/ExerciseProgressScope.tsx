import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';
import { ExerciseProgressContent } from './ExerciseProgressContent';

/** A selected saved workout's Progress view; keyed by scope so old selection/readout never leaks into another workout. */
export function ExerciseProgressScope({
  exerciseId,
  templateId,
  machine,
  unit,
  bodyweight,
}: {
  readonly exerciseId: number;
  readonly templateId: number;
  readonly machine?: string | null;
  readonly unit: WeightUnit;
  readonly bodyweight: boolean;
}) {
  const query = useDatabaseQuery(`exercise-progress-${exerciseId}-${templateId}-${machine}`, () =>
    database.exerciseProgress(exerciseId, templateId, machine),
  );
  if (query.status !== 'ready') return <ExerciseQueryMessage query={query} />;
  return (
    <ExerciseProgressContent
      report={query.value}
      exerciseId={exerciseId}
      templateId={templateId}
      unit={unit}
      bodyweight={bodyweight}
      {...(machine === undefined ? {} : { machine })}
    />
  );
}
