import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import { database, useDatabaseQuery } from '../../data/database';

/** Loads the tracking kind of the exercises in a template, including archived exercises. */
export function useTemplateTracking(exercises: readonly TemplateExerciseDraft[]) {
  const ids = [...new Set(exercises.map((exercise) => exercise.exerciseId))].sort((a, b) => a - b);
  return useDatabaseQuery(`template-tracking-${ids.join(',')}`, async () => {
    const details = await Promise.all(ids.map((id) => database.exerciseDetail(id)));
    return new Map(
      details.flatMap((detail) => (detail === null ? [] : [[detail.exercise.id, detail.exercise.tracking] as const])),
    );
  });
}
