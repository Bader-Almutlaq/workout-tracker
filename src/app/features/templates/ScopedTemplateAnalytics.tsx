import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { ScopedTemplateAnalyticsContent } from './ScopedTemplateAnalyticsContent';

/** Loads analytics for one saved workout or plan and surfaces query errors. */
export function ScopedTemplateAnalytics({ id, plan }: { readonly id: number; readonly plan: boolean }) {
  const result = useDatabaseQuery(`template-analytics-${plan ? 'plan' : 'workout'}-${id}`, () =>
    database.templateAnalytics(plan ? { folderId: id } : { templateId: id }),
  );
  if (result.status !== 'ready')
    return <EmptyState message={result.status === 'failed' ? result.message : 'Loading…'} />;
  return <ScopedTemplateAnalyticsContent report={result.value} plan={plan} />;
}
