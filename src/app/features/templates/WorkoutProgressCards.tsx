import { Link } from 'react-router';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { LiftSparkline } from '../analytics/LiftSparkline';
import { workoutExercisePath } from './templatePaths';
import styles from './TemplateAnalytics.module.css';

type Exercise = ReturnType<typeof TemplateAnalytics>['exercises'][number]['exercises'][number];

/** Compact per-exercise session trends, including deload marks. */
export function WorkoutProgressCards({ exercises }: { readonly exercises: readonly Exercise[] }) {
  return (
    <div className={styles.cards}>
      {exercises.map((exercise, index) => {
        const latest = exercise.sessions.at(-1);
        // Heuristic: high-rep lifts often fall outside the estimate's limits; use top-set weight unless every non-deload session has one.
        const fallback = exercise.sessions.some(
          (session) => !session.isDeload && session.bestEstimatedOneRepMax === null,
        );
        const change = exercise.changes?.estimatedOneRepMaxPercent ?? null;
        const topChange = exercise.changes?.topSet;
        const delta =
          topChange?.before && topChange.after
            ? topChange.after.weightKilograms - topChange.before.weightKilograms
            : null;
        const comparison = fallback ? delta : change;
        const measures = [
          {
            label: fallback ? 'Top set' : 'Est. 1RM',
            value: fallback ? latest?.topSet?.weightKilograms : latest?.bestEstimatedOneRepMax,
            unit: ' kg',
            bars: false,
            read: (session: Exercise['sessions'][number]) =>
              fallback ? session.topSet?.weightKilograms : session.bestEstimatedOneRepMax,
          },
          {
            label: 'Sets',
            value: latest?.workingSetCount,
            unit: '',
            bars: true,
            read: (session: Exercise['sessions'][number]) => session.workingSetCount,
          },
          {
            label: 'RPE',
            value: latest?.averageRpe,
            unit: '',
            bars: false,
            read: (session: Exercise['sessions'][number]) => session.averageRpe,
          },
        ];
        return (
          <article className={styles.card} key={`${exercise.exerciseId}-${index}`}>
            <div className={styles.cardHeader}>
              <Link to={workoutExercisePath(exercise.templateId, exercise.exerciseId)}>{exercise.name}</Link>
              <span
                className={
                  comparison === null
                    ? styles.neutral
                    : comparison > 0
                      ? styles.good
                      : comparison < 0
                        ? styles.bad
                        : styles.neutral
                }
              >
                {comparison === null
                  ? '—'
                  : `${comparison > 0 ? '+' : ''}${comparison.toFixed(1)}${fallback ? ' kg' : '%'}`}
              </span>
            </div>
            <div className={styles.trends}>
              {measures.map((measure) => (
                <div key={measure.label}>
                  <small>{measure.label}</small>
                  <LiftSparkline
                    bars={measure.bars}
                    points={exercise.sessions.map((session) => ({
                      value: measure.read(session) ?? null,
                      deload: session.isDeload,
                    }))}
                  />
                  <span>
                    {measure.value === null || measure.value === undefined
                      ? '—'
                      : `${Number(measure.value.toFixed(1))}${measure.unit}`}
                  </span>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
