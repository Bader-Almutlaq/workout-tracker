import { useState } from 'react';
import type { TemplateSummary } from '../../../core/queries/TemplateCatalog';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { SelectField } from '../../design/components/SelectField';
import { folderIdOf, folderOptions, folderValueOf, type FolderChoice } from './FolderChoice';

/** Asks which folder a template goes to; "No folder" takes it out of every folder. It lands at the end of that folder. */
export function MoveTemplateDialog({
  template,
  folders,
  onMove,
  onCancel,
}: {
  readonly template: TemplateSummary;
  readonly folders: readonly FolderChoice[];
  readonly onMove: (folderId: number | null) => void;
  readonly onCancel: () => void;
}) {
  const [value, setValue] = useState(folderValueOf(template.folderId));
  return (
    <ConfirmDialog
      title="Move to folder"
      confirmLabel="Move"
      onConfirm={() => onMove(folderIdOf(value))}
      onCancel={onCancel}
    >
      <SelectField
        label="Folder"
        noneLabel="No folder"
        options={folderOptions(folders)}
        value={value}
        onChange={setValue}
      />
    </ConfirmDialog>
  );
}
