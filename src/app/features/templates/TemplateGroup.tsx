import type { TemplateFolderSummary, TemplateSummary } from '../../../core/queries/TemplateCatalog';
import styles from './TemplateGroup.module.css';
import type { TemplateListActions } from './TemplateListActions';
import { TemplateGroupHeader } from './TemplateGroupHeader';
import { TemplateRow } from './TemplateRow';

/** A labelled card of templates: one folder, or the templates in no folder. */
export function TemplateGroup({
  label,
  folder,
  folderIndex,
  folderCount,
  templates,
  now,
  actions,
}: {
  readonly label: string;
  readonly folder: TemplateFolderSummary | undefined;
  readonly folderIndex: number;
  readonly folderCount: number;
  readonly templates: readonly TemplateSummary[];
  readonly now: Date;
  readonly actions: TemplateListActions;
}) {
  return (
    <section className={styles.group}>
      <TemplateGroupHeader
        label={label}
        folder={folder}
        folderIndex={folderIndex}
        folderCount={folderCount}
        actions={actions}
      />
      <div className={styles.card}>
        {templates.length === 0 && <p className={styles.empty}>No templates in this folder.</p>}
        {templates.map((template, index) => (
          <TemplateRow
            key={template.id}
            template={template}
            index={index}
            count={templates.length}
            now={now}
            actions={actions}
          />
        ))}
      </div>
    </section>
  );
}
