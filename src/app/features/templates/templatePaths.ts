/** The screen for creating a template. */
export const NEW_TEMPLATE_PATH = '/workout/templates/new';

/** The editor for the template `templateId`. */
export function templatePath(templateId: number, planId?: number): string {
  return `/workout/templates/${templateId}${planId === undefined ? '' : `?plan=${planId}`}`;
}

/** The pushed page for a plan, preserving the existing folder id. */
export function planPath(folderId: number): string {
  return `/workout/plans/${folderId}`;
}

/** Creates a workout already assigned to the specified plan. */
export function newPlanWorkoutPath(folderId: number): string {
  return `${NEW_TEMPLATE_PATH}?plan=${folderId}`;
}

/** The page for one saved workout. */
export function workoutPath(templateId: number): string {
  return `/workout/workouts/${templateId}`;
}

/** One exercise's history within a saved workout. */
export function workoutExercisePath(templateId: number, exerciseId: number): string {
  return `${workoutPath(templateId)}/exercises/${exerciseId}`;
}
