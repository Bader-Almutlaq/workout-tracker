import { Search, X } from 'lucide-react';
import styles from './SearchField.module.css';

/**
 * A search box with a magnifier and a clear button. The input is 16 px so iOS doesn't zoom into it.
 * It is controlled: the screen owns the text.
 */
export function SearchField({
  value,
  placeholder,
  onChange,
}: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className={styles.field}>
      <Search size={16} strokeWidth={2} className={styles.icon} aria-hidden />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        onChange={(event) => onChange(event.target.value)}
      />
      {value !== '' && (
        <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => onChange('')}>
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}
