/** The query-string key that names where to go after a form is saved or cancelled. */
export const RETURN_TO_PARAM = 'next';

/**
 * A path inside the app taken from the address, or `undefined` when it isn't one. Only paths
 * starting with a single "/" are accepted, so an edited address can't send the owner to another site.
 */
export function safeReturnPath(raw: string | null): string | undefined {
  if (raw === null || !raw.startsWith('/') || raw.startsWith('//')) return undefined;
  return raw;
}

/** The edit screen for an exercise; saving or cancelling goes to `returnTo` instead of the exercise when given. */
export function editExercisePath(exerciseId: number, returnTo?: string): string {
  const base = `/exercises/${exerciseId}/edit`;
  return returnTo === undefined ? base : `${base}?${RETURN_TO_PARAM}=${encodeURIComponent(returnTo)}`;
}
