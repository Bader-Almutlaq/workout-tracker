import type { IntensityBucket } from '../../../core/queries/IntensityMix';
import { ChartTable } from '../../design/charts/ChartTable';
import styles from './AnalyticsIntensity.module.css';

/** Hard-set repetition ranges, with counts and an accessible table. */
export function RepRangeBars({ buckets }: { readonly buckets: readonly IntensityBucket[] }) {
  const hasSets = buckets.some((bucket) => bucket.count > 0);
  return (
    <section className={styles.section}>
      <h2>Rep ranges</h2>
      {!hasSets ? (
        <p>No hard sets in this period.</p>
      ) : (
        <>
          {buckets.map((bucket) => (
            <div className={styles.row} key={bucket.label}>
              <span>{bucket.label}</span>
              <span className={styles.track}>
                <span className={styles.bar} style={{ width: `${bucket.percent}%` }} />
              </span>
              <span>
                {bucket.percent.toFixed(0)}% ({bucket.count})
              </span>
            </div>
          ))}
          <ChartTable
            caption="Hard sets by rep range"
            columns={['Reps', 'Sets', 'Share']}
            rows={buckets.map((bucket) => ({
              key: bucket.label,
              cells: [bucket.label, String(bucket.count), `${bucket.percent.toFixed(1)}%`],
            }))}
          />
        </>
      )}
    </section>
  );
}
