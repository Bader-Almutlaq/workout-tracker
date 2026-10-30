import { BottomSheet } from '../../design/components/BottomSheet';
import { MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import type { WeeklyMuscleVolume } from '../../../core/queries/WeeklyMuscleVolume';
import { formatVolume } from './MuscleBars';
import styles from './Analytics.module.css';

/** Modal showing twelve calendar weeks of one muscle's fractional hard sets. */
export function MuscleHistory({
  muscle,
  weeks,
  onClose,
}: {
  readonly muscle: Muscle;
  readonly weeks: readonly WeeklyMuscleVolume[];
  readonly onClose: () => void;
}) {
  const values = weeks.map((week) => ({
    week: week.weekStart,
    value: week.muscles.find((item) => item.muscle === muscle)?.totalSets ?? 0,
  }));
  const maximum = Math.max(1, ...values.map((item) => item.value));
  return (
    <BottomSheet title={`${MUSCLE_DISPLAY_NAMES[muscle]} · 12 weeks`} onClose={onClose}>
      <div className={styles.dialogHeader}>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className={styles.quiet}>Fractional hard sets per week, starting Monday</p>
      <div className={styles.history}>
        {values.map((item) => (
          <div className={styles.historyRow} key={item.week}>
            <span>{item.week}</span>
            <span className={styles.historyTrack}>
              <span className={styles.historyBar} style={{ width: `${(item.value / maximum) * 100}%` }} />
            </span>
            <span>{formatVolume(item.value)}</span>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
