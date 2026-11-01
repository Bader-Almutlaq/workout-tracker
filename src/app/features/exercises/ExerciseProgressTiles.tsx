import type { ExerciseProgressReport } from '../../../core/queries/ExerciseProgress';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { estimateText } from '../../format/estimateText';
import { dayWithYearText } from '../../format/dateText';
import { progressChangeText, progressTopSetText } from './progressText';
import styles from './ExerciseProgress.module.css';

/** RPE and session label under the top set, e.g. "RPE 8 · last session". */
function topSetDetail(rpe: number | null, isDeload: boolean): string {
  return [
    rpe === null ? null : `RPE ${rpe}`,
    rpe === null ? (isDeload ? 'Deload' : 'Last session') : isDeload ? 'deload' : 'last session',
  ]
    .filter(Boolean)
    .join(' · ');
}

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
        <p className={styles.value}>{progressTopSetText(last?.topSet ?? null, unit, bodyweight, false)}</p>
        <p>{last === undefined ? 'No sessions yet' : topSetDetail(last.topSet?.rpe ?? null, last.isDeload)}</p>
      </div>
    </div>
  );
}
