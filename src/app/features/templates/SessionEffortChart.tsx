import { useNavigate } from 'react-router';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { TimeChart } from '../../design/charts/TimeChart';

type Session = ReturnType<typeof TemplateAnalytics>['perSession'][number];

/** Workout session hard-set bars or logged RIR line, with shared zoom, deloads and session navigation. */
export function SessionEffortChart({
  sessions,
  effort,
}: {
  readonly sessions: readonly Session[];
  readonly effort: boolean;
}) {
  const navigate = useNavigate();
  const title = effort ? 'Effort per session' : 'Hard sets per session';
  return (
    <TimeChart
      title={title}
      unit={effort ? 'RIR' : 'sets'}
      kind={effort ? 'line' : 'bars'}
      aggregation={effort ? 'mean' : 'sum'}
      series={[
        {
          name: title,
          points: sessions.map((session) => ({
            date: session.date,
            value: effort ? session.averageRir : session.hardSets,
            deload: session.isDeload,
            sessionId: session.workoutId,
          })),
        },
      ]}
      formatValue={(value) => `${value.toFixed(1)} ${effort ? 'RIR' : 'sets'}`}
      onOpenPoint={(point) => {
        if (point.sessionId !== undefined) void navigate(`/history/${point.sessionId}`);
      }}
    />
  );
}
