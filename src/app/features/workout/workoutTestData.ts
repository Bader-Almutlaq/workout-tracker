import type { Exercise } from '../../../core/models/Exercise';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';

/** A planned working set of 60 kg × 8, with anything the test cares about replaced. For tests only. */
export function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 1,
    workoutExerciseId: 1,
    position: 0,
    kind: 'working',
    weightKilograms: 60,
    entryUnit: 'kg',
    reps: 8,
    rpe: null,
    durationSeconds: null,
    distanceMeters: null,
    side: 'both',
    restBeforeSeconds: null,
    completedAt: null,
    isCompleted: false,
    notes: null,
    ...overrides,
  };
}

/** A weight-and-reps exercise logged in kg, with anything the test cares about replaced. For tests only. */
export function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 1,
    name: 'Bench Press (Barbell)',
    equipment: 'barbell',
    movementPattern: null,
    mechanic: null,
    source: 'library',
    libraryKey: null,
    isLengthenedBiased: false,
    tracking: 'weight-reps',
    defaultEntryUnit: 'kg',
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
