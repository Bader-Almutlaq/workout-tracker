import type { MeasurementDetail } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { measurementChangeText } from './measurementText';
import styles from './Body.module.css';

/** Latest values and descriptive per-state changes; missing comparisons stay explicit. */
export function MeasurementChangeFigures({
  detail,
  unit,
}: {
  readonly detail: MeasurementDetail;
  readonly unit: MeasurementUnit;
}) {
  return (
    <section className={styles.stack} aria-label="Measurement changes">
      {(detail.site.supportsFlexed ? (['relaxed', 'flexed'] as const) : (['relaxed'] as const)).map((state) => {
        const change = detail[state];
        return (
          <div key={state} className={styles.stack}>
            <h3 className={styles.title}>{state === 'relaxed' ? 'Relaxed' : 'Flexed'} changes</h3>
            <p className={styles.caption}>{measurementChangeText(change.fourWeeks, unit, 'in 4 weeks')}</p>
            <p className={styles.caption}>{measurementChangeText(change.twelveWeeks, unit, 'in 12 weeks')}</p>
            <p className={styles.caption}>{measurementChangeText(change.sinceFirst, unit, 'since first entry')}</p>
            <p className={styles.caption}>
              {measurementChangeText(change.perMonth, unit, 'per month (last 12 weeks)')}
            </p>
          </div>
        );
      })}
    </section>
  );
}
