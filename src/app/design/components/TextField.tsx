import styles from './Field.module.css';

/** A labelled single-line text input. The input is 16 px so iOS doesn't zoom into it. */
export function TextField({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type="text"
        className={styles.control}
        value={value}
        autoCapitalize="words"
        autoCorrect="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
