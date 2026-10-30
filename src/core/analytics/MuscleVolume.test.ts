import { describe, expect, test } from 'vitest';
import { MUSCLES, type Muscle } from '../library/Muscle';
import type { MuscleRole } from '../library/MuscleRole';
import {
  muscleVolume,
  MuscleVolumeError,
  muscleVolumeZone,
  type MuscleVolumeSet,
  type MuscleVolumeZone,
} from './MuscleVolume';

function association(muscle: Muscle, role: MuscleRole = 'primary', workoutId = 1): MuscleVolumeSet {
  return { muscle, role, workoutId, kind: 'working', rpe: null, isCompleted: true };
}

describe('muscleVolume', () => {
  test('reproduces the report bench example exactly: 1 chest set and 0.5 triceps sets', () => {
    const result = muscleVolume([association('chest'), association('triceps', 'secondary')]);
    expect(result.find((row) => row.muscle === 'chest')).toMatchObject({
      directSets: 1,
      indirectSets: 0,
      totalSets: 1,
    });
    expect(result.find((row) => row.muscle === 'triceps')).toMatchObject({
      directSets: 0,
      indirectSets: 0.5,
      totalSets: 0.5,
    });
  });

  test('supports the report optional 0.3 secondary weight without changing direct counts', () => {
    const result = muscleVolume([association('chest'), association('chest', 'secondary')], 0.3);
    expect(result.find((row) => row.muscle === 'chest')).toMatchObject({
      directSets: 1,
      indirectSets: 0.3,
      totalSets: 1.3,
    });
  });

  test('returns every muscle with zero counts when no workouts were done', () => {
    const result = muscleVolume([]);
    expect(result.map((row) => row.muscle)).toEqual(MUSCLES);
    expect(
      result.every((row) => row.totalSets === 0 && row.zone === 'under-4' && row.sessionsAboveSoftLimit.length === 0),
    ).toBe(true);
  });

  test('excludes warmups, easy sets and planned sets, and includes unknown effort', () => {
    const set = association('chest');
    const result = muscleVolume([set, { ...set, kind: 'warmup' }, { ...set, rpe: 5 }, { ...set, isCompleted: false }]);
    expect(result.find((row) => row.muscle === 'chest')?.totalSets).toBe(1);
  });

  test('combines direct and indirect work across exercises for the >11 session flag', () => {
    const sets = [
      ...Array.from({ length: 10 }, () => association('chest')),
      ...Array.from({ length: 3 }, () => association('chest', 'secondary')),
      ...Array.from({ length: 11 }, () => association('chest', 'primary', 2)),
    ];
    expect(muscleVolume(sets).find((row) => row.muscle === 'chest')).toMatchObject({
      directSets: 21,
      indirectSets: 1.5,
      totalSets: 22.5,
      sessionsAboveSoftLimit: [1],
    });
  });

  test('does not flag an exact 11 reached with fractional 0.3 weights', () => {
    const sets = [
      ...Array.from({ length: 5 }, () => association('chest')),
      ...Array.from({ length: 20 }, () => association('chest', 'secondary')),
    ];
    expect(muscleVolume(sets, 0.3).find((row) => row.muscle === 'chest')).toMatchObject({
      totalSets: 11,
      sessionsAboveSoftLimit: [],
    });
  });

  test('does not flag weekly volume distributed across smaller sessions', () => {
    const sets = Array.from({ length: 24 }, (_, index) => association('chest', 'primary', index % 3));
    expect(muscleVolume(sets).find((row) => row.muscle === 'chest')?.sessionsAboveSoftLimit).toEqual([]);
  });

  test.each([-0.1, 1.1, NaN, Infinity])('rejects invalid secondary weight %s', (weight) => {
    expect(() => muscleVolume([], weight)).toThrow(MuscleVolumeError);
  });
});

describe('muscleVolumeZone', () => {
  test.each<[number, MuscleVolumeZone]>([
    [0, 'under-4'],
    [3.9, 'under-4'],
    [4, '4-to-under-10'],
    [9.9, '4-to-under-10'],
    [10, '10-to-under-20'],
    [19.9, '10-to-under-20'],
    [20, '20-to-30'],
    [30, '20-to-30'],
    [30.1, 'over-30'],
  ])('maps %s weekly sets to %s (report item 10)', (sets, zone) => {
    expect(muscleVolumeZone(sets)).toBe(zone);
  });
});
