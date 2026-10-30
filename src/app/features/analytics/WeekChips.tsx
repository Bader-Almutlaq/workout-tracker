import type { WeekChoice } from './volumeLayout';
import styles from './Analytics.module.css';

/** Calendar period selector for the muscle volume chart. */
export function WeekChips({
  choice,
  onChange,
}: {
  readonly choice: WeekChoice;
  readonly onChange: (choice: WeekChoice) => void;
}) {
  const choices: readonly [WeekChoice, string][] = [
    ['this', 'This week'],
    ['last', 'Last week'],
    ['average', '4-week average'],
  ];
  return (
    <div className={styles.chips} aria-label="Week">
      {choices.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={styles.chip}
          aria-pressed={choice === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
