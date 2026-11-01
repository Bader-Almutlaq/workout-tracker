import type { ExerciseProgressReport } from '../../../core/queries/ExerciseProgress';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { estimateText } from '../../format/estimateText';
import { dayWithYearText } from '../../format/dateText';
import { progressChangeText, progressTopSetText } from './progressText';
import styles from './ExerciseProgress.module.css';

/** Three compact, wrapping summaries; trend/change exclude deloads, the last-session top set preserves the recorded load. */
export function ExerciseProgressTiles({
  report,
  unit,
  bodyweight,
}: {
  readonly report: ExerciseProgressReport;
  readonly unit: WeightUnit;
  readonly bodyweight: boolean;
}) {
  const last = report.sessions.at(-1);
  const changes = report.changes;
  return (
    <div className={styles.tiles}>
      <div className={styles.tile}>
        <h2>e1RM now</h2>
        <p className={styles.value}>{report.trendNow === null ? '—' : estimateText(report.trendNow, unit)}</p>
        <p>{progressChangeText(changes?.estimatedOneRepMaxPercent ?? null)}</p>
      </div>
      <div className={styles.tile}>
        <h2>Best e1RM</h2>
        <p className={styles.value}>
          {report.bestEstimate === null ? '—' : estimateText(report.bestEstimate.value, unit)}
        </p>
        <p>{report.bestEstimate === null ? 'No estimate yet' : dayWithYearText(report.bestEstimate.date)}</p>
      </div>
      <div className={styles.tile}>
        <h2>Top set</h2>
        <p className={styles.topSet}>{progressTopSetText(last?.topSet ?? null, unit, bodyweight)}</p>
        <p>{last === undefined ? 'No sessions yet' : `Last session${last.isDeload ? ' · Deload' : ''}`}</p>
        {changes !== null && (
          <p>
            {progressTopSetText(changes.topSet.before, unit, bodyweight)} →{' '}
            {progressTopSetText(changes.topSet.after, unit, bodyweight)}
          </p>
        )}
      </div>
    </div>
  );
}
