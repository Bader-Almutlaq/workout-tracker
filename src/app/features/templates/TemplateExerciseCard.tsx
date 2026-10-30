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
  isTimed,
  name,
  index,
  count,
  isSupersetWithNext,
  editing,
  actions,
}: {
  readonly exercise: TemplateExerciseDraft;
  readonly isTimed: boolean;
  readonly name: string;
  readonly index: number;
  readonly count: number;
  readonly isSupersetWithNext: boolean;
  /** The target the pad is typing into, if it is in this exercise. */
  readonly editing: { readonly cell: TargetCell; readonly text: string } | undefined;
  readonly actions: TemplateEditorActions;
}) {
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
