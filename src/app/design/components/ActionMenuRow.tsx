import { Check, type LucideIcon } from 'lucide-react';
import styles from './ActionMenu.module.css';

/** One choice in an `ActionMenu`. */
export interface ActionMenuItem {
  readonly label: string;
  readonly icon?: LucideIcon;
  /** Draws a check mark: the current choice in a list of choices. */
  readonly isSelected?: boolean;
  readonly isDisabled?: boolean;
  readonly isDestructive?: boolean;
  /** Owner-requested yellow deload action. */
  readonly isDeload?: boolean;
  readonly onSelect: () => void;
}

/** One row of an open `ActionMenu`. */
export function ActionMenuRow({ item, onChosen }: { readonly item: ActionMenuItem; readonly onChosen: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      role="menuitem"
      className={styles.row}
      data-deload={item.isDeload === true}
      data-destructive={item.isDestructive === true}
      disabled={item.isDisabled === true}
      onClick={() => {
        onChosen();
        item.onSelect();
      }}
    >
      {Icon !== undefined && <Icon size={16} strokeWidth={2} aria-hidden />}
      <span className={styles.rowLabel}>{item.label}</span>
      {item.isSelected === true && <Check size={16} strokeWidth={2} aria-hidden />}
    </button>
  );
}
