import { expect, it } from 'vitest';
import { ExerciseLibrary } from './ExerciseLibrary';
import { copyExerciseDraft } from './CustomExerciseDraft';

it('copies library fields into a named draft', () => {
  const entry = ExerciseLibrary.bundled().exercises[0];
  expect(entry).toBeDefined();
  if (entry === undefined) throw new Error('Missing library entry');
  expect(copyExerciseDraft(entry)).toMatchObject({ name: `${entry.name} (Copy)`, primaryMuscles: entry.primaryMuscles });
});
