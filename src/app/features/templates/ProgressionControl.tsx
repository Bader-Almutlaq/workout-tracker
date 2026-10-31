import { useState } from 'react';
import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import { SelectField } from '../../design/components/SelectField';
import { ProgressionRangeDialog } from './ProgressionRangeDialog';
import type { TemplateEditorActions } from './TemplateEditorActions';
import styles from './TemplateExerciseCard.module.css';

/** Per-workout opt-in; incomplete targets require a confirmed range before enabling suggestions. */
export function ProgressionControl({
  exercise,
  index,
  actions,
}: {
  readonly exercise: TemplateExerciseDraft;
  readonly index: number;
  readonly actions: TemplateEditorActions;
}) {
  const [asksForRange, setAsksForRange] = useState(false);
  return (
    <div className={styles.progression}>
      <SelectField
        label="Progression"
        noneLabel="Off"
        value={exercise.progression ?? ''}
        options={[{ value: 'double', label: 'Reps then weight' }]}
        onChange={(value) => {
          if (value !== 'double') {
            actions.setProgression(index, null);
            return;
          }
          const missing = exercise.sets.some(
            (set) => set.kind !== 'warmup' && (set.targetRepsLow === null || set.targetRepsHigh === null),
          );
          if (missing) setAsksForRange(true);
          else actions.setProgression(index, 'double');
        }}
      />
      {asksForRange && (
        <ProgressionRangeDialog
          onCancel={() => setAsksForRange(false)}
          onSave={(low, high) => {
            actions.setProgression(index, 'double', { low, high });
            setAsksForRange(false);
          }}
        />
      )}
    </div>
  );
}
