import { Link } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';

/** Active plan and elapsed week, linked to its analytics. */
export function ActivePlanRow() {
  const query = useDatabaseQuery('analytics-active-plan', async () => {
    const [id, list] = await Promise.all([database.activePlanId(), database.templateList()]);
    if (id === null) return null;
    const folder = list.folders.find((item) => item.id === id);
    if (folder === undefined) return null;
    const report = await database.templateSessions({ folderId: id });
    const first = report.sessions.at(-1)?.startedAt;
    return { folder, first, now: Date.now() };
  });
  if (query.status !== 'ready' || query.value === null) return null;
  const first = query.value.first;
  const week =
    first === undefined
      ? null
      : Math.max(1, Math.floor((query.value.now - new Date(first).getTime()) / (7 * 86400000)) + 1);
  return (
    <p>
      <Link to={`/workout/plans/${query.value.folder.id}?tab=analytics`}>
        {query.value.folder.name}
        {week === null ? '' : ` · week ${week}`} · Plan analytics ›
      </Link>
    </p>
  );
}
