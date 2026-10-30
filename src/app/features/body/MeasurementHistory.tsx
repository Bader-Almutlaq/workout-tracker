import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementSite, MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { Button } from '../../design/components/Button';
import { measurementText } from './measurementText';
import { measurementTimestamp } from './measurementTimestamp';
import styles from './Body.module.css';

/** Every entry, newest first, with explicit edit/delete actions. */
export function MeasurementHistory({
  entries,
  unit,
  sites,
  onEdit,
  onDelete,
}: {
  readonly entries: readonly BodyMeasurement[];
  readonly unit: MeasurementUnit;
  readonly sites: readonly MeasurementSite[];
  readonly onEdit: (entry: BodyMeasurement) => void;
  readonly onDelete: (entry: BodyMeasurement) => void;
}) {
  return (
    <section className={styles.stack} aria-label="Full measurement history">
      <h3 className={styles.title}>All measurements</h3>
      {entries.toReversed().map((entry) => (
        <div key={entry.id} className={styles.row}>
          <p className={styles.values}>
            {measurementText(entry.value, unit)} · {sites.find((site) => site.key === entry.site)?.name ?? entry.site}
          </p>
          <p className={styles.caption}>{measurementTimestamp(entry.takenAt)}</p>
          <div className={styles.actions}>
            <Button onPress={() => onEdit(entry)}>Edit</Button>
            <Button variant="destructive" onPress={() => onDelete(entry)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
