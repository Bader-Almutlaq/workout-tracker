import type { MeasurementGroup } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { groupValues, measurementChangeText, siteUnit } from './measurementText';
import styles from './Body.module.css';

/** Paired left/right latest values share one row; side buttons open each full history. */
export function MeasurementGroupRow({
  group,
  units,
  onSelect,
}: {
  readonly group: MeasurementGroup;
  readonly units: MeasurementUnits;
  readonly onSelect: (key: string) => void;
}) {
  const hasFlexed = group.sites.some((summary) => summary.flexed.latest !== null);
  return (
    <section className={styles.row}>
      <h2 className={styles.title}>{group.name}</h2>
      <p className={styles.values}>{groupValues(group, 'relaxed', units)}</p>
      {hasFlexed && <p className={styles.values}>Flexed · {groupValues(group, 'flexed', units)}</p>}
      {group.sites.map((summary) => (
        <div key={summary.site.key} className={styles.stack}>
          <button
            type="button"
            className={styles.note}
            onClick={() => onSelect(summary.site.key)}
            aria-label={`Open ${summary.site.name} history`}
          >
            {summary.site.name} · History
          </button>
          <p className={styles.caption}>
            {summary.site.side !== null ? `${summary.site.side === 'left' ? 'L' : 'R'} · ` : ''}
            {measurementChangeText(summary.relaxed.fourWeeks, siteUnit(summary.site, units), 'in 4 weeks')}
            {summary.relaxed.latest !== null && summary.site.supportsFlexed ? ' · relaxed' : ''}
          </p>
          {summary.flexed.latest !== null && (
            <p className={styles.caption}>
              Flexed · {measurementChangeText(summary.flexed.fourWeeks, siteUnit(summary.site, units), 'in 4 weeks')}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
