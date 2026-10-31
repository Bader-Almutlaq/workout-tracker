import { useState } from 'react';
import styles from './WorkoutTextField.module.css';

/**
 * A metadata cell saved on blur, like the number pad; notes preserve line breaks in a textarea.
 * An empty note starts as a small "+ Add" link so edit mode isn't a wall of empty boxes.
 */
export function WorkoutTextField({
  label,
  value,
  onSave,
  type = 'text',
  isMultiline = false,
  initiallyOpen = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly onSave: (value: string) => void;
  readonly type?: 'text' | 'datetime-local' | 'number';
  readonly isMultiline?: boolean;
  readonly initiallyOpen?: boolean;
}) {
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const save = (typed: string) => {
    if (typed !== value || initiallyOpen) onSave(typed);
    setDraft(undefined);
  };
  if (isMultiline && value === '' && draft === undefined && !isOpen) {
    return (
      <button type="button" className={styles.add} onClick={() => setIsOpen(true)}>
        + Add {label.toLowerCase()}
      </button>
    );
  }
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {isMultiline ? (
        <textarea
          className={styles.control}
          autoFocus={isOpen && value === ''}
          value={draft ?? value}
          onFocus={() => setDraft(value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => {
            save(event.target.value);
            setIsOpen(false);
          }}
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
