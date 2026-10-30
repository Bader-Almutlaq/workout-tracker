import { afterEach, describe, expect, test, vi } from 'vitest';
import { Database } from '../../db/Database';
import { migrate } from '../../db/migrations';
import { makeStrongImportPlan } from '../StrongImportPlan';
import { importStrongPlan } from '../StrongImporter';
import { makeImportOptions } from '../StrongImportOptions';
import { parseStrongWorkoutsFile } from '../StrongWorkoutsFile';
import { parseHevyWorkoutsFile } from './HevyWorkoutsFile';
import { parseFitNotesWorkoutsFile } from './FitNotesWorkoutsFile';
import { parseFitbodWorkoutsFile } from './FitbodWorkoutsFile';
import { WorkoutFileFixtures } from './fixtures/WorkoutFileFixtures';

const Now = new Date('2026-10-31T12:00:00.000Z');
afterEach(() => vi.unstubAllEnvs());

describe('adapter CSV → shared plan → database', () => {
  test.each([
    {
      format: 'hevy',
      parse: parseHevyWorkoutsFile,
      text: WorkoutFileFixtures.hevy,
      workouts: 1,
      sets: 4,
      firstWeight: 20.41165665,
      note: null,
    },
    {
      format: 'fitnotes',
      parse: parseFitNotesWorkoutsFile,
      text: WorkoutFileFixtures.fitnotes,
      workouts: 2,
      sets: 3,
      firstWeight: 9.0718474,
      note: 'Pause, then lift',
    },
    {
      format: 'fitbod',
      parse: parseFitbodWorkoutsFile,
      text: WorkoutFileFixtures.fitbod,
      workouts: 3,
      sets: 4,
      firstWeight: 9.0718474,
      note: 'Pause, lift',
    },
  ])(
    '$format preserves performed values and importing twice adds nothing',
    async ({ format, parse, text, workouts, sets, firstWeight, note }) => {
      vi.stubEnv('TZ', 'UTC');
      const db = await Database.openInMemory();
      migrate(db);
      try {
        const plan = makeStrongImportPlan(parse(text));
        expect(plan.sourceFormat).toBe(format);
        expect(importStrongPlan(db, plan, Now)).toMatchObject({ workoutsAdded: workouts, setsAdded: sets });
        expect(db.value('SELECT count(*) FROM workout')).toBe(workouts);
        expect(db.value('SELECT count(*) FROM workoutSet')).toBe(sets);
        expect(db.get('SELECT entryUnit, notes, isCompleted FROM workoutSet ORDER BY id LIMIT 1')).toEqual({
          entryUnit: 'lb',
          notes: note,
          isCompleted: 1,
        });
        expect(db.value<number>('SELECT weightKilograms FROM workoutSet ORDER BY id LIMIT 1')).toBeCloseTo(firstWeight);
        expect(db.value<string>('SELECT sourceKey FROM workout ORDER BY id LIMIT 1')?.startsWith(`${format}:`)).toBe(
          true,
        );
        expect(importStrongPlan(db, makeStrongImportPlan(parse(text)), Now)).toMatchObject({
          workoutsAdded: 0,
          workoutsSkipped: workouts,
          setsAdded: 0,
          exercisesCreated: 0,
        });
        expect(db.value('SELECT count(*) FROM workoutSet')).toBe(sets);
        if (format === 'hevy') {
          expect(db.value('SELECT notes FROM workoutExercise ORDER BY id LIMIT 1')).toBe('Wide grip, pause');
          expect(db.value('SELECT notes FROM workout ORDER BY id LIMIT 1')).toBe('Good session');
        }
      } finally {
        db.close();
      }
    },
  );

  test('identical workout keys from different apps never collide with Strong', async () => {
    const db = await Database.openInMemory();
    migrate(db);
    try {
      const strong = parseStrongWorkoutsFile(
        'Date,Workout Name,Exercise Name,Set Order,Weight,Reps\n2024-01-01 12:00:00,A,Curl,1,20,8',
      );
      const row = strong[0];
      if (row === undefined) throw new Error('Missing synthetic row');
      const rows = [
        ...(['hevy', 'fitnotes', 'fitbod'] as const).map((sourceFormat) => ({ ...row, sourceFormat })),
        row,
      ];
      const plan = makeStrongImportPlan(rows);
      expect(new Set(plan.workouts.map((workout) => workout.sourceKey)).size).toBe(4);
      expect(importStrongPlan(db, plan, Now).workoutsAdded).toBe(4);
    } finally {
      db.close();
    }
  });

  test('unit overrides, per-set correction, exclusions and reset use the same shared plan', () => {
    const rows = parseHevyWorkoutsFile(WorkoutFileFixtures.hevy);
    const reviewed = makeStrongImportPlan(
      rows,
      [],
      makeImportOptions({
        unitOverrides: new Map([['Bench', 'kg']]),
        corrections: new Map([[3, { reps: 7, weightKilograms: 50 }]]),
        excludedLines: new Set([2]),
      }),
    );
    expect(reviewed.setsExcluded).toBe(1);
    expect(reviewed.workouts[0]?.exercises[0]?.sets[0]).toMatchObject({
      line: 3,
      entryUnit: 'kg',
      reps: 7,
      weightKilograms: 50,
    });
    const reset = makeStrongImportPlan(rows);
    expect(reset.totals.sets).toBe(4);
    expect(reset.workouts[0]?.exercises[0]?.sets[0]?.entryUnit).toBe('lb');
  });

  test('explicit per-row kg/lb survives a file with both populated variants', () => {
    const rows = parseHevyWorkoutsFile(
      'title,start_time,exercise_title,weight_kg,weight_lbs\nA,2024-01-01,Curl,61.23,\nA,2024-01-01,Curl,,135',
    );
    const sets = makeStrongImportPlan(rows).workouts[0]?.exercises[0]?.sets;
    expect(sets?.[0]).toMatchObject({ weightKilograms: 61.23, entryUnit: 'kg' });
    expect(sets?.[1]?.weightKilograms).toBeCloseTo(61.23496995);
    expect(sets?.[1]?.entryUnit).toBe('lb');
  });
});
