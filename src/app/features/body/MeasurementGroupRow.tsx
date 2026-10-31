import { Plus } from 'lucide-react';
import type { MeasurementGroup } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { groupValues } from './measurementText';
import styles from './Body.module.css';

/** One body-part row, keeping paired values together and offering a separate quick-log touch target. */
export function MeasurementGroupRow({
  group,
  units,
  onSelect,
  onLog,
}: {
  readonly group: MeasurementGroup;
  readonly units: MeasurementUnits;
  readonly onSelect: (key: string) => void;
  readonly onLog: (key: string) => void;
}) {
  const first = group.sites[0]?.site;
  const hasRelaxed = group.sites.some((item) => item.relaxed.latest !== null);
  const hasFlexed = group.sites.some((item) => item.flexed.latest !== null);
  return (
    <div className={styles.groupRow}>
      <button type="button" className={styles.rowButton} onClick={() => onSelect(group.key)}>
        <span className={styles.rowHeading}>
          <span>{group.name}</span>
          <span className={styles.latest}>
            {hasRelaxed && <span>{groupValues(group, 'relaxed', units)}</span>}
            {hasFlexed && <span>{groupValues(group, 'flexed', units)} · Flexed</span>}
          </span>
        </span>
      </button>
      <button
        type="button"
        className={styles.plus}
        aria-label={`Log ${group.name}`}
        onClick={() => {
          if (first !== undefined) onLog(first.key);
        }}
      >
        <Plus size={22} aria-hidden />
      </button>
    </div>
  );
}
