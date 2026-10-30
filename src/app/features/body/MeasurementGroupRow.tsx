import type { MeasurementGroup } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { groupValues, measurementChangeText, siteUnit } from './measurementText';
import styles from './Body.module.css';

/** A compact selectable group, with its latest values and dated comparisons. */
export function MeasurementGroupRow({
  group,
  units,
  onSelect,
  empty = false,
}: {
  readonly group: MeasurementGroup;
  readonly units: MeasurementUnits;
  readonly onSelect: (key: string) => void;
  readonly empty?: boolean;
}) {
  return (
    <button type="button" className={styles.rowButton} onClick={() => onSelect(group.key)}>
      <span className={styles.rowHeading}>
        <span>{group.name}</span>
        {!empty && <span>{groupValues(group, 'relaxed', units)}</span>}
      </span>
      {!empty &&
        group.sites.flatMap((summary) =>
          (['relaxed', 'flexed'] as const).map((state) => {
            const change = summary[state];
            if (change.latest === null) return null;
            const side = summary.site.side === null ? '' : `${summary.site.side === 'left' ? 'L' : 'R'} · `;
            const label = state === 'flexed' ? 'Flexed · ' : '';
            return (
              <span key={`${summary.site.key}-${state}`} className={styles.caption}>
                {side}
                {label}
                {measurementChangeText(
                  change.fourWeeks,
                  siteUnit(summary.site, units),
                  change.fourWeeksReference?.takenAt ?? null,
                  change.first?.takenAt ?? null,
                )}
              </span>
            );
          }),
        )}
      {!empty && group.sites.some((site) => site.flexed.latest !== null) && (
        <span className={styles.caption}>Flexed · {groupValues(group, 'flexed', units)}</span>
      )}
    </button>
  );
}
