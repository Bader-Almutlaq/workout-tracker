import type { ExerciseSeriesPoint } from '../../../core/queries/ExerciseSeries';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { dayWithYearText } from '../../format/dateText';
import { loggedRpeSuffix } from '../../format/setText';
import { weightText } from '../../format/weightText';
import styles from './ExercisePage.module.css';

/** A dated record with the original effort/load, or an explicit absence; never replaces missing evidence with zero. */
export function ExerciseRecordRow({
  label,
  record,
  formatValue,
  unit,
  showSet = false,
}: {
  readonly label: string;
  readonly record: ExerciseSeriesPoint | null;
  readonly formatValue: (value: number) => string;
  readonly unit: WeightUnit;
  readonly showSet?: boolean;
}) {
  return (
    <div className={styles.record}>
      <h3 className={styles.heading}>{label}</h3>
      {record === null ? (
        <p className={styles.note}>No record yet.</p>
      ) : (
        <>
          <p className={styles.value}>{formatValue(record.value)}</p>
          <p className={styles.note}>{dayWithYearText(record.date)}</p>
          {showSet && (
            <p className={styles.note}>
              {weightText(record.set.weightKilograms, unit)} × {record.set.reps}
              {loggedRpeSuffix(record.set.rpe)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
