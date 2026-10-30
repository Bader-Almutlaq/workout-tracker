import type { MuscleVolume } from '../../../core/analytics/MuscleVolume';
import { MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import { formatVolume } from './MuscleBars';
import { sortedVolume } from './volumeLayout';
import styles from './Analytics.module.css';

/** Accessible table of direct, indirect and total fractional sets. */
export function VolumeTable({
  muscles,
  onSelect,
}: {
  readonly muscles: readonly MuscleVolume[];
  readonly onSelect: (muscle: Muscle) => void;
}) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Muscle</th>
          <th>Direct</th>
          <th>Indirect</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {sortedVolume(muscles).map((item) => (
          <tr key={item.muscle}>
            <th>
              <button type="button" className={styles.tableButton} onClick={() => onSelect(item.muscle)}>
                {MUSCLE_DISPLAY_NAMES[item.muscle]}
              </button>
            </th>
            <td>{formatVolume(item.directSets)}</td>
            <td>{formatVolume(item.indirectSets)}</td>
            <td>{formatVolume(item.totalSets)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
