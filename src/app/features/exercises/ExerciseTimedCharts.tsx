import { ToggleChip } from '../../design/components/ToggleChip';
import styles from './ExercisePage.module.css';
import type { LongRangeMark } from '../../design/charts/LongRangeChart';
import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import { database, useDatabaseQuery } from '../../data/database';
import { weightText } from '../../format/weightText';
import { ExerciseChart } from './ExerciseChart';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';

/** Applicable per-exercise series queried only when Charts opens; all chart weights remain in kg. */
export function ExerciseTimedCharts({
  exerciseId,
  tracking,
  machine = null,
  onMachine,
  templateId,
}: {
  readonly exerciseId: number;
  readonly tracking: ExerciseTracking;
  readonly templateId?: number;
  readonly machine?: string | null;
  readonly onMachine?: (value: string | null) => void;
}) {
  const filter =
    machine === null
      ? undefined
      : machine === 'unrecorded'
        ? null
        : machine.startsWith('brand:')
          ? machine.slice(6)
          : undefined;
  const query = useDatabaseQuery(
    `exercise-charts-${exerciseId}${templateId === undefined ? '' : `-${templateId}`}${machine === null ? '' : `-${machine}`}`,
    () => database.exerciseCharts(exerciseId, filter, templateId),
  );
  if (query.status !== 'ready') return <ExerciseQueryMessage query={query} />;
  const series = query.value;
  if (templateId !== undefined && series.machineBrands.length === 0)
    return <p>No sessions of this exercise in this workout yet.</p>;
  const marks = series.deloadDates.map<LongRangeMark>((date) => ({ date, kind: 'deload' }));
  return (
    <>
      {(series.machineBrands?.length ?? 0) >= 2 && (
        <div className={styles.machineFilters} aria-label="Machine filter">
          <ToggleChip isOn={machine === null} onToggle={() => onMachine?.(null)}>
            All machines
          </ToggleChip>
          {series.machineBrands.map((brand) => {
            const value = brand === null ? 'unrecorded' : `brand:${brand}`;
            return (
              <ToggleChip key={value} isOn={machine === value} onToggle={() => onMachine?.(value)}>
                {brand ?? 'Not recorded'}
              </ToggleChip>
            );
          })}
        </div>
      )}
      {(tracking === 'weight-reps' || tracking === 'weight-duration') && (
        <ExerciseChart
          title="Heaviest weight"
          marks={marks}
          points={series.heaviestWeight}
          formatValue={(value) => weightText(value, 'kg')}
        />
      )}
      {(tracking === 'duration' || tracking === 'weight-duration') && (
        <ExerciseChart
          marks={marks}
          title="Longest duration"
          points={series.duration}
          formatValue={(value) => `${value} s`}
        />
      )}
    </>
  );
}
