import type { TemplateSessionReport } from '../../../core/queries/TemplateSessions';
import { LongRangeChart } from '../../design/charts/LongRangeChart';
import { EmptyState } from '../../design/components/EmptyState';
import { Section } from '../../design/components/Section';
import { volumeText, weightText } from '../../format/weightText';
import { sessionDurationText } from './sessionDurationText';

/** Shared plan/workout trends; aggregation math remains in WorkoutCore's TimeBuckets. */
export function TemplateSessionCharts({
  report,
  isPlan = false,
}: {
  readonly report: TemplateSessionReport;
  readonly isPlan?: boolean;
}) {
  const { sessions, topExercise } = report;
  if (sessions.length === 0) return <EmptyState message="No sessions yet. Start a workout to see trends." />;
  return (
    <>
      {isPlan && (
        <Section label="Sessions per week">
          <LongRangeChart
            title="Sessions per week"
            aggregation="sum"
            overviewBucket="week"
            series={[{ name: 'Sessions', points: sessions.map((session) => ({ date: session.startedAt, value: 1 })) }]}
            formatValue={(value) => `${value} sessions`}
          />
        </Section>
      )}
      <Section label="Session volume">
        <LongRangeChart
          title="Session volume"
          aggregation="mean"
          series={[
            {
              name: 'Volume',
              points: sessions.map((session) => ({ date: session.startedAt, value: session.volumeKilograms })),
            },
          ]}
          formatValue={volumeText}
        />
      </Section>
      <Section label="Session duration">
        <LongRangeChart
          title="Session duration"
          aggregation="mean"
          series={[
            {
              name: 'Duration',
              points: sessions.flatMap((session) =>
                session.durationSeconds === null ? [] : [{ date: session.startedAt, value: session.durationSeconds }],
              ),
            },
          ]}
          formatValue={sessionDurationText}
        />
      </Section>
      {topExercise !== null && (
        <Section label={`${topExercise.name} · best e1RM`}>
          <LongRangeChart
            title={`${topExercise.name} best e1RM`}
            aggregation="max"
            series={[
              {
                name: topExercise.name,
                points: sessions.flatMap((session) =>
                  session.bestEstimatedOneRepMaxKilograms === null
                    ? []
                    : [{ date: session.startedAt, value: session.bestEstimatedOneRepMaxKilograms }],
                ),
              },
            ]}
            formatValue={(value) => weightText(value, 'kg')}
          />
        </Section>
      )}
    </>
  );
}
