import type { TemplateList } from '../../../core/queries/TemplateCatalog';
import { EmptyState } from '../../design/components/EmptyState';
import { PlanCard } from './PlanCard';
import { TemplateGroup } from './TemplateGroup';
import type { TemplateListActions } from './TemplateListActions';
import styles from './PlanPage.module.css';

/** Ordered plan navigation cards followed by workouts outside any plan. */
export function TemplateGroups({
  list,
  now,
  actions,
}: {
  readonly list: TemplateList;
  readonly now: Date;
  readonly actions: TemplateListActions;
}) {
  if (list.folders.length === 0 && list.unfiled.length === 0)
    return <EmptyState message="No plans or workouts yet. Create one, or save a finished session as a workout." />;
  return (
    <div className={styles.stack}>
      {list.folders.length > 0 && <h2 className={styles.heading}>Plans</h2>}
      {list.folders.map((folder, index) => (
        <PlanCard
          key={folder.id}
          folder={folder}
          index={index}
          count={list.folders.length}
          now={now}
          actions={actions}
        />
      ))}
      {list.unfiled.length > 0 && (
        <TemplateGroup label="Other workouts" templates={list.unfiled} now={now} actions={actions} />
      )}
    </div>
  );
}
