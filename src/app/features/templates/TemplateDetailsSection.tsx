import { WEEKDAYS } from './weekday';
import styles from './TemplateMuscleList.module.css';
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
    <Section label="Workout">
      <TextField label="Name" value={model.draft.name} onChange={model.setName} />
      <SelectField
        label="Plan"
        noneLabel="No plan"
        options={folderOptions(folders)}
        value={folderValueOf(model.draft.folderId)}
        onChange={(value) => model.setFolder(folderIdOf(value))}
      />
      <div className={styles.days} aria-label="Workout day">
        {WEEKDAYS.map((day, index) => (
          <button
            type="button"
            key={day}
            aria-pressed={model.draft.weekday === index + 1}
            onClick={() => model.setWeekday(model.draft.weekday === index + 1 ? null : index + 1)}
          >
            {day}
          </button>
        ))}
      </div>
      <TextField label="Description" value={model.draft.notes ?? ''} onChange={model.setNotes} />
    </Section>
  );
}
