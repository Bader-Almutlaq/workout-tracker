import { Trash2 } from 'lucide-react';
import type { SetKind } from '../../../core/models/SetKind';
import { ActionMenu } from '../../design/components/ActionMenu';
import styles from './SetKindMenu.module.css';
import { SET_KIND_CHOICES, SET_KIND_NAMES } from './setKindItems';

/** The label at the start of a set row ("1", "W", "D", "F"). Tapping it picks the kind of set or deletes the set. */
export function SetKindMenu({
  label,
  kind,
  onSelectKind,
  onDelete,
  onAddNote,
}: {
  readonly label: string;
  readonly kind: SetKind;
  readonly onSelectKind: (kind: SetKind) => void;
  readonly onDelete: () => void;
  readonly onAddNote?: () => void;
}) {
  const kindItems = SET_KIND_CHOICES.map((choice) => ({
    label: SET_KIND_NAMES[choice],
    isSelected: choice === kind,
    onSelect: () => onSelectKind(choice),
  }));
  return (
    <ActionMenu
      label={`Set ${label}, ${SET_KIND_NAMES[kind]}`}
      align="start"
      items={[
        ...kindItems,
        ...(onAddNote === undefined ? [] : [{ label: 'Add note', onSelect: onAddNote }]),
        { label: 'Delete set', icon: Trash2, isDestructive: true, onSelect: onDelete },
      ]}
    >
      <span className={styles.label} data-kind={kind}>
        {label}
      </span>
    </ActionMenu>
  );
}
