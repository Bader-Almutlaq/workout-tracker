import { useState } from 'react';
import { ErrorBanner } from '../../design/components/ErrorBanner';
import { log } from '../../../core/support/log';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { Star, ArrowDown, ArrowUp, Ellipsis, Pencil, Trash2 } from 'lucide-react';
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
  const [error, setError] = useState<string | undefined>();
  const active = useDatabaseQuery('active-plan', () => database.activePlanId());
  const isActive = active.status === 'ready' && active.value === folder.id;
  return (
    <>
      {active.status === 'failed' && <ErrorBanner message={active.message} onDismiss={() => undefined} />}
      {error !== undefined && <ErrorBanner message={error} onDismiss={() => setError(undefined)} />}
      <ActionMenu
        label={`Options for plan ${folder.name}`}
        items={[
          {
            label: isActive ? 'Stop using as active plan' : 'Set as active plan',
            icon: Star,
            isDisabled: active.status !== 'ready',
            onSelect: () => {
              void database.setActivePlan(isActive ? null : folder.id).catch((failure: unknown) => {
                log.ui.error('Could not update active plan', failure);
                setError(messageOf(failure));
              });
            },
          },
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
    </>
  );
}
