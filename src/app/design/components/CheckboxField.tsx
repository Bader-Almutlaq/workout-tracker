import styles from './Field.module.css';

/** A labelled on/off switch row, with an optional explanation under the label. */
export function CheckboxField({
  label,
  hint,
  isChecked,
  onChange,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly isChecked: boolean;
  readonly onChange: (isChecked: boolean) => void;
}) {
  return (
    <label className={`${styles.field} ${styles.checkbox}`}>
      <span className={styles.checkboxText}>
        <span className={styles.label}>{label}</span>
        {hint !== undefined && <span className={styles.hint}>{hint}</span>}
      </span>
      <input type="checkbox" checked={isChecked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
