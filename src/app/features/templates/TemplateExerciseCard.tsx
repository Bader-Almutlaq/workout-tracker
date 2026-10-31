import { useState } from 'react';
import type { Equipment } from '../../../core/library/Equipment';
import { usesMachineBrand } from '../../../core/library/MachineBrands';
import { MachineBrandSheet } from '../workout/MachineBrandSheet';
import { ProgressionControl } from './ProgressionControl';
import { Plus } from 'lucide-react';
import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import type { TargetCell } from './TargetCell';
import type { TemplateEditorActions } from './TemplateEditorActions';
import styles from './TemplateExerciseCard.module.css';
import { TemplateExerciseHeader } from './TemplateExerciseHeader';
import { TemplateSetColumnHeader } from './TemplateSetColumnHeader';
import { TemplateSetRow } from './TemplateSetRow';

/** One exercise of the template being edited: its name and menu, column titles, set rows and "Add set". */
export function TemplateExerciseCard({
  exercise,
  equipment,
  isTimed,
  name,
  index,
  count,
  isSupersetWithNext,
  editing,
  actions,
}: {
  readonly exercise: TemplateExerciseDraft;
  readonly equipment?: Equipment | null;
  readonly isTimed: boolean;
  readonly name: string;
  readonly index: number;
  readonly count: number;
  readonly isSupersetWithNext: boolean;
  /** The target the pad is typing into, if it is in this exercise. */
  readonly editing: { readonly cell: TargetCell; readonly text: string } | undefined;
  readonly actions: TemplateEditorActions;
}) {
  const [showMachine, setShowMachine] = useState(false);
  const isInSuperset = exercise.supersetGroup !== null;
  return (
    <section className={styles.card} data-superset={isInSuperset} aria-label={name}>
      <TemplateExerciseHeader
        name={name}
        index={index}
        count={count}
        isInSuperset={isInSuperset}
        isSupersetWithNext={isSupersetWithNext}
        actions={actions}
      />
      {usesMachineBrand(equipment ?? null) && (
        <div className={styles.progression}>
          <button type="button" onClick={() => setShowMachine(true)}>
            Machine: {exercise.machineBrand ?? 'None'}
          </button>
        </div>
      )}
      {showMachine && (
        <MachineBrandSheet
          value={exercise.machineBrand ?? null}
          onClose={() => setShowMachine(false)}
          onSave={(brand) => {
            actions.setMachineBrand(index, brand);
            setShowMachine(false);
          }}
        />
      )}
      {!isTimed && <ProgressionControl exercise={exercise} index={index} actions={actions} />}
      <TemplateSetColumnHeader isTimed={isTimed} />
      {exercise.sets.map((set, setIndex) => (
        <TemplateSetRow
          // A set has no id of its own; its position is its identity, and the editor changes positions only by re-rendering the whole card.
          key={setIndex}
          exerciseIndex={index}
          setIndex={setIndex}
          set={set}
          isTimed={isTimed}
          canRemove={exercise.sets.length > 1}
          editing={editing?.cell.setIndex === setIndex ? { field: editing.cell.field, text: editing.text } : undefined}
          actions={actions}
        />
      ))}
      <button type="button" className={styles.addSet} onClick={() => actions.addSet(index)}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        <span>Add set</span>
      </button>
    </section>
  );
}
