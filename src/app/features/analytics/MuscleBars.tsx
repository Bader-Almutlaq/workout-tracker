import type { MuscleVolume } from '../../../core/analytics/MuscleVolume';
import { MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import { sortedVolume, volumeScale, zonePositions } from './volumeLayout';
import styles from './Analytics.module.css';

/** Stacked fractional-set bars with a shared scale and descriptive evidence bands. */
export function MuscleBars({
  muscles,
  onSelect,
}: {
  readonly muscles: readonly MuscleVolume[];
  readonly onSelect: (muscle: Muscle) => void;
}) {
  const sorted = sortedVolume(muscles);
  const trained = sorted.filter((muscle) => muscle.totalSets > 0);
  const untrained = sorted.filter((muscle) => muscle.totalSets === 0);
  const scale = volumeScale(muscles);
  return (
    <div>
      <div className={styles.legend}>
        Direct <span className={styles.indirectLegend}>Indirect</span> · fractional hard sets
      </div>
      <div className={styles.chart}>
        <div className={styles.bands} aria-hidden="true">
          {zonePositions(scale).map((zone, index) => (
            <div
              key={zone.label}
              className={index % 2 === 0 ? styles.band : styles.bandAlternate}
              style={{ left: `${zone.start}%`, width: `${zone.width}%` }}
            >
              <span>{zone.label}</span>
            </div>
          ))}
        </div>
        {trained.map((item) => (
          <button
            key={item.muscle}
            type="button"
            className={styles.barRow}
            onClick={() => onSelect(item.muscle)}
            aria-label={`${MUSCLE_DISPLAY_NAMES[item.muscle]}: ${formatVolume(item.totalSets)} sets. Show history`}
          >
            <span className={styles.muscleName}>{MUSCLE_DISPLAY_NAMES[item.muscle]}</span>
            <span className={styles.track}>
              <span className={styles.segments} style={{ width: `${(item.totalSets / scale) * 100}%` }}>
                {item.directSets > 0 && <span className={styles.direct} style={{ flexGrow: item.directSets }} />}
                {item.indirectSets > 0 && <span className={styles.indirect} style={{ flexGrow: item.indirectSets }} />}
              </span>
            </span>
            <span className={styles.value}>{formatVolume(item.totalSets)}</span>
          </button>
        ))}
      </div>
      {untrained.length > 0 && (
        <p className={styles.quiet}>
          Not trained in this period:{' '}
          {untrained.map((item, index) => (
            <span key={item.muscle}>
              {index > 0 && ', '}
              <button type="button" className={styles.tableButton} onClick={() => onSelect(item.muscle)}>
                {MUSCLE_DISPLAY_NAMES[item.muscle]}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** Formats fractional sets to at most two decimal places. */
export function formatVolume(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}
