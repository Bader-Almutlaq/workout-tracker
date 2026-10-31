import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { ExercisePictures } from './ExercisePictures';
import {
  exercisePictureUrls,
  EXERCISE_PICTURE_BASE,
  ILLUSTRATION_BASE,
  savedExercisePictures,
  saveExercisePictures,
} from './picturePreference';

afterEach(() => vi.unstubAllGlobals());

function storage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set('workout-tracker.show-exercise-pictures', initial);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
}

test('defaults to drawings, preserves the old off setting, and saves modes', () => {
  storage('false');
  expect(savedExercisePictures()).toBe('off');
  expect(saveExercisePictures('photos')).toBeNull();
  expect(savedExercisePictures()).toBe('photos');
  expect(saveExercisePictures('drawings')).toBeNull();
  expect(savedExercisePictures()).toBe('drawings');
});

test('renders drawings first, falls back to photos, and respects both other modes', () => {
  storage();
  const render = (libraryKey: string | null) =>
    renderToStaticMarkup(
      createElement(ExercisePictures, { libraryKey, imageKeys: '["Pushups/0.jpg","Pushups/1.jpg"]' }),
    );
  expect(render('bench-press-barbell')).toContain(`${ILLUSTRATION_BASE}0042-relaxation.png`);
  expect(render('bench-press-barbell')).toContain(`${ILLUSTRATION_BASE}0042-tension.png`);
  expect(render(null)).toContain(`${EXERCISE_PICTURE_BASE}Pushups/0.jpg`);
  saveExercisePictures('photos');
  expect(render('bench-press-barbell')).toContain(`${EXERCISE_PICTURE_BASE}Pushups/0.jpg`);
  saveExercisePictures('off');
  expect(render('bench-press-barbell')).toBe('');
});

test('photo paths are restricted to the pinned source', () => {
  expect(exercisePictureUrls(null)).toEqual([]);
  expect(exercisePictureUrls('{}')).toEqual([]);
  expect(exercisePictureUrls('["https://example.com/0.jpg","../0.jpg","Exercise/2.jpg",1]')).toEqual([]);
});
