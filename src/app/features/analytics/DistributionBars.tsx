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
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
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
