import { useState } from 'react';
import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { TemplateDialogs } from './TemplateDialogs';
import type { TemplateDialogState } from './templateDialogState';
import { TemplateGroups } from './TemplateGroups';
import type { TemplateListActions } from './TemplateListActions';
import { TemplateSectionActions } from './TemplateSectionActions';
import { duplicateTemplate, moveFolder } from './templateActions';

/**
 * The templates on the Workout tab: folders and templates, then New template and New folder.
 * Tapping a template opens a preview with Start and Edit; `onStart` begins a workout from it.
 */
export function TemplatesSection({
  isBusy,
  onStart,
}: {
  readonly isBusy: boolean;
  readonly onStart: (templateId: number) => void;
}) {
  const list = useDatabaseQuery('template-list', () => database.templateList());
  const [dialog, setDialog] = useState<TemplateDialogState | undefined>(undefined);

  if (list.status === 'loading') return null;
  if (list.status === 'failed') return <EmptyState message={list.message} />;

  const actions: TemplateListActions = {
    preview: (template) => setDialog({ kind: 'preview', templateId: template.id }),
    duplicate: (template) => duplicateTemplate(template.id),
    requestMove: (template) => setDialog({ kind: 'moveTemplate', template }),
    requestDelete: (template) => setDialog({ kind: 'deleteTemplate', template }),
    renameFolder: (folder) => setDialog({ kind: 'renameFolder', folder }),
    moveFolder: (folder, direction) => {
      const index = list.value.folders.findIndex((candidate) => candidate.id === folder.id);
      moveFolder(folder.id, index + direction);
    },
    requestFolderDelete: (folder) => setDialog({ kind: 'deleteFolder', folder }),
  };

  return (
    <>
      <TemplateGroups list={list.value} now={new Date()} actions={actions} />
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
