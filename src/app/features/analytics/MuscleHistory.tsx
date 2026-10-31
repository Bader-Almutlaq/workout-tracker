import { FORMAT_LOCALE } from '../../format/formatLocale';
import { BottomSheet } from '../../design/components/BottomSheet';
import { MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import type { WeeklyMuscleVolume } from '../../../core/queries/WeeklyMuscleVolume';
import { formatVolume } from './MuscleBars';
import styles from './Analytics.module.css';

const weekFormat = new Intl.DateTimeFormat(FORMAT_LOCALE, { timeZone: 'UTC', month: 'short', day: 'numeric' });

/** Modal showing one muscle's fractional hard sets for each calendar week it is given. */
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
    <BottomSheet
      title={`${MUSCLE_DISPLAY_NAMES[muscle]} · ${weeks.length} ${weeks.length === 1 ? 'week' : 'weeks'}`}
      onClose={onClose}
    >
      <div className={styles.dialogHeader}>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className={styles.quiet}>Fractional hard sets per week, starting Monday</p>
      <div className={styles.history}>
        {values.map((item) => (
          <div className={styles.historyRow} key={item.week}>
            <span>{weekFormat.format(new Date(item.week))}</span>
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
