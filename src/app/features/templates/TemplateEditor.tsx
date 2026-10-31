import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import type { TemplateDraft } from '../../../core/templates/TemplateDraft';
import { BackLink } from '../../design/components/BackLink';
import { Screen } from '../../design/components/Screen';
import { exerciseNamesById } from './exerciseNames';
import type { FolderChoice } from './FolderChoice';
import { TemplateExercisePicker } from './TemplateExercisePicker';
import { TemplateForm } from './TemplateForm';
import { useTemplateEditor } from './useTemplateEditor';
import { useTemplateTracking } from './useTemplateTracking';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { EmptyState } from '../../design/components/EmptyState';
import { useDiscardNavigation } from './useDiscardNavigation';

/**
 * Creates or edits a template from `initial`. The draft stays here until Save; "Add exercise" swaps
 * the form for the exercise picker and back, so nothing typed is lost.
 */
export function TemplateEditor({
  initial,
  entries,
  folders,
  returnPlanId,
}: {
  readonly initial: TemplateDraft;
  readonly returnPlanId: number | null;
  readonly entries: readonly ExerciseSearchEntry[];
  readonly folders: readonly FolderChoice[];
}) {
  const model = useTemplateEditor(initial, returnPlanId);
  const tracking = useTemplateTracking(model.draft.exercises);
  const navigation = useDiscardNavigation(initial, model.draft);
  const dialog = navigation.pending ? (
    <ConfirmDialog
      title="Discard changes?"
      confirmLabel="Discard"
      cancelLabel="Keep editing"
      onConfirm={navigation.discard}
      onCancel={navigation.keepEditing}
    />
  ) : null;
  if (model.isPicking)
    return (
      <>
        <TemplateExercisePicker model={model} entries={entries} />
        {dialog}
      </>
    );
  return (
    <Screen
      title={initial.id === undefined ? 'New workout' : 'Edit workout'}
      leading={<BackLink to="/" label="Workout" />}
    >
      {tracking.status === 'failed' ? (
        <EmptyState message={tracking.message} />
      ) : (
        <TemplateForm
          model={model}
          names={exerciseNamesById(entries)}
          equipment={new Map(entries.map((entry) => [entry.id, entry.equipment]))}
          folders={folders}
          tracking={tracking.status === 'ready' ? tracking.value : new Map()}
        />
      )}
      {dialog}
    </Screen>
  );
}
