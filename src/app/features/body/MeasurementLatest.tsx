import type { MeasurementDetail } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { measurementText } from './measurementText';
import styles from './Body.module.css';

/** Latest recorded values, independent for each supported state. */
export function MeasurementLatest({
  detail,
  unit,
}: {
  readonly detail: MeasurementDetail;
  readonly unit: MeasurementUnit;
}) {
  return (
    <div className={styles.values}>
      <p>Relaxed · {measurementText(detail.relaxed.latest?.value ?? null, unit)}</p>
      {detail.site.supportsFlexed && <p>Flexed · {measurementText(detail.flexed.latest?.value ?? null, unit)}</p>}
    </div>
  );
}
