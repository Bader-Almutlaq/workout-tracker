import type { Exercise } from '../../../core/models/Exercise';
import { ExercisePictures } from './ExercisePictures';
import { ExerciseInstructions } from './ExerciseInstructions';

/** Optional pictures keep their existing preference/cache behavior; instruction text remains available offline. */
export function ExerciseHowToTab({ exercise }: { readonly exercise: Exercise }) {
  return (
    <>
      <ExercisePictures imageKeys={exercise.imageKeys} />
      {exercise.instructions?.trim() ? (
        <ExerciseInstructions instructions={exercise.instructions} />
      ) : (
        <p>No instructions for this exercise.</p>
      )}
    </>
  );
}
