import illustrations from '../../../core/library/illustrations.json';
import { log } from '../../../core/support/log';

/** Pinned public-domain photo source. */
export const EXERCISE_PICTURE_BASE =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/';

/** Pinned CC BY-SA illustration source. */
export const ILLUSTRATION_BASE =
  'https://cdn.jsdelivr.net/gh/everkinetic/data@446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6/dist/png/';

/** The phone-local picture display modes. */
export type PicturePreference = 'drawings' | 'photos' | 'off';

const PICTURE_SETTING_KEY = 'workout-tracker.show-exercise-pictures';

/** Defaults to drawings, preserving the earlier boolean off preference. */
export function savedExercisePictures(): PicturePreference {
  try {
    const value = localStorage.getItem(PICTURE_SETTING_KEY);
    if (value === 'false' || value === 'off') return 'off';
    if (value === 'photos') return 'photos';
    return 'drawings';
  } catch (error) {
    log.ui.error('Reading the exercise picture preference failed', error);
    return 'drawings';
  }
}

/** Saves the preference; returns a readable error when persistence fails. */
export function saveExercisePictures(preference: PicturePreference): string | null {
  try {
    localStorage.setItem(PICTURE_SETTING_KEY, preference);
    return null;
  } catch (error) {
    log.ui.error('Saving the exercise picture preference failed', error);
    return 'The picture setting could not be saved. Please try again.';
  }
}

/** Reads only source-relative paths for the two JPEG photo frames. */
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

/** Chooses pinned illustration frames when available, otherwise source photos. */
export function selectedExercisePictures(
  libraryKey: string | null,
  imageKeys: string | null | undefined,
  preference: PicturePreference,
): { readonly urls: readonly string[]; readonly drawings: boolean } {
  if (preference === 'off') return { urls: [], drawings: false };
  // JSON keys are looked up dynamically; absent keys have no illustration.
  const lookup: Readonly<Record<string, string | undefined>> = illustrations;
  const id = libraryKey === null ? undefined : lookup[libraryKey];
  if (preference === 'drawings' && id !== undefined && /^\d{4}$/.test(id)) {
    return {
      urls: [`${ILLUSTRATION_BASE}${id}-relaxation.png`, `${ILLUSTRATION_BASE}${id}-tension.png`],
      drawings: true,
    };
  }
  return { urls: exercisePictureUrls(imageKeys), drawings: false };
}
