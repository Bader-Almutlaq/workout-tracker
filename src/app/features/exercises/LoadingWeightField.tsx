import { useState } from 'react';
import styles from './LoadingWeightField.module.css';

/** Decimal loading input; keeps partial typing intact and commits on blur so unit conversion cannot eat a decimal point. */
export function LoadingWeightField({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const [typed, setTyped] = useState<string>();
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        className={styles.control}
        placeholder="Default"
        value={typed ?? value}
        onChange={(event) => setTyped(event.target.value)}
        onBlur={() => {
          if (typed !== undefined) onChange(typed.trim());
          setTyped(undefined);
        }}
      />
    </label>
  );
}
