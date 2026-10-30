import { log } from '../../../core/support/log';

/** Pinned public-domain picture source; matches data/sources/free-exercise-db/SOURCE.md. */
export const EXERCISE_PICTURE_BASE =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/';

/** Display preference only, kept on this phone like appearance. */
const PICTURE_SETTING_KEY = 'workout-tracker.show-exercise-pictures';

/** Pictures default on; a storage failure is logged and uses the default. */
export function savedExercisePictures(): boolean {
  try {
    return localStorage.getItem(PICTURE_SETTING_KEY) !== 'false';
  } catch (error) {
    log.ui.error('Reading the exercise picture preference failed', error);
    return true;
  }
}

/** Saves the preference; returns a readable error when persistence fails. */
export function saveExercisePictures(show: boolean): string | null {
  try {
    localStorage.setItem(PICTURE_SETTING_KEY, String(show));
    return null;
  } catch (error) {
    log.ui.error('Saving the exercise picture preference failed', error);
    return 'The picture setting could not be saved. Please try again.';
  }
}

/** Reads source-relative paths from nullable SQLite JSON, allowing only the source's two JPEG frames. */
export function exercisePictureUrls(imageKeys: string | null | undefined): string[] {
  if (imageKeys === null || imageKeys === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(imageKeys);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === 'string' && /^[\w-]+\/[01]\.jpg$/.test(value))
      .map((path) => `${EXERCISE_PICTURE_BASE}${path}`);
  } catch (error) {
    log.ui.error('Reading exercise picture paths failed', error);
    return [];
  }
}
