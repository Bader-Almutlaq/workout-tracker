import { useState } from 'react';
import { BottomSheet } from '../../design/components/BottomSheet';
import { weightText } from '../../format/weightText';
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
  const [selected, setSelected] = useState<'now' | 'best' | null>(null);
  const last = report.sessions.at(-1);
  const changes = report.changes;
  return (
    <>
      <div className={styles.tiles}>
        <button type="button" className={styles.tile} onClick={() => setSelected('now')}>
          <h2>e1RM now</h2>
          <p className={styles.value}>{report.trendNow === null ? '—' : estimateText(report.trendNow, unit)}</p>
          <p>{progressChangeText(changes?.estimatedOneRepMaxPercent ?? null)}</p>
        </button>
        <button type="button" className={styles.tile} onClick={() => setSelected('best')}>
          <h2>Best e1RM</h2>
          <p className={styles.value}>
            {report.bestEstimate === null ? '—' : estimateText(report.bestEstimate.value, unit)}
          </p>
          <p>{report.bestEstimate === null ? 'No estimate yet' : dayWithYearText(report.bestEstimate.date)}</p>
        </button>
        <div className={styles.tile}>
          <h2>Top set</h2>
          <p className={styles.value}>{progressTopSetText(last?.topSet ?? null, unit, bodyweight, false)}</p>
          <p>{last === undefined ? 'No sessions yet' : topSetDetail(last.topSet?.rpe ?? null, last.isDeload)}</p>
        </div>
      </div>
      {selected !== null && (
        <BottomSheet title={selected === 'now' ? 'e1RM now' : 'Best e1RM'} onClose={() => setSelected(null)}>
          {selected === 'now' && (
            <p>
              This is a smoothed trend across qualifying sessions, not an estimate from one set. The latest accepted set
              is shown below.
            </p>
          )}
          {(() => {
            const source = selected === 'now' ? report.latestEstimateSource : report.bestEstimateSource;
            if (source === null) return <p>No qualifying set yet.</p>;
            return (
              <>
                <p>
                  {dayWithYearText(source.date)}: {weightText(source.set.weightKilograms, unit)} × {source.set.reps}
                </p>
                <p>
                  {source.set.kind === 'failure'
                    ? 'Failure: 0 reps left'
                    : source.set.rpe === null
                      ? 'RPE not logged: counted as 2 reps left'
                      : `RPE ${source.set.rpe}`}
                </p>
                <p>weight × (1 + (reps + reps left − 1) ÷ k)</p>
                {report.curve !== null && (
                  <p>
                    k = {report.curve.k} (
                    {report.curve.isPersonal
                      ? `learned from your sets, n = ${report.curve.personalSets}`
                      : 'default for its type'}
                    )
                  </p>
                )}
              </>
            );
          })()}
        </BottomSheet>
      )}
    </>
  );
}
