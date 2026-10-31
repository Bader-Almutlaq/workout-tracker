import { useState } from 'react';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { TextField } from '../../design/components/TextField';
import { ProgressionRangeDefaults } from './templateProgressionEdits';

/** Confirms the owner's rep range for working sets that have no complete targets yet. */
export function ProgressionRangeDialog({
  onSave,
  onCancel,
}: {
  readonly onSave: (low: number, high: number) => void;
  readonly onCancel: () => void;
}) {
  const [low, setLow] = useState(String(ProgressionRangeDefaults.low));
  const [high, setHigh] = useState(String(ProgressionRangeDefaults.high));
  const minimum = Number(low);
  const maximum = Number(high);
  const valid = Number.isInteger(minimum) && Number.isInteger(maximum) && minimum > 0 && maximum >= minimum;
  return (
    <ConfirmDialog
      title="Choose a rep range"
      confirmLabel="Use range"
      isBusy={!valid}
      onCancel={onCancel}
      onConfirm={() => {
        if (valid) onSave(minimum, maximum);
      }}
    >
      <p>For working sets without a complete range. Adjust each set and its optional target RPE in the editor.</p>
      <TextField label="Minimum reps" value={low} onChange={setLow} />
      <TextField label="Maximum reps" value={high} onChange={setHigh} />
      {!valid && <p role="alert">Enter a positive whole-number range, with maximum at least minimum.</p>}
    </ConfirmDialog>
  );
}
