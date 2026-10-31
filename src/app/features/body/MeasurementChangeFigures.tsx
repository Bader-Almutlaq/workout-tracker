import type { MeasurementDetail } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementState, MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { measurementChangeText } from './measurementText';
import styles from './Body.module.css';

/** Dated comparisons for one side and the selected state. */
export function MeasurementChangeFigures({
  detail,
  state,
  unit,
}: {
  readonly detail: MeasurementDetail;
  readonly state: MeasurementState;
  readonly unit: MeasurementUnit;
}) {
  if (detail.entries.filter((entry) => entry.state === state).length < 2) {
    return <p className={styles.caption}>Changes appear after two entries.</p>;
  }
  const change = detail[state];
  const first = change.first?.takenAt ?? null;
  return (
    <section className={styles.stack} aria-label={`${detail.site.name} changes`}>
      <h3 className={styles.title}>{detail.site.side === null ? 'Changes' : detail.site.name}</h3>
      <p className={styles.caption}>
        4 weeks · {measurementChangeText(change.fourWeeks, unit, change.fourWeeksReference?.takenAt ?? null, first)}
      </p>
      <p className={styles.caption}>
        12 weeks ·{' '}
        {measurementChangeText(change.twelveWeeks, unit, change.twelveWeeksReference?.takenAt ?? null, first)}
      </p>
      <p className={styles.caption}>Since first · {measurementChangeText(change.sinceFirst, unit, first, first)}</p>
    </section>
  );
}
