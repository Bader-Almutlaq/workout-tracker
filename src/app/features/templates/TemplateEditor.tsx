import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import type { TemplateDraft } from '../../../core/templates/TemplateDraft';
import { BackLink } from '../../design/components/BackLink';
import { Screen } from '../../design/components/Screen';
import { exerciseNamesById } from './exerciseNames';
import type { FolderChoice } from './FolderChoice';
import { TemplateExercisePicker } from './TemplateExercisePicker';
import { TemplateForm } from './TemplateForm';
import { useTemplateEditor } from './useTemplateEditor';

/**
 * Creates or edits a template from `initial`. The draft stays here until Save; "Add exercise" swaps
 * the form for the exercise picker and back, so nothing typed is lost.
 */
export function TemplateEditor({
  initial,
  entries,
  folders,
}: {
  readonly initial: TemplateDraft;
  readonly entries: readonly ExerciseSearchEntry[];
  readonly folders: readonly FolderChoice[];
}) {
  const model = useTemplateEditor(initial);
  if (model.isPicking) return <TemplateExercisePicker model={model} entries={entries} />;
  return (
    <Screen
      title={initial.id === undefined ? 'New template' : 'Edit template'}
      leading={<BackLink to="/" label="Workout" />}
    >
      <TemplateForm model={model} names={exerciseNamesById(entries)} folders={folders} />
    </Screen>
  );
}
