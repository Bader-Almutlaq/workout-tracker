import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { ScopedTemplateAnalytics } from './ScopedTemplateAnalytics';
import { TemplateSessionHistory } from './TemplateSessionHistory';

/** Loads one plan's scoped history or trends, surfacing loading and query failures inline. */
export function PlanSessions({
  folderId,
  section,
}: {
  readonly folderId: number;
  readonly section: 'history' | 'analytics';
}) {
  const report = useDatabaseQuery(`plan-sessions-${folderId}`, () => database.templateSessions({ folderId }));
  if (report.status !== 'ready')
    return <EmptyState message={report.status === 'failed' ? report.message : 'Loading…'} />;
  if (section === 'history') return <TemplateSessionHistory sessions={report.value.sessions} />;
  return <ScopedTemplateAnalytics id={folderId} plan />;
}
