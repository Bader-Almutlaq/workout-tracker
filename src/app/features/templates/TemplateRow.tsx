import { Copy, Ellipsis, FolderInput, Trash2 } from 'lucide-react';
import type { TemplateSummary } from '../../../core/queries/TemplateCatalog';
import { ActionMenu } from '../../design/components/ActionMenu';
import { lastDoneText } from './lastDoneText';
import type { TemplateListActions } from './TemplateListActions';
import styles from './TemplateRow.module.css';

/**
 * One template in the list: its name, its exercises on one line (cut off with "…" when long) and
 * when it was last started. Tapping it previews it; the "…" menu duplicates, moves or deletes it.
 */
export function TemplateRow({
  template,
  now,
  actions,
}: {
  readonly template: TemplateSummary;
  readonly now: Date;
  readonly actions: TemplateListActions;
}) {
  const lastDone = lastDoneText(template.lastStartedAt, now);
  return (
    <div className={styles.row}>
      <button type="button" className={styles.main} onClick={() => actions.preview(template)}>
        <span className={styles.name}>{template.name}</span>
        <span className={styles.exercises}>{template.exerciseNames.join(', ')}</span>
        {lastDone !== undefined && <span className={styles.lastDone}>{lastDone}</span>}
      </button>
      <div className={styles.menu}>
        <ActionMenu
          label={`Options for ${template.name}`}
          items={[
            { label: 'Duplicate', icon: Copy, onSelect: () => actions.duplicate(template) },
            { label: 'Move to folder', icon: FolderInput, onSelect: () => actions.requestMove(template) },
            { label: 'Delete', icon: Trash2, isDestructive: true, onSelect: () => actions.requestDelete(template) },
          ]}
        >
          <Ellipsis size={20} strokeWidth={2} aria-hidden />
        </ActionMenu>
      </div>
    </div>
  );
}
