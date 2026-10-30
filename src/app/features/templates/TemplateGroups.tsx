import type { TemplateList } from '../../../core/queries/TemplateCatalog';
import { EmptyState } from '../../design/components/EmptyState';
import { TemplateGroup } from './TemplateGroup';
import type { TemplateListActions } from './TemplateListActions';

/**
 * The templates in no folder under "Templates", then each folder under its name, in stored order.
 * With nothing at all it says how to get a first template.
 */
export function TemplateGroups({
  list,
  now,
  actions,
}: {
  readonly list: TemplateList;
  readonly now: Date;
  readonly actions: TemplateListActions;
}) {
  const { folders, unfiled } = list;
  if (folders.length === 0 && unfiled.length === 0)
    return <EmptyState message="No templates yet. Create one, or save a finished workout as a template." />;
  return (
    <>
      {unfiled.length > 0 && (
        <TemplateGroup
          label="Templates"
          folder={undefined}
          folderIndex={0}
          folderCount={0}
          templates={unfiled}
          now={now}
          actions={actions}
        />
      )}
      {folders.map((folder, index) => (
        <TemplateGroup
          key={folder.id}
          label={folder.name}
          folder={folder}
          folderIndex={index}
          folderCount={folders.length}
          templates={folder.templates}
          now={now}
          actions={actions}
        />
      ))}
    </>
  );
}
