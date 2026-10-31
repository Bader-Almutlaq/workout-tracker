import { useState } from 'react';
import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import { ProgressionRangeDialog } from './ProgressionRangeDialog';
import type { TemplateEditorActions } from './TemplateEditorActions';
import styles from './TemplateExerciseCard.module.css';

/** Per-workout progression control, requiring a confirmed range. */
export function ProgressionControl({
  exercise,
  index,
  actions,
}: {
  readonly exercise: TemplateExerciseDraft;
  readonly index: number;
  readonly actions: TemplateEditorActions;
}) {
  const [open, setOpen] = useState(false);
  const target = exercise.sets.find(
    (set) => set.kind !== 'warmup' && set.targetRepsLow !== null && set.targetRepsHigh !== null,
  );
  const enabled = exercise.progression === 'double';
  return (
    <>
      <button type="button" className={styles.progressionButton} data-enabled={enabled} onClick={() => setOpen(true)}>
        {enabled && target !== undefined ? `${target.targetRepsLow}–${target.targetRepsHigh} reps` : 'Progression'}
      </button>
      {open && (
        <ProgressionRangeDialog
          onCancel={() => setOpen(false)}
          onSave={(low, high) => {
            actions.setProgression(index, 'double', { low, high });
            setOpen(false);
          }}
          {...(enabled
            ? {
                onTurnOff: () => {
                  actions.setProgression(index, null);
                  setOpen(false);
                },
              }
            : {})}
        />
      )}
    </>
  );
}
