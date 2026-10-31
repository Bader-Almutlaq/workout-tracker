import type { MuscleCoverageItem } from '../../../core/queries/MuscleCoverage';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import styles from './MuscleCoverage.module.css';

/** Main muscles averaging fewer than four fractional hard sets in the last four weeks. */
export function NeglectedMuscles({ muscles }: { readonly muscles: readonly MuscleCoverageItem[] }) {
  return (
    <section className={styles.section}>
      <h2>Neglected</h2>
      <p className={styles.quiet}>Under 4 sets a week over the last 4 weeks</p>
      {muscles.length === 0 ? (
        <p>None in the last 4 weeks</p>
      ) : (
        <div className={styles.list}>
          {muscles.map((item) => (
            <div className={styles.row} key={item.muscle}>
              <span>{MUSCLE_DISPLAY_NAMES[item.muscle]}</span>
              <span>
                {item.daysSince === null ? 'Never trained directly' : `${item.daysSince} days since direct training`}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
