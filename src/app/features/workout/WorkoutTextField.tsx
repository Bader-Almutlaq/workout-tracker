import { useState } from 'react';
import styles from './WorkoutTextField.module.css';

/** A metadata cell saved on blur, like the number pad; notes preserve line breaks in a textarea. */
export function WorkoutTextField({
  label,
  value,
  onSave,
  type = 'text',
  isMultiline = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly onSave: (value: string) => void;
  readonly type?: 'text' | 'datetime-local' | 'number';
  readonly isMultiline?: boolean;
}) {
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const save = (typed: string) => {
    if (typed !== value) onSave(typed);
    setDraft(undefined);
  };
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {isMultiline ? (
        <textarea
          className={styles.control}
          value={draft ?? value}
          onFocus={() => setDraft(value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => save(event.target.value)}
        />
      ) : (
        <input
          className={styles.control}
          type={type}
          value={draft ?? value}
          onFocus={() => setDraft(value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => save(event.target.value)}
        />
      )}
    </label>
  );
}
