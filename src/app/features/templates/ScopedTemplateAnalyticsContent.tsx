import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { Chip } from '../../design/components/Chip';
import { EmptyState } from '../../design/components/EmptyState';
import { WeeklyCharts } from '../analytics/WeeklyCharts';
import { PlanMuscleAnalytics } from './PlanMuscleAnalytics';
import { SessionEffortChart } from './SessionEffortChart';
import { TemplateAnalyticsTiles } from './TemplateAnalyticsTiles';
import { TemplateProgressRows } from './TemplateProgressRows';
import { weekdayText } from './weekday';

type Report = ReturnType<typeof TemplateAnalytics>;
/** Renders the scoped analytics in the agreed workout or plan order. */
export function ScopedTemplateAnalyticsContent({ report, plan }: { readonly report: Report; readonly plan: boolean }) {
  if (report.sessionCount === 0) return <EmptyState message="No sessions yet. Start a workout to see trends." />;
  return (
    <>
      <TemplateAnalyticsTiles report={report} plan={plan} />
      {plan ? (
        <>
          <PlanMuscleAnalytics report={report} />
          <WeeklyCharts points={report.weekly} />
          <section>
            <h2>Progress by workout</h2>
            {report.exercises.map((group) => (
              <div key={group.id}>
                <h3>
                  {group.name} {group.weekday !== null && <Chip tone="neutral">{weekdayText(group.weekday)}</Chip>}
                </h3>
                <TemplateProgressRows exercises={group.exercises} />
              </div>
            ))}
          </section>
        </>
      ) : (
        <>
          <section>
            <h2>Exercise progress</h2>
            {report.exercises.map((group) => (
              <TemplateProgressRows key={group.id} exercises={group.exercises} />
            ))}
          </section>
          <SessionEffortChart sessions={report.perSession} effort={false} />
          <SessionEffortChart sessions={report.perSession} effort />
        </>
      )}
    </>
  );
}
