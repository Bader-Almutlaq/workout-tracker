import styles from './Field.module.css';

/**
 * A labelled picker using the phone's own wheel. `noneLabel` is the first option and stands for
 * the empty value `''` (for example "None").
 */
export function SelectField({
  label,
  noneLabel,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly noneLabel?: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select className={styles.control} value={value} onChange={(event) => onChange(event.target.value)}>
        {noneLabel !== undefined && <option value="">{noneLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
