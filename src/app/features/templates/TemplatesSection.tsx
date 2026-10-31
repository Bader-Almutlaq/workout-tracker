import { useState } from 'react';
import { database, useDatabaseQuery } from '../../data/database';
import { useWorkoutDrag } from '../../design/drag/WorkoutDrag';
import { EmptyState } from '../../design/components/EmptyState';
import { TemplateDialogs } from './TemplateDialogs';
import type { TemplateDialogState } from './templateDialogState';
import { TemplateGroups } from './TemplateGroups';
import { TemplateSectionActions } from './TemplateSectionActions';
import { makeTemplateListActions } from './makeTemplateListActions';

/**
 * Plan cards and other workouts on the Workout tab, with creation and management dialogs.
 * Tapping a template opens a preview with Start and Edit; `onStart` begins a workout from it.
 */
export function TemplatesSection({
  isBusy,
  onStart,
}: {
  readonly isBusy: boolean;
  readonly onStart: (templateId: number) => void;
}) {
  const drag = useWorkoutDrag();
  const list = useDatabaseQuery('template-list', () => database.templateList());
  const [dialog, setDialog] = useState<TemplateDialogState | undefined>(undefined);

  if (list.status === 'loading') return <EmptyState message="Loading plans and workouts…" />;
  if (list.status === 'failed') return <EmptyState message={list.message} />;

  const actions = makeTemplateListActions(list.value, setDialog);

  return (
    <>
      <TemplateGroups list={list.value} now={new Date()} actions={actions} />
      {drag?.message && <p role="status">{drag.message}</p>}
      <TemplateSectionActions onNewFolder={() => setDialog({ kind: 'newFolder' })} />
      <TemplateDialogs
        dialog={dialog}
        list={list.value}
        isBusy={isBusy}
        onStart={onStart}
        onClose={() => setDialog(undefined)}
      />
    </>
  );
}
