import { describe, expect, test } from 'vitest';
import type { CustomExerciseDraft } from '../../../core/library/CustomExerciseDraft';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { canSaveDraft, draftFromDetail, withPrimaryToggled, withSecondaryToggled } from './exerciseDraft';

const detail: ExerciseCatalogDetail = {
  exercise: {
    id: 7,
    name: 'Lateral Raise (Dumbbell)',
    equipment: 'dumbbell',
    movementPattern: 'shoulder-abduction',
    mechanic: 'isolation',
    source: 'library',
    libraryKey: 'lateral-raise-dumbbell',
    isLengthenedBiased: false,
    tracking: 'weight-reps',
    defaultEntryUnit: 'kg',
    restTargetSeconds: null,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  primaryMuscles: ['side-delt'],
  secondaryMuscles: ['upper-traps'],
  aliases: [],
  workoutCount: 0,
  setCount: 0,
  firstUsedAt: null,
  lastUsedAt: null,
  recentSessions: [],
};

describe('exercise draft', () => {
  test('A duplicate copies every field and renames itself', () => {
    expect(draftFromDetail(detail, true)).toEqual({
      name: 'Lateral Raise (Dumbbell) (Copy)',
      equipment: 'dumbbell',
      pattern: 'shoulder-abduction',
      mechanic: 'isolation',
      primaryMuscles: ['side-delt'],
      secondaryMuscles: ['upper-traps'],
      isLengthenedBiased: false,
      tracking: 'weight-reps',
      loadStepKilograms: null,
      barWeightKilograms: null,
      warmupSetCount: null,
    });
  });

  test('An edit keeps the name', () => {
    expect(draftFromDetail(detail, false).name).toBe('Lateral Raise (Dumbbell)');
  });

  test('Saving needs a name and a primary muscle', () => {
    expect(canSaveDraft({})).toBe(false);
    expect(canSaveDraft({ name: '   ', primaryMuscles: ['biceps'] })).toBe(false);
    expect(canSaveDraft({ name: 'Zottman Curl' })).toBe(false);
    expect(canSaveDraft({ name: 'Zottman Curl', primaryMuscles: ['biceps'] })).toBe(true);
  });

  test('Choosing a primary muscle removes it from the secondary list', () => {
    const draft: CustomExerciseDraft = { primaryMuscles: ['biceps'], secondaryMuscles: ['triceps', 'chest'] };
    expect(withPrimaryToggled(draft, 'chest')).toEqual({
      primaryMuscles: ['biceps', 'chest'],
      secondaryMuscles: ['triceps'],
    });
  });

  test('Tapping a chosen muscle again clears it', () => {
    expect(withPrimaryToggled({ primaryMuscles: ['biceps'] }, 'biceps').primaryMuscles).toEqual([]);
    expect(withSecondaryToggled({ secondaryMuscles: ['triceps'] }, 'triceps').secondaryMuscles).toEqual([]);
    expect(withSecondaryToggled({}, 'triceps').secondaryMuscles).toEqual(['triceps']);
  });
});
