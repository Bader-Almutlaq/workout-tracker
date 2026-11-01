import { describe, expect, it } from 'vitest';
import { personalCurve, type PersonalCurveSet } from './PersonalCurve';
import { estimatedOneRepMax, type StrengthExercise } from './EstimatedOneRepMax';

const exercise: StrengthExercise = {
  equipment: 'barbell',
  movementPattern: 'horizontal-push',
  mechanic: 'compound',
  tracking: 'weight-reps',
};
function synthetic(k: number, count = 10): PersonalCurveSet[] {
  return Array.from({ length: count }, (_, index) => {
    const reps = index % 2 === 0 ? 3 : 8;
    return { date: '2026-01-01', kind: 'working', reps, rpe: 10, weightKilograms: 100 / (1 + (reps - 1) / k) };
  });
}

describe('personalCurve', () => {
  it('returns the type prior below ten qualifying sets or with one effective-rep count', () => {
    expect(personalCurve(exercise, synthetic(20, 9))).toEqual({
      k: 29,
      kStart: 29,
      personalSets: 9,
      isPersonal: false,
    });
    expect(
      personalCurve(
        exercise,
        synthetic(20).map((set) => ({ ...set, reps: 3 })),
      ),
    ).toMatchObject({ k: 29, isPersonal: false });
  });
  it('finds exact k=20 then blends ten sets with fifteen prior sets, deterministically', () => {
    const sets = synthetic(20);
    const curve = personalCurve(exercise, sets);
    expect(curve).toEqual({ k: (10 * 20 + 15 * 29) / 25, kStart: 29, personalSets: 10, isPersonal: true });
    expect(personalCurve(exercise, [...sets].reverse())).toEqual(curve);
    expect(
      estimatedOneRepMax(
        { kind: 'working', reps: 5, rpe: 10, weightKilograms: 100 },
        { ...exercise, strengthCurve: curve },
      )?.e1rmKilograms,
    ).toBeCloseTo(100 * (1 + 4 / 25.4));
  });
  it('does not confuse strength changes between two-week windows with rep endurance', () => {
    const later = synthetic(20).map((set) => ({
      ...set,
      date: '2026-02-01',
      weightKilograms: set.weightKilograms * 2,
    }));
    expect(personalCurve(exercise, [...synthetic(20), ...later]).k).toBeCloseTo((20 * 20 + 15 * 29) / 35);
  });
  it('requires an identifiable window and returns no estimate for an unmapped lift without one', () => {
    const unmapped = { ...exercise, equipment: null };
    expect(personalCurve(unmapped, synthetic(20, 9)).k).toBeNull();
    expect(
      estimatedOneRepMax(synthetic(20)[0] ?? { kind: 'warmup', reps: 0, rpe: null, weightKilograms: 0 }, unmapped),
    ).toBeNull();
    const separated = synthetic(20).map((set, index) => ({
      ...set,
      date: `2026-${String(index + 1).padStart(2, '0')}-01`,
    }));
    expect(personalCurve(exercise, separated).isPersonal).toBe(false);
    expect(personalCurve(unmapped, synthetic(20))).toMatchObject({ k: 20, kStart: null, isPersonal: true });
  });
  it.each([
    [2, 8],
    [100, 50],
  ])('bounds an unconstrained k=%s fit at %s', (input, expected) => {
    expect(personalCurve({ ...exercise, equipment: null }, synthetic(input)).k).toBe(expected);
  });
  it('excludes unknown effort from the count, rep checks, window anchors and fitted curve', () => {
    const unknown = synthetic(40).map((set) => ({ ...set, reps: set.reps - 2, rpe: null }));
    expect(personalCurve(exercise, [...synthetic(20), ...unknown])).toEqual(personalCurve(exercise, synthetic(20)));
    expect(personalCurve(exercise, [...synthetic(20, 9), ...unknown]).isPersonal).toBe(false);
    const oneCount = synthetic(20).map((set) => ({ ...set, reps: 3 }));
    expect(personalCurve(exercise, [...oneCount, ...unknown]).isPersonal).toBe(false);
    const atBoundary = synthetic(20).map((set, index) => ({
      ...set,
      date: index % 2 === 0 ? '2026-01-14' : '2026-01-15',
    }));
    expect(personalCurve(exercise, [...unknown, ...atBoundary])).toEqual(personalCurve(exercise, atBoundary));
  });
  it('keeps Strong-like unknown-effort squat history on k=38 and estimates a triple at 154.74 kg', () => {
    const squat: StrengthExercise = { ...exercise, movementPattern: 'squat' };
    const sets = Array.from({ length: 20 }, (_, week) => {
      const date = new Date(Date.UTC(2025, 0, 1 + week * 7)).toISOString();
      return [
        { date, kind: 'working', reps: 3, rpe: null, weightKilograms: 140 },
        ...Array.from({ length: 3 }, (): PersonalCurveSet => ({
          date,
          kind: 'working',
          reps: 10,
          rpe: null,
          weightKilograms: 100,
        })),
      ] satisfies PersonalCurveSet[];
    }).flat();
    const curve = personalCurve(squat, sets);
    expect(curve).toEqual({ k: 38, kStart: 38, personalSets: 0, isPersonal: false });
    expect(
      estimatedOneRepMax(
        { kind: 'working', reps: 3, rpe: null, weightKilograms: 140 },
        { ...squat, strengthCurve: curve },
      )?.e1rmKilograms,
    ).toBeCloseTo(154.7368421053);
  });
  it('fits k=30 at E=3, 6 and 9 before blending all twelve known-effort sets', () => {
    // e1RM 150 = 140.625*(1+2/30) = (900/7)*(1+5/30) = (2250/19)*(1+8/30).
    const sets = Array.from(
      { length: 4 },
      () =>
        [
          { date: '2026-01-01', kind: 'working', reps: 2, rpe: 9, weightKilograms: 140.625 },
          { date: '2026-01-02', kind: 'working', reps: 4, rpe: 8, weightKilograms: 900 / 7 },
          { date: '2026-01-03', kind: 'working', reps: 7, rpe: 8, weightKilograms: 2250 / 19 },
        ] satisfies PersonalCurveSet[],
    ).flat();
    expect(personalCurve({ ...exercise, equipment: null }, sets).k).toBe(30);
    expect(personalCurve(exercise, sets)).toEqual({
      k: (12 * 30 + 15 * 29) / 27,
      kStart: 29,
      personalSets: 12,
      isPersonal: true,
    });
  });
  it('ignores sets rated further than 2 reps from failure when fitting', () => {
    // RPE 7 back-offs at 10 reps would need a low k to agree with the triples; they must not fit the curve.
    const squat: StrengthExercise = { ...exercise, movementPattern: 'squat' };
    const sets = Array.from(
      { length: 12 },
      (_, week) =>
        [
          {
            date: `2026-01-${String(week + 1).padStart(2, '0')}`,
            kind: 'working',
            reps: 3,
            rpe: 9,
            weightKilograms: 140,
          },
          {
            date: `2026-01-${String(week + 1).padStart(2, '0')}`,
            kind: 'working',
            reps: 10,
            rpe: 7,
            weightKilograms: 100,
          },
        ] satisfies PersonalCurveSet[],
    ).flat();
    expect(personalCurve(squat, sets)).toEqual({ k: 38, kStart: 38, personalSets: 12, isPersonal: false });
  });
  it('uses only the best trial estimate per effective-rep count within a window', () => {
    // Each window has E=3 at 140.625 kg and E=6 at 900/7 kg, agreeing at k=30.
    // The E=6 back-offs at 100 and 90 kg must not pull the fitted k down.
    const sets = Array.from({ length: 3 }, (_, window) => {
      const date = new Date(Date.UTC(2026, 0, 1 + window * 14)).toISOString();
      return [
        { date, kind: 'working', reps: 3, rpe: 10, weightKilograms: 140.625 },
        ...[900 / 7, 100, 90].map((weightKilograms): PersonalCurveSet => ({
          date,
          kind: 'working',
          reps: 6,
          rpe: 10,
          weightKilograms,
        })),
      ] satisfies PersonalCurveSet[];
    }).flat();
    expect(personalCurve({ ...exercise, equipment: null }, sets).k).toBe(30);
    expect(personalCurve(exercise, sets).k).toBe((12 * 30 + 15 * 29) / 27);
    expect(personalCurve(exercise, [...sets].reverse())).toEqual(personalCurve(exercise, sets));
  });
  it('fits failure sets with no RPE because their effort is known', () => {
    const sets = synthetic(20).map((set): PersonalCurveSet => ({ ...set, kind: 'failure', rpe: null }));
    expect(personalCurve(exercise, sets)).toEqual(personalCurve(exercise, synthetic(20)));
  });
  it('excludes warmups, invalid dates, invalid loads, excessive RIR and E above twelve', () => {
    const invalid: PersonalCurveSet[] = [
      { ...synthetic(20)[0], date: 'invalid', kind: 'working', reps: 3, rpe: 10, weightKilograms: 100 },
      { date: '2026-01-01', kind: 'warmup', reps: 3, rpe: 10, weightKilograms: 100 },
      { date: '2026-01-01', kind: 'working', reps: 3, rpe: 5, weightKilograms: 100 },
      { date: '2026-01-01', kind: 'working', reps: 13, rpe: 10, weightKilograms: 100 },
      { date: '2026-01-01', kind: 'working', reps: 3, rpe: 10, weightKilograms: -100 },
    ];
    expect(personalCurve(exercise, [...synthetic(20, 9), ...invalid]).personalSets).toBe(9);
    expect(personalCurve({ ...exercise, tracking: 'bodyweight-reps' }, synthetic(20)).k).toBe(29);
  });
});
