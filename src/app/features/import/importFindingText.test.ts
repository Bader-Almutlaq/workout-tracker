import { describe, expect, it } from 'vitest';
import type { SetContext, StrongImportPlan } from '../../../core/import/StrongImportPlan';
import type { SetFinding } from '../../../core/validation/SetPlausibility';
import { correction, dateRange, explanation, groupFindings, suggestionText } from './importFindingText';

const context: SetContext = {
  workoutStartedAt: '2024-02-01T12:00:00Z',
  workoutName: 'Workout',
  exerciseName: 'Squat',
  set: {
    line: 1,
    position: 0,
    kind: 'working',
    weightKilograms: 100,
    entryUnit: 'kg',
    reps: 5,
    rpe: null,
    durationSeconds: null,
    distanceMeters: null,
    notes: null,
    isCorrected: false,
  },
};
const finding: SetFinding = { id: 1, issue: 'weightTooHigh', typical: 100, suggestion: 90 };

describe('import finding helpers', () => {
  it('groups by exercise and date, sorts dates, and skips missing contexts', () => {
    const earlier = { ...context, workoutStartedAt: '2024-01-01T12:00:00Z' };
    const plan: StrongImportPlan = {
      workouts: [],
      exercises: [],
      measurements: [],
      findings: [finding, { ...finding, id: 2 }, { ...finding, id: 3 }, { ...finding, id: 4 }],
      setsByLine: new Map([
        [1, context],
        [2, context],
        [3, earlier],
      ]),
      totals: {
        workouts: 0,
        sets: 0,
        workSets: 0,
        volumeKilograms: 0,
        firstDate: null,
        lastDate: null,
        skippedRestTimerRows: 0,
      },
    };
    const groups = groupFindings(plan);
    expect(groups.map((group) => group.items.length)).toEqual([1, 2]);
    expect(groups[0]?.date).toBe(earlier.workoutStartedAt);
    expect(dateRange(plan)).toBe('—');
  });
  it('formats explanations and suggestions and builds corrections for each issue', () => {
    expect(explanation({ finding, context })).toBe('usually ~100 kg');
    expect(suggestionText({ finding, context })).toBe('90 kg');
    expect(correction(finding, 90)).toEqual({ weightKilograms: 90 });
    const reps = { ...finding, issue: 'repsTooHigh' as const, typical: 8.4, suggestion: 8.6 };
    expect(explanation({ finding: reps, context })).toBe('usually ~8 reps');
    expect(suggestionText({ finding: reps, context })).toBe('9 reps');
    expect(correction(reps, 8.6)).toEqual({ reps: 9 });
    const zero = { ...finding, issue: 'zeroReps' as const, suggestion: null };
    expect(explanation({ finding: zero, context })).toBe('0 reps');
    expect(suggestionText({ finding: zero, context })).toBe('');
  });
});
