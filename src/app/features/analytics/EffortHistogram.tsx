import type { IntensityBucket } from '../../../core/queries/IntensityMix';
import { ChartTable } from '../../design/charts/ChartTable';
import styles from './AnalyticsIntensity.module.css';

/** Logged RIR distribution and count of working sets without logged effort. */
export function EffortHistogram({
  buckets,
  notLogged,
}: {
  readonly buckets: readonly IntensityBucket[];
  readonly notLogged: number;
}) {
  const hasSets = buckets.some((bucket) => bucket.count > 0);
  return (
    <section className={styles.section}>
      <h2>Effort: each bar is a share of working sets</h2>
      <p>Logged effort in this period.</p>
      {!hasSets ? (
        <p>No effort logged in this period.</p>
      ) : (
        <>
          {buckets.map((bucket) => (
            <div className={styles.row} key={bucket.label}>
              <span>
                {bucket.label} RIR · RPE {bucket.rpeLabel}
              </span>
              <span className={styles.track}>
                <span className={styles.bar} style={{ width: `${bucket.percent}%` }} />
              </span>
              <span>
                {bucket.count} · {bucket.percent.toFixed(0)}%
              </span>
            </div>
          ))}
          <ChartTable
            caption="Working sets by reps in reserve"
            columns={['RIR', 'Sets', 'Share']}
            rows={buckets.map((bucket) => ({
              key: bucket.label,
              cells: [bucket.label, String(bucket.count), `${bucket.percent.toFixed(1)}%`],
            }))}
          />
        </>
      )}
      <p className={styles.quiet}>Not logged: {notLogged}</p>
    </section>
  );
}
