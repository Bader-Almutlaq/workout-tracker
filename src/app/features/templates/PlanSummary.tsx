import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { TemplateMuscleList } from './TemplateMuscleList';
import styles from './PlanPage.module.css';

/** Saved planned sets and workouts for a plan interpreted as one week. */
export function PlanSummary({ folderId }: { readonly folderId: number }) {
  const query = useDatabaseQuery(`plan-summary-${folderId}`, () => database.templateMuscleSummary({ folderId }));
  if (query.status !== 'ready') return <EmptyState message={query.status === 'failed' ? query.message : 'Loading…'} />;
  return (
    <div className={styles.stack}>
      <div className={styles.tiles}>
        <div>
          <strong>{query.value.sets}</strong>
          <span>sets per week</span>
        </div>
        <div>
          <strong>{query.value.workouts}</strong>
          <span>workouts</span>
        </div>
      </div>
      <TemplateMuscleList summary={query.value} weekly />
    </div>
  );
}
