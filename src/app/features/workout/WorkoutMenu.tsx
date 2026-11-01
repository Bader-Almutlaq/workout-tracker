import { useState } from 'react';
import type { DeloadSettings } from '../../../core/logging/DeloadPlan';
import { DeloadSheet } from './DeloadSheet';
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
  readonly onDeload?: (settings?: DeloadSettings) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionMenu
        label="Workout options"
        items={[
          ...(onDeload === undefined
            ? []
            : [{ label: 'Deload whole workout', isDeload: true, onSelect: () => setOpen(true) }]),
          { label: 'Rename workout', icon: Pencil, onSelect: onRename },
          { label: 'Discard workout', icon: Trash2, isDestructive: true, onSelect: onDiscard },
        ]}
      >
        <Ellipsis size={20} strokeWidth={2} aria-hidden />
      </ActionMenu>
      {open && (
        <DeloadSheet
          onClose={() => setOpen(false)}
          onSave={(settings) => {
            onDeload?.(settings);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
