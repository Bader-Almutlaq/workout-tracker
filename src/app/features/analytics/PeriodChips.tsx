import type { AnalyticsPeriod } from './analyticsPeriod';
import styles from './Analytics.module.css';

/** Selects the shared whole-week analytics range. */
export function PeriodChips({
  value,
  onChange,
}: {
  readonly value: AnalyticsPeriod;
  readonly onChange: (value: AnalyticsPeriod) => void;
}) {
  const periods: readonly AnalyticsPeriod[] = ['4W', '12W', '6M', '1Y', 'All'];
  return (
    <div className={styles.chips} aria-label="Analytics period">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          className={styles.chip}
          aria-pressed={period === value}
          onClick={() => onChange(period)}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
