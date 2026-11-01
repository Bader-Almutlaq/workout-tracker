import { weekdayText } from '../templates/weekday';
import { useState } from 'react';
import type { ExerciseProgressReport, ExerciseProgressSession } from '../../../core/queries/ExerciseProgress';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database, useDatabaseQuery } from '../../data/database';
import { ToggleChip } from '../../design/components/ToggleChip';
import { weightText } from '../../format/weightText';
import { rpeNumberText } from '../../format/setText';
import { ExerciseQueryMessage } from './ExerciseQueryMessage';
import { progressChangeText } from './progressText';
import { ExerciseProgressTiles } from './ExerciseProgressTiles';
import { ExerciseProgressChart, type ProgressChartPoint } from './ExerciseProgressChart';
import styles from './ExerciseProgress.module.css';

/** Owner's comparison limit: current workout plus two others, ANALYTICS.md level 1. */
const policy = Object.freeze({ maximumComparisons: 2 });

function points(
  sessions: readonly ExerciseProgressSession[],
  valueOf: (session: ExerciseProgressSession) => number | null,
): ProgressChartPoint[] {
  return sessions.flatMap((session) => {
    const value = valueOf(session);
    return value === null ? [] : [{ date: session.date, value, session }];
  });
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
  const estimate = (session: ExerciseProgressSession) => session.bestEstimatedOneRepMax;
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
  const normal = report.sessions.filter((session) => !session.isDeload);
  const last = normal.at(-1);
  const changes = report.changes?.workingSetCount;
  const metrics = [
    {
      title: 'Top-set weight',
      value: (session: ExerciseProgressSession) => (session.topSet === null ? null : session.topSet.weightKilograms),
      format: (value: number) => weightText(value, unit),
      takeaway:
        last?.topSet === null || last?.topSet === undefined
          ? 'No top set yet'
          : `Latest non-deload: ${weightText(last.topSet.weightKilograms, unit)}`,
    },
    {
      title: 'Reps on the top set',
      value: (session: ExerciseProgressSession) => session.topSet?.reps ?? null,
      format: (value: number) => `${value} reps`,
      takeaway:
        last?.topSet === null || last?.topSet === undefined
          ? 'No top set yet'
          : `Latest non-deload: ${last.topSet.reps} reps`,
    },
    {
      title: 'Working sets',
      value: (session: ExerciseProgressSession) => session.workingSetCount,
      format: (value: number) => `${value} sets`,
      takeaway:
        changes === undefined
          ? `Latest non-deload: ${last?.workingSetCount ?? '—'} sets`
          : `${changes.before} → ${changes.after} sets vs 4 sessions ago`,
    },
    {
      title: 'Average RPE',
      value: (session: ExerciseProgressSession) => session.averageRpe,
      format: (value: number) => `RPE ${rpeNumberText(value)}`,
      takeaway:
        last?.averageRpe === null || last?.averageRpe === undefined
          ? 'No logged effort in the latest non-deload session'
          : `Latest non-deload: RPE ${rpeNumberText(last.averageRpe)}`,
    },
  ];
  return (
    <div className={styles.stack}>
      <ExerciseProgressTiles report={report} unit={unit} bodyweight={bodyweight} />
      <ExerciseProgressChart
        title="Best-set e1RM"
        takeaway={progressChangeText(report.changes?.estimatedOneRepMaxPercent ?? null)}
        series={strengthSeries}
        unit={unit}
        bodyweight={bodyweight}
        formatValue={(value) => weightText(value, unit)}
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
          takeaway={metric.takeaway}
          series={[{ name, points: points(report.sessions, metric.value) }]}
          formatValue={metric.format}
          unit={unit}
          bodyweight={bodyweight}
        />
      ))}
    </div>
  );
}
