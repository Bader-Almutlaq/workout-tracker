import { database, useDatabaseQuery } from '../../data/database';
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
  const active = useDatabaseQuery('active-plan', () => database.activePlanId());
  const activeId = active.status === 'ready' ? active.value : null;
  const folders = [...list.folders].sort((a, b) => Number(b.id === activeId) - Number(a.id === activeId));
  if (list.folders.length === 0 && list.unfiled.length === 0)
    return <EmptyState message="No plans or workouts yet. Create one, or save a finished session as a workout." />;
  return (
    <div className={styles.stack}>
      {list.folders.length > 0 && <h2 className={styles.heading}>Plans</h2>}
      {folders.map((folder) => (
        <PlanCard
          key={folder.id}
          folder={folder}
          index={list.folders.findIndex((item) => item.id === folder.id)}
          isActive={folder.id === activeId}
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
