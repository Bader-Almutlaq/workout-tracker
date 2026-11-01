import { weekdayText } from '../templates/weekday';
import { useState } from 'react';
import type { ExerciseProgressReport, ExerciseProgressSession } from '../../../core/queries/ExerciseProgress';
import type { TimeAggregation } from '../../../core/analytics/TimeBuckets';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { ToggleChip } from '../../design/components/ToggleChip';
import { rpeNumberText } from '../../format/setText';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';
import { displayValue } from '../../../core/units/Weight';
import { ExerciseProgressTiles } from './ExerciseProgressTiles';
import { ExerciseProgressChart, type ProgressChartPoint } from './ExerciseProgressChart';
import styles from './ExerciseProgress.module.css';

/** Owner's comparison limit: current workout plus two others, ANALYTICS.md level 1. */
const policy = Object.freeze({ maximumComparisons: 2 });

function points(
  sessions: readonly ExerciseProgressSession[],
  valueOf: (session: ExerciseProgressSession) => number | null,
): ProgressChartPoint[] {
  return sessions.map((session) => ({ date: session.date, value: valueOf(session), session }));
}

/** Shared Progress summaries and single-measure session charts; compare data is loaded only for selected workouts. */
export function ExerciseProgressContent({
  report,
  exerciseId,
  templateId,
  machine,
  unit,
  bodyweight,
}: {
  readonly report: ExerciseProgressReport;
  readonly exerciseId: number;
  readonly templateId?: number;
  readonly machine?: string | null;
  readonly unit: WeightUnit;
  readonly bodyweight: boolean;
}) {
  const [compared, setCompared] = useState<readonly number[]>([]);
  const comparisons = useDatabaseQuery(
    `exercise-comparisons-${exerciseId}-${templateId}-${machine}-${compared.join(',')}`,
    () =>
      Promise.all(
        compared.map(async (id) => ({ id, report: await database.exerciseProgress(exerciseId, id, machine) })),
      ),
  );
  const name = templateId === undefined ? 'All workouts' : 'This workout';
  const estimate = (session: ExerciseProgressSession) =>
    session.bestEstimatedOneRepMax === null ? null : displayValue(session.bestEstimatedOneRepMax, unit);
  const strengthSeries = [
    { name, points: points(report.sessions, estimate) },
    ...(comparisons.status === 'ready'
      ? comparisons.value
          .filter((item) => compared.includes(item.id))
          .map((item) => ({
            name: report.otherWorkouts.find((workout) => workout.id === item.id)?.name ?? 'Workout',
            points: points(item.report.sessions, estimate),
          }))
      : []),
  ];
  const metrics = [
    {
      title: 'Top set weight',
      aggregation: 'max',
      value: (session: ExerciseProgressSession) =>
        session.topSet === null ? null : displayValue(session.topSet.weightKilograms, unit),
      format: (value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${unit}`,
      unit,
      kind: 'line',
      trend: true,
    },
    {
      title: 'Reps on the top set',
      aggregation: 'max',
      value: (session: ExerciseProgressSession) => session.topSet?.reps ?? null,
      format: (value: number) => `${value} reps`,
      unit: 'reps',
      kind: 'line',
      trend: true,
    },
    {
      title: 'Working sets',
      aggregation: 'sum',
      value: (session: ExerciseProgressSession) => session.workingSetCount,
      format: (value: number) => `${value} sets`,
      unit: 'sets',
      kind: 'bars',
      trend: false,
    },
    {
      title: 'Average RPE',
      aggregation: 'mean',
      value: (session: ExerciseProgressSession) => session.averageRpe,
      format: (value: number) => `${rpeNumberText(value)} RPE`,
      unit: 'RPE',
      kind: 'line',
      trend: false,
    },
  ] satisfies readonly {
    title: string;
    aggregation: TimeAggregation;
    value: (session: ExerciseProgressSession) => number | null;
    format: (value: number) => string;
    unit: string;
    kind: 'line' | 'bars';
    trend: boolean;
  }[];
  return (
    <div className={styles.stack}>
      <ExerciseProgressTiles report={report} unit={unit} bodyweight={bodyweight} />
      <ExerciseProgressChart
        title="Estimated 1RM"
        trend
        series={strengthSeries}
        unit={unit}
        formatValue={(value) => `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${unit}`}
      />
      {templateId !== undefined && report.otherWorkouts.length > 0 && (
        <div className={styles.filters} aria-label="Compare days">
          <span>Compare days</span>
          {report.otherWorkouts.map((workout) => (
            <ToggleChip
              key={workout.id}
              isOn={compared.includes(workout.id)}
              onToggle={() =>
                setCompared((current) =>
                  current.includes(workout.id)
                    ? current.filter((id) => id !== workout.id)
                    : current.length < policy.maximumComparisons
                      ? [...current, workout.id]
                      : current,
                )
              }
            >
              {workout.name}
              {workout.weekday === null ? '' : ` · ${weekdayText(workout.weekday)}`}
            </ToggleChip>
          ))}
          <p className={styles.note}>Choose up to two other workouts.</p>
        </div>
      )}
      {compared.length > 0 && comparisons.status !== 'ready' && <ExerciseQueryMessage query={comparisons} />}
      {metrics.map((metric) => (
        <ExerciseProgressChart
          key={metric.title}
          title={metric.title}
          series={[{ name, points: points(report.sessions, metric.value) }]}
          formatValue={metric.format}
          unit={metric.unit}
          kind={metric.kind}
          trend={metric.trend}
          aggregation={metric.aggregation}
        />
      ))}
    </div>
  );
}
