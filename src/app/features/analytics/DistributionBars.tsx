import type { IntensityBucket } from '../../../core/queries/IntensityMix';
import { ChartTable } from '../../design/charts/ChartTable';
import styles from './AnalyticsIntensity.module.css';

/** A count distribution with its percentage and accessible table. */
export function DistributionBars({
  title,
  buckets,
}: {
  readonly title: string;
  readonly buckets: readonly IntensityBucket[];
}) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <p>{total} sets in this period. Each bar is a share of sets.</p>
      {buckets.map((bucket) => (
        <div className={styles.row} key={bucket.label}>
          <span>{bucket.label}</span>
          <span className={styles.track}>
            <span className={styles.bar} style={{ width: `${bucket.percent}%` }} />
          </span>
          <span>
            {bucket.count} · {bucket.percent.toFixed(0)}%
          </span>
        </div>
      ))}
      <ChartTable
        caption={title}
        columns={['Range', 'Sets', 'Share']}
        rows={buckets.map((bucket) => ({
          key: bucket.label,
          cells: [bucket.label, String(bucket.count), `${bucket.percent.toFixed(1)}%`],
        }))}
      />
    </section>
  );
}
