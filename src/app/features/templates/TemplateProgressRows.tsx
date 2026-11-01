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
        const fallback = latest === null && top !== null;
        const comparison = exercise.changes?.topSet;
        const before = comparison?.before;
        const after = comparison?.after;
        return (
          <LiftRow
            key={exercise.exerciseId}
            to={workoutExercisePath(exercise.templateId, exercise.exerciseId)}
            name={exercise.name}
            value={latest === null ? (top === null ? '—' : `${top.weightKilograms} kg`) : `${latest.toFixed(1)} kg`}
            change={fallback ? null : (exercise.changes?.estimatedOneRepMaxPercent ?? null)}
            changeText={
              fallback && before && after ? `${before.weightKilograms} → ${after.weightKilograms} kg` : undefined
            }
            points={exercise.sessions.flatMap((session) => {
              const value = fallback ? session.topSet?.weightKilograms : session.bestEstimatedOneRepMax;
              return value === null || value === undefined ? [] : [{ value, deload: session.isDeload }];
            })}
            detail={
              <>
                {fallback && <small>top set</small>}
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
