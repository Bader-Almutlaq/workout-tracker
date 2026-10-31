import { Navigate, useParams } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { PlanPage } from './PlanPage';

/** Resolves plan deep links; unknown/deleted plans replace the route with the Workout tab. */
export function PlanScreen() {
  const { folderId } = useParams();
  const list = useDatabaseQuery('template-list', () => database.templateList());
  if (list.status !== 'ready')
    return (
      <Screen title="Plan" leading={<BackLink to="/" label="Workout" />}>
        <EmptyState message={list.status === 'failed' ? list.message : 'Loading…'} />
      </Screen>
    );
  const folder = list.value.folders.find((candidate) => String(candidate.id) === folderId);
  if (folder === undefined) return <Navigate to="/" replace />;
  return <PlanPage key={folder.id} folder={folder} list={list.value} />;
}
