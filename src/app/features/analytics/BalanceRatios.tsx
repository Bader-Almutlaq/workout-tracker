import type { CoverageRatio } from '../../../core/queries/MuscleCoverage';
import styles from './MuscleCoverage.module.css';

/** Descriptive pattern ratios and their whole hard-set counts. */
export function BalanceRatios({ ratios }: { readonly ratios: readonly CoverageRatio[] }) {
  return (
    <section className={styles.section}>
      <h2>Balance ratios</h2>
      <p className={styles.quiet}>No ideal ratio exists; this shows where your sets went.</p>
      {ratios.map((item) => (
        <div className={styles.row} key={item.label}>
          <span>{item.label}</span>
          <span>
            {item.ratio === null ? '—' : `${item.ratio.toFixed(1)} : 1`} ({item.first} / {item.second} sets)
          </span>
        </div>
      ))}
    </section>
  );
}
