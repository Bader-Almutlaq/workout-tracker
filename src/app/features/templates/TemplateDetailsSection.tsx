import { Section } from '../../design/components/Section';
import { SelectField } from '../../design/components/SelectField';
import { TextField } from '../../design/components/TextField';
import { folderIdOf, folderOptions, folderValueOf, type FolderChoice } from './FolderChoice';
import type { TemplateEditorModel } from './TemplateEditorModel';

/** The name, folder and notes of the template being edited. */
export function TemplateDetailsSection({
  model,
  folders,
}: {
  readonly model: TemplateEditorModel;
  readonly folders: readonly FolderChoice[];
}) {
  return (
    <Section label="Template">
      <TextField label="Name" value={model.draft.name} onChange={model.setName} />
      <SelectField
        label="Folder"
        noneLabel="No folder"
        options={folderOptions(folders)}
        value={folderValueOf(model.draft.folderId)}
        onChange={(value) => model.setFolder(folderIdOf(value))}
      />
      <TextField label="Notes" value={model.draft.notes ?? ''} onChange={model.setNotes} />
    </Section>
  );
}
