import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementSite, MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { SwipeToDelete } from '../../design/components/SwipeToDelete';
import { measurementText } from './measurementText';
import { measurementTimestamp } from './measurementTimestamp';
import styles from './Body.module.css';

/** Every entry, newest first, one compact row each: tap to edit, swipe left to delete. */
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
    <section className={styles.historyList} aria-label="Full measurement history">
      {entries.length === 0 ? (
        <p>No measurements yet.</p>
      ) : (
        <p className={styles.caption}>Tap an entry to edit it, or swipe left to delete.</p>
      )}
      {entries.toReversed().map((entry) => {
        const site = sites.find((item) => item.key === entry.site)?.name ?? entry.site;
        return (
          <SwipeToDelete
            key={entry.id}
            label={`Delete ${site} ${measurementText(entry.value, unit)}`}
            onDelete={() => onDelete(entry)}
          >
            <button type="button" className={styles.historyRow} onClick={() => onEdit(entry)}>
              <span className={styles.historyWhen}>
                {measurementTimestamp(entry.takenAt)}
                <span className={styles.caption}>
                  {sites.length > 1 ? `${site} · ` : ''}
                  {entry.state === 'flexed' ? 'Flexed' : 'Relaxed'}
                </span>
              </span>
              <span className={styles.values}>{measurementText(entry.value, unit)}</span>
            </button>
          </SwipeToDelete>
        );
      })}
    </section>
  );
}
