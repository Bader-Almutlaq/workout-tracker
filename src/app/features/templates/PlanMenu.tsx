import { ArrowDown, ArrowUp, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import type { TemplateFolderSummary } from '../../../core/queries/TemplateCatalog';
import { ActionMenu } from '../../design/components/ActionMenu';
import type { TemplateListActions } from './TemplateListActions';

/** A plan's existing rename, reorder and delete actions, usable on its card and page. */
export function PlanMenu({
  folder,
  index,
  count,
  actions,
}: {
  readonly folder: TemplateFolderSummary;
  readonly index: number;
  readonly count: number;
  readonly actions: TemplateListActions;
}) {
  return (
    <ActionMenu
      label={`Options for plan ${folder.name}`}
      items={[
        { label: 'Rename', icon: Pencil, onSelect: () => actions.renameFolder(folder) },
        { label: 'Move up', icon: ArrowUp, isDisabled: index === 0, onSelect: () => actions.moveFolder(folder, -1) },
        {
          label: 'Move down',
          icon: ArrowDown,
          isDisabled: index === count - 1,
          onSelect: () => actions.moveFolder(folder, 1),
        },
        {
          label: 'Delete plan',
          icon: Trash2,
          isDestructive: true,
          onSelect: () => actions.requestFolderDelete(folder),
        },
      ]}
    >
      <Ellipsis size={20} strokeWidth={2} aria-hidden />
    </ActionMenu>
  );
}
