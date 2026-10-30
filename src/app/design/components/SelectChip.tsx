import { ChevronDown } from 'lucide-react';
import styles from './SelectChip.module.css';

/** One choice in a `SelectChip`. */
export interface SelectChipOption {
  readonly value: string;
  readonly label: string;
}

/** A titled run of choices, shown as an `optgroup`. */
export interface SelectChipGroup {
  readonly label: string;
  readonly options: readonly SelectChipOption[];
}

/**
 * A filter pill that opens the phone's own picker. A transparent native `<select>` covers the pill,
 * so a tap shows the iOS wheel with no custom menu. `value` is `''` for "any"; the pill then shows
 * `label`, otherwise the chosen option's label.
 */
export function SelectChip({
  label,
  anyLabel,
  groups,
  value,
  onChange,
}: {
  readonly label: string;
  readonly anyLabel: string;
  readonly groups: readonly SelectChipGroup[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const chosen = groups.flatMap((group) => group.options).find((option) => option.value === value);
  return (
    <label className={styles.chip} data-active={chosen !== undefined}>
      <span>{chosen?.label ?? label}</span>
      <ChevronDown size={14} strokeWidth={2} aria-hidden />
      <select
        className={styles.select}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{anyLabel}</option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
