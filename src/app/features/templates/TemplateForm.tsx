import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import { isTimedExercise } from './isTimedExercise';
import { Plus } from 'lucide-react';
import { Button } from '../../design/components/Button';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { NumberPad } from '../workout/NumberPad';
import type { FolderChoice } from './FolderChoice';
import { targetPadTitle } from './targetPadText';
import { TemplateDetailsSection } from './TemplateDetailsSection';
import type { TemplateEditorModel } from './TemplateEditorModel';
import { TemplateExerciseList } from './TemplateExerciseList';

/**
 * The template editor's form: details, the exercise cards, "Add exercise", Save, and the number pad
 * while a target is typed. The store's own message appears above Save when the template isn't acceptable.
 */
export function TemplateForm({
  model,
  names,
  folders,
  tracking,
}: {
  readonly model: TemplateEditorModel;
  readonly names: ReadonlyMap<number, string>;
  readonly folders: readonly FolderChoice[];
  readonly tracking: ReadonlyMap<number, ExerciseTracking>;
}) {
  const { pad } = model;
  return (
    <>
      <TemplateDetailsSection model={model} folders={folders} />
      <TemplateExerciseList model={model} names={names} tracking={tracking} />
      <Button onPress={model.startPicking}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        Add exercise
      </Button>
      {model.error !== undefined && <ErrorBanner message={model.error} onDismiss={model.dismissError} />}
      <Button variant="primary" isDisabled={model.isSaving} onPress={model.save}>
        Save workout
      </Button>
      {pad.editing !== undefined && (
        <NumberPad
          title={targetPadTitle(
            pad.editing.cell.field,
            isTimedExercise(tracking.get(model.draft.exercises[pad.editing.cell.exerciseIndex]?.exerciseId ?? -1)),
          )}
          allowsDecimal={pad.editing.cell.field === 'rpe'}
          unit={undefined}
          errorMessage={undefined}
          onDismissError={() => undefined}
          onKey={pad.press}
          onStep={pad.step}
          onNext={pad.next}
          onDone={pad.close}
          onUnitChange={() => undefined}
        />
      )}
    </>
  );
}
