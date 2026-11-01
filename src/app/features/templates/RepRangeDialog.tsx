import { useState } from 'react';
import { WorkoutLoggerLimits } from '../../../core/logging/WorkoutLogger';
import type { TemplateSetDraft } from '../../../core/templates/TemplateDraft';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { TextField } from '../../design/components/TextField';

/** Rep targets applied to each non-warm-up set. */
export type RepRange = Pick<TemplateSetDraft, 'targetRepsLow' | 'targetRepsHigh' | 'targetRpe'>;

/** Edits a shared rep range and optional effort target. */
export function RepRangeDialog({
  target,
  workoutName,
  onSave,
  onCancel,
}: {
  readonly target: TemplateSetDraft | undefined;
  readonly workoutName?: string;
  readonly onSave: (range: RepRange) => void;
  readonly onCancel: () => void;
}) {
  const [low, setLow] = useState(target?.targetRepsLow?.toString() ?? '');
  const [high, setHigh] = useState(target?.targetRepsHigh?.toString() ?? '');
  const [rpe, setRpe] = useState(target?.targetRpe?.toString() ?? '');
  const [error, setError] = useState('');
  return (
    <ConfirmDialog
      title="Rep range"
      confirmLabel="Save"
      onCancel={onCancel}
      onConfirm={() => {
        const lower = Number(low);
        const upper = Number(high);
        const effort = rpe.trim() === '' ? null : Number(rpe);
        if (
          !Number.isInteger(lower) ||
          !Number.isInteger(upper) ||
          lower < 1 ||
          upper < lower ||
          upper > WorkoutLoggerLimits.maximumReps ||
          (effort !== null &&
            (!Number.isFinite(effort) ||
              effort < WorkoutLoggerLimits.rpeRange.minimum ||
              effort > WorkoutLoggerLimits.rpeRange.maximum ||
              (effort * 2) % 1 !== 0))
        ) {
          setError('Enter a valid rep range and an RPE from 1 to 10 in half steps.');
          return;
        }
        onSave({ targetRepsLow: lower, targetRepsHigh: upper, targetRpe: effort });
      }}
    >
      {workoutName !== undefined && <p>Saves to {workoutName}</p>}
      <TextField label="Low reps" value={low} onChange={setLow} />
      <TextField label="High reps" value={high} onChange={setHigh} />
      <TextField label="RPE target (optional)" value={rpe} onChange={setRpe} />
      {error && <p role="alert">{error}</p>}
    </ConfirmDialog>
  );
}
