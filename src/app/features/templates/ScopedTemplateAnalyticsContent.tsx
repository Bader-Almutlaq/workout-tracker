import { useState } from 'react';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import type { MuscleDashboardItem } from '../../../core/queries/MuscleDashboard';
import { BottomSheet } from '../../design/components/BottomSheet';
import { MuscleDashboardTable } from '../analytics/MuscleDashboardTable';
import { EffortAndReps } from '../analytics/EffortAndReps';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { Chip } from '../../design/components/Chip';
import { EmptyState } from '../../design/components/EmptyState';
import { WeeklyCharts } from '../analytics/WeeklyCharts';
import { PlanMuscleAnalytics } from './PlanMuscleAnalytics';
import { SessionEffortChart } from './SessionEffortChart';
import { TemplateAnalyticsTiles } from './TemplateAnalyticsTiles';
import { WorkoutProgressCards } from './WorkoutProgressCards';
import { TemplateProgressRows } from './TemplateProgressRows';
import { weekdayText } from './weekday';

type Report = ReturnType<typeof TemplateAnalytics>;
/** Renders the scoped analytics in the agreed workout or plan order. */
export function ScopedTemplateAnalyticsContent({ report, plan }: { readonly report: Report; readonly plan: boolean }) {
  const [selected, setSelected] = useState<MuscleDashboardItem | null>(null);
  if (report.sessionCount === 0) return <EmptyState message="No sessions yet. Start a workout to see trends." />;
  return (
    <>
      <TemplateAnalyticsTiles report={report} plan={plan} />
      {plan ? (
        <>
          <PlanMuscleAnalytics report={report} />
          <MuscleDashboardTable
            muscles={report.muscleDashboard.filter((item) => item.setsPerWeek > 0)}
            period="4W"
            onSelect={setSelected}
          />
          {selected && (
            <BottomSheet title={MUSCLE_DISPLAY_NAMES[selected.muscle]} onClose={() => setSelected(null)}>
              {selected.shares.map((share) => (
                <p key={share.exerciseId}>
                  {share.name}: {share.sets.toFixed(1)} sets
                </p>
              ))}
              <button type="button" onClick={() => setSelected(null)}>
                Close
              </button>
            </BottomSheet>
          )}
          <WeeklyCharts points={report.weekly} completeHistory />
          {report.intensityMix && <EffortAndReps mix={report.intensityMix} effort={report.weekly} showWeekly={false} />}
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
              <WorkoutProgressCards key={group.id} exercises={group.exercises} />
            ))}
          </section>
          <SessionEffortChart sessions={report.perSession} effort={false} />
          <SessionEffortChart sessions={report.perSession} effort />
        </>
      )}
    </>
  );
}
