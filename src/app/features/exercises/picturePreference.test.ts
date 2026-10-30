import { afterEach, expect, test, vi } from 'vitest';
import {
  exercisePictureUrls,
  EXERCISE_PICTURE_BASE,
  savedExercisePictures,
  saveExercisePictures,
} from './picturePreference';

afterEach(() => vi.unstubAllGlobals());

test('pictures default on and persist a phone-local off preference', () => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  expect(savedExercisePictures()).toBe(true);
  expect(saveExercisePictures(false)).toBeNull();
  expect(savedExercisePictures()).toBe(false);
  expect(saveExercisePictures(true)).toBeNull();
  expect(savedExercisePictures()).toBe(true);
});

test('picture paths are restricted to two JPEG frames under the pinned source', () => {
  expect(exercisePictureUrls('["Pushups/0.jpg","Pushups/1.jpg"]')).toEqual([
    `${EXERCISE_PICTURE_BASE}Pushups/0.jpg`,
    `${EXERCISE_PICTURE_BASE}Pushups/1.jpg`,
  ]);
  expect(exercisePictureUrls(null)).toEqual([]);
  expect(exercisePictureUrls(undefined)).toEqual([]);
  expect(exercisePictureUrls('{}')).toEqual([]);
  expect(exercisePictureUrls('["https://example.com/0.jpg","../0.jpg","Exercise/2.jpg",1]')).toEqual([]);
});
