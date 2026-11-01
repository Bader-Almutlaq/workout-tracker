import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { LiftRow } from '../analytics/LiftRow';
import { workoutExercisePath } from './templatePaths';

type Group = ReturnType<typeof TemplateAnalytics>['exercises'][number];
/** Workout-scoped exercise rows share the dashboard's strength row and sparkline. */
export function TemplateProgressRows({ exercises }: { readonly exercises: Group['exercises'] }) {
  return (
    <div>
      {exercises.map((exercise) => {
        const latest = exercise.sessions.at(-1)?.bestEstimatedOneRepMax ?? null;
        const counts = exercise.changes?.workingSetCount;
        const top = exercise.latestTopSet;
        return (
          <LiftRow
            key={exercise.exerciseId}
            to={workoutExercisePath(exercise.templateId, exercise.exerciseId)}
            name={exercise.name}
            value={latest === null ? '—' : `${latest.toFixed(1)} kg`}
            change={exercise.changes?.estimatedOneRepMaxPercent ?? null}
            points={exercise.sessions.flatMap((session) =>
              session.bestEstimatedOneRepMax === null
                ? []
                : [{ value: session.bestEstimatedOneRepMax, deload: session.isDeload }],
            )}
            detail={
              <>
                <small>
                  {top === null
                    ? 'No top set yet'
                    : `${top.weightKilograms} kg × ${top.reps}${top.rpe === null ? '' : ` @ RPE ${top.rpe}`}`}
                </small>
                {counts && counts.before !== counts.after && (
                  <small>
                    {counts.before} → {counts.after} sets
                  </small>
                )}
              </>
            }
          />
        );
      })}
    </div>
  );
}
