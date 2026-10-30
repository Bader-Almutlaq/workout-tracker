import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { BackButton } from '../../design/components/BackButton';
import { Screen } from '../../design/components/Screen';
import { ExercisePicker } from '../workout/ExercisePicker';
import type { TemplateEditorModel } from './TemplateEditorModel';

/** The exercise picker of the Workout tab, shown inside the template editor. "Add" returns to the form with the picks. */
export function TemplateExercisePicker({
  model,
  entries,
}: {
  readonly model: TemplateEditorModel;
  readonly entries: readonly ExerciseSearchEntry[];
}) {
  return (
    <Screen title="Add exercise" leading={<BackButton label="Template" onPress={model.stopPicking} />}>
      <ExercisePicker entries={entries} onAdd={model.addPicked} />
    </Screen>
  );
}
