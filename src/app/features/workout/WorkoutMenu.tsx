import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { ActionMenu } from '../../design/components/ActionMenu';

/** Session actions next to the name, outside the sticky elapsed-time and Finish bar. */
export function WorkoutMenu({
  onRename,
  onDiscard,
  onDeload,
}: {
  readonly onRename: () => void;
  readonly onDiscard: () => void;
  readonly onDeload?: () => void;
}) {
  return (
    <ActionMenu
      label="Workout options"
      items={[
        ...(onDeload === undefined ? [] : [{ label: 'Deload whole workout', isDeload: true, onSelect: onDeload }]),
        { label: 'Rename workout', icon: Pencil, onSelect: onRename },
        { label: 'Discard workout', icon: Trash2, isDestructive: true, onSelect: onDiscard },
      ]}
    >
      <Ellipsis size={20} strokeWidth={2} aria-hidden />
    </ActionMenu>
  );
}
