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
  it('gives unlogged effort less influence than logged effort with the same effective reps', () => {
    const unknown = synthetic(40).map((set) => ({ ...set, reps: set.reps - 2, rpe: null }));
    const known = unknown.map((set) => ({ ...set, rpe: 8 }));
    const weighted = personalCurve(exercise, [...synthetic(20), ...unknown]);
    const unweighted = personalCurve(exercise, [...synthetic(20), ...known]);
    expect(weighted.k).not.toBeNull();
    expect(weighted.k ?? Infinity).toBeLessThan(unweighted.k ?? 0);
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
