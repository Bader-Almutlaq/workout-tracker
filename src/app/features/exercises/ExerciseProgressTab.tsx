import { weekdayText } from '../templates/weekday';
import { useState } from 'react';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { ToggleChip } from '../../design/components/ToggleChip';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';
import { ExerciseProgressContent } from './ExerciseProgressContent';
import { ExerciseProgressScope } from './ExerciseProgressScope';
import styles from './ExerciseProgress.module.css';

/** Progress entry point with saved-workout scope and recorded machine controls; all calculations stay in the worker. */
export function ExerciseProgressTab({
  exerciseId,
  templateId,
  unit,
  bodyweight,
  machine = null,
  onMachine,
}: {
  readonly exerciseId: number;
  readonly templateId?: number;
  readonly unit: WeightUnit;
  readonly bodyweight: boolean;
  readonly machine?: string | null;
  readonly onMachine?: (value: string | null) => void;
}) {
  const [selectedWorkout, setSelectedWorkout] = useState<number | undefined>(undefined);
  const filter =
    machine === null
      ? undefined
      : machine === 'unrecorded'
        ? null
        : machine.startsWith('brand:')
          ? machine.slice('brand:'.length)
          : undefined;
  const query = useDatabaseQuery(`exercise-progress-${exerciseId}-${templateId}-${machine}`, () =>
    database.exerciseProgress(exerciseId, templateId, filter),
  );
  if (query.status !== 'ready') return <ExerciseQueryMessage query={query} />;
  const report = query.value;
  const scope = selectedWorkout ?? templateId;
  return (
    <div className={styles.stack}>
      {templateId === undefined && report.otherWorkouts.length > 0 && (
        <div className={styles.filters} aria-label="By workout">
          <span>By workout</span>
          <ToggleChip isOn={selectedWorkout === undefined} onToggle={() => setSelectedWorkout(undefined)}>
            All
          </ToggleChip>
          {report.otherWorkouts.map((workout) => (
            <ToggleChip
              key={workout.id}
              isOn={selectedWorkout === workout.id}
              onToggle={() => setSelectedWorkout(workout.id)}
            >
              {workout.name}
              {workout.weekday === null ? '' : ` · ${weekdayText(workout.weekday)}`}
            </ToggleChip>
          ))}
        </div>
      )}
      {report.machineBrands.length >= 2 && (
        <div className={styles.filters} aria-label="Machine filter">
          <ToggleChip isOn={machine === null} onToggle={() => onMachine?.(null)}>
            All machines
          </ToggleChip>
          {report.machineBrands.map((brand) => {
            const value = brand === null ? 'unrecorded' : `brand:${brand}`;
            return (
              <ToggleChip key={value} isOn={machine === value} onToggle={() => onMachine?.(value)}>
                {brand ?? 'Not recorded'}
              </ToggleChip>
            );
          })}
        </div>
      )}
      {scope === templateId ? (
        <ExerciseProgressContent
          key={`${scope}-${machine}`}
          report={report}
          exerciseId={exerciseId}
          unit={unit}
          bodyweight={bodyweight}
          {...(scope === undefined ? {} : { templateId: scope })}
          {...(filter === undefined ? {} : { machine: filter })}
        />
      ) : (
        scope !== undefined && (
          <ExerciseProgressScope
            key={`${scope}-${machine}`}
            exerciseId={exerciseId}
            templateId={scope}
            unit={unit}
            bodyweight={bodyweight}
            {...(filter === undefined ? {} : { machine: filter })}
          />
        )
      )}
    </div>
  );
}
