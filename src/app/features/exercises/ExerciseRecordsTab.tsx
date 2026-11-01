import { ExerciseRpeChart } from './ExerciseRpeChart';
import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { estimateText } from '../../format/estimateText';
import { weightText, volumeText } from '../../format/weightText';
import { ExerciseRecordRow } from './ExerciseRecordRow';
import { ExerciseRepMaxTable } from './ExerciseRepMaxTable';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';

/** Lifetime records and the 1–12-rep table load independently of Charts and History. */
export function ExerciseRecordsTab({
  exerciseId,
  unit,
  tracking,
}: {
  readonly exerciseId: number;
  readonly unit: WeightUnit;
  readonly tracking: ExerciseTracking;
}) {
  const query = useDatabaseQuery(`exercise-records-${exerciseId}`, () => database.exerciseRecords(exerciseId));
  if (query.status !== 'ready') return <ExerciseQueryMessage query={query} />;
  if (tracking === 'duration' || tracking === 'bodyweight-reps')
    return (
      <p>
        Weight records and rep-max predictions do not apply to this exercise. See Charts for{' '}
        {tracking === 'duration' ? 'duration' : 'reps'}.
      </p>
    );
  const records = query.value;
  return (
    <>
      {tracking === 'weight-reps' && (
        <ExerciseRecordRow
          label="Estimated 1RM"
          record={records.estimatedOneRepMax}
          formatValue={(value) => estimateText(value, unit)}
          unit={unit}
          showSet
        />
      )}
      <ExerciseRecordRow
        label="Heaviest weight"
        record={records.heaviestWeight}
        formatValue={(value) => weightText(value, unit)}
        unit={unit}
        showSet={tracking === 'weight-reps'}
      />
      {tracking === 'weight-reps' && (
        <ExerciseRecordRow
          label="Best session volume"
          record={records.sessionVolume}
          formatValue={volumeText}
          unit={unit}
        />
      )}
      {records.repMax.length > 0 && <ExerciseRepMaxTable rows={records.repMax} unit={unit} />}
      {tracking === 'weight-reps' && <ExerciseRpeChart exerciseId={exerciseId} unit={unit} />}
    </>
  );
}
