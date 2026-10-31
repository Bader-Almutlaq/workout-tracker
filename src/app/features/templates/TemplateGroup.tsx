import type { TemplateSummary } from '../../../core/queries/TemplateCatalog';
import styles from './TemplateGroup.module.css';
import type { TemplateListActions } from './TemplateListActions';
import { TemplateRow } from './TemplateRow';

/** A labelled list of workouts outside any plan. */
export function TemplateGroup({
  label,
  templates,
  now,
  actions,
}: {
  readonly label: string;
  readonly templates: readonly TemplateSummary[];
  readonly now: Date;
  readonly actions: TemplateListActions;
}) {
  return (
    <section className={styles.group}>
      <h2 className={styles.label}>{label}</h2>
      <div className={styles.card}>
        {templates.length === 0 && <p className={styles.empty}>No other workouts yet.</p>}
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
