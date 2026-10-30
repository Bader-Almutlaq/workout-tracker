import { ArrowDown, ArrowUp, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import type { TemplateFolderSummary } from '../../../core/queries/TemplateCatalog';
import { ActionMenu } from '../../design/components/ActionMenu';
import type { TemplateListActions } from './TemplateListActions';
import styles from './TemplateGroupHeader.module.css';

/** The label above a group of templates. A folder's header also has a "…" menu to rename, move or delete it. */
export function TemplateGroupHeader({
  label,
  folder,
  folderIndex,
  folderCount,
  actions,
}: {
  readonly label: string;
  /** The folder the group is, or `undefined` for the templates in no folder. */
  readonly folder: TemplateFolderSummary | undefined;
  readonly folderIndex: number;
  readonly folderCount: number;
  readonly actions: TemplateListActions;
}) {
  return (
    <div className={styles.header}>
      <h2 className={styles.label}>{label}</h2>
      {folder !== undefined && (
        <div className={styles.menu}>
          <ActionMenu
            label={`Options for folder ${folder.name}`}
            items={[
              { label: 'Rename', icon: Pencil, onSelect: () => actions.renameFolder(folder) },
              {
                label: 'Move up',
                icon: ArrowUp,
                isDisabled: folderIndex === 0,
                onSelect: () => actions.moveFolder(folder, -1),
              },
              {
                label: 'Move down',
                icon: ArrowDown,
                isDisabled: folderIndex === folderCount - 1,
                onSelect: () => actions.moveFolder(folder, 1),
              },
              {
                label: 'Delete folder',
                icon: Trash2,
                isDestructive: true,
                onSelect: () => actions.requestFolderDelete(folder),
              },
            ]}
          >
            <Ellipsis size={20} strokeWidth={2} aria-hidden />
          </ActionMenu>
        </div>
      )}
    </div>
  );
}
