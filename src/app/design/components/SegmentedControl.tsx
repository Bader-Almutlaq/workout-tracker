import styles from './SegmentedControl.module.css';

/** A row of mutually exclusive options, like iOS's segmented control. */
export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  /** Read by screen readers; not shown. */
  readonly label: string;
  readonly options: readonly { readonly value: Value; readonly label: string }[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
}) {
  return (
    <div className={styles.control} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={styles.option}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
