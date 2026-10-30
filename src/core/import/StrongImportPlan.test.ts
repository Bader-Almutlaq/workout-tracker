import { describe, expect, test, vi } from 'vitest';
import { KILOGRAMS_PER_POUND } from '../units/WeightUnit';
import { NEWER_LAYOUT, OLDER_LAYOUT, squatHistoryWithTypo } from './fixtures/StrongFixtures';
import { makeImportOptions, type StrongImportOptions } from './StrongImportOptions';
import { makeStrongImportPlan, type PlannedSet, type StrongImportPlan } from './StrongImportPlan';
import { parseStrongWorkoutsFile } from './StrongWorkoutsFile';

vi.stubEnv('TZ', 'UTC');

function plan(text: string = OLDER_LAYOUT, options: StrongImportOptions = makeImportOptions()): StrongImportPlan {
  return makeStrongImportPlan(parseStrongWorkoutsFile(text), [], options);
}

/** The exercise entry at `[workout][exercise]`, failing the test if absent. */
function entry(
  result: StrongImportPlan,
  workout: number,
  exercise: number,
): StrongImportPlan['workouts'][number]['exercises'][number] {
  const found = result.workouts[workout]?.exercises[exercise];
  if (found === undefined) throw new Error(`No exercise ${exercise} in workout ${workout}`);
  return found;
}

function setAt(result: StrongImportPlan, workout: number, exercise: number, index: number): PlannedSet {
  const found = entry(result, workout, exercise).sets[index];
  if (found === undefined) throw new Error(`No set ${index}`);
  return found;
}

describe('Import plan', () => {
  test('A finite but unrepresentable duration cannot crash the plan or invent an end time', () => {
    const result = plan(
      'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps\n2024-01-01 10:00:00,A,1e308,B,1,100,5',
    );
    // 10^308 seconds exceeds the ECMAScript calendar range; the performed 100×5 still contributes 500 kg.
    expect(result.workouts[0]?.endedAt).toBeNull();
    expect(result.totals).toMatchObject({ workouts: 1, sets: 1, volumeKilograms: 500 });
  });

  test('BOM/CRLF, quoted multiline notes and identical drop rows preserve performed work', () => {
    const text =
      '\uFEFF' +
      [
        'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
        '2024-01-01 23:50:00,"Push, heavy",1h 7m,Bench,W,20,10,0,0,,,',
        '2024-01-01 23:50:00,"Push, heavy",1h 7m,Bench,1,100,5,0,0,"line 1\r\nline 2","felt ""good""",8',
        '2024-01-01 23:50:00,"Push, heavy",1h 7m,Bench,D,80,8,0,0,,,',
        '2024-01-01 23:50:00,"Push, heavy",1h 7m,Bench,D,80,8,0,0,,,',
        '2024-01-01 23:50:00,"Push, heavy",1h 7m,Bench,F,70,6,0,0,,,10',
        '2024-01-01 23:50:00,"Push, heavy",1h 7m,Run,1,0,0,1500.5,90,,,',
      ].join('\r\n');
    const result = plan(text);
    // Warmup contributes no tonnage: 100×5 + 2×80×8 + 70×6 = 2200 kg.
    expect(result.totals).toMatchObject({ workouts: 1, sets: 6, workSets: 5, volumeKilograms: 2200 });
    expect(result.workouts[0]).toMatchObject({
      startedAt: '2024-01-01T23:50:00.000Z',
      endedAt: '2024-01-02T00:57:00.000Z',
      notes: 'felt "good"',
    });
    expect(entry(result, 0, 0).sets.map((set) => set.kind)).toEqual(['warmup', 'working', 'drop', 'drop', 'failure']);
    expect(setAt(result, 0, 0, 1).notes).toBe('line 1\r\nline 2');
    expect(setAt(result, 0, 0, 2).rpe).toBeNull();
    expect(setAt(result, 0, 1, 0)).toMatchObject({ distanceMeters: 1500.5, durationSeconds: 90 });
  });

  test('Rows group into workouts and exercise entries in file order', () => {
    const result = plan();
    expect(result.workouts.map((workout) => workout.name)).toEqual(['Push, heavy', 'Legs']);
    expect(result.workouts[0]?.exercises.map((exercise) => exercise.name)).toEqual([
      'Bench Press (Barbell)',
      'Seated Leg Curl (Machine)',
    ]);
    expect(result.workouts[0]?.exercises.map((exercise) => exercise.position)).toEqual([0, 1]);
    expect(result.workouts[0]?.sourceKey).toBe('strong:2024-01-01 10:00:00');
    expect(result.workouts[0]?.notes).toBe('Felt good');
    expect(result.workouts[0]?.startedAt).toBe('2024-01-01T10:00:00.000Z');
    expect(result.workouts[0]?.endedAt).toBe('2024-01-01T11:07:00.000Z');
  });

  test('Set orders map to kinds and positions count within the entry', () => {
    const bench = entry(plan(), 0, 0).sets;
    expect(bench.map((set) => set.kind)).toEqual(['warmup', 'working', 'failure']);
    expect(bench.map((set) => set.position)).toEqual([0, 1, 2]);
  });

  test('A kg column keeps its values; lb-typed sets are marked as lb', () => {
    const result = plan();
    expect(setAt(result, 0, 0, 1).weightKilograms).toBe(61.23);
    expect(setAt(result, 0, 0, 1).entryUnit).toBe('lb');
    expect(setAt(result, 0, 0, 2).entryUnit).toBe('kg');
  });

  test('A lb column is converted to kg; kg-typed and lb-typed sets are told apart', () => {
    const result = plan();
    expect(result.exercises.find((exercise) => exercise.name === 'Seated Leg Curl (Machine)')?.columnUnit).toBe('lb');
    const first = setAt(result, 0, 1, 0);
    expect(Math.abs(first.weightKilograms - 45)).toBeLessThan(0.01);
    expect(first.entryUnit).toBe('kg');
    const typedInPounds = setAt(result, 1, 0, 0);
    expect(Math.abs(typedInPounds.weightKilograms - 140 * KILOGRAMS_PER_POUND)).toBeLessThan(1e-9);
    expect(typedInPounds.entryUnit).toBe('lb');
  });

  test('An owner override changes the column unit', () => {
    const result = plan(
      OLDER_LAYOUT,
      makeImportOptions({ unitOverrides: new Map([['Seated Leg Curl (Machine)', 'kg']]) }),
    );
    expect(setAt(result, 0, 1, 0).weightKilograms).toBe(99.21);
    const curl = result.exercises.find((exercise) => exercise.name === 'Seated Leg Curl (Machine)');
    expect(curl?.isOverridden).toBe(true);
    expect(curl?.columnUnit).toBe('kg');
    expect(curl?.verdict.columnUnit).toBe('lb');
  });

  test('Totals: sets, work sets and volume exclude warm-ups', () => {
    const { totals } = plan();
    expect(totals.workouts).toBe(2);
    expect(totals.sets).toBe(6);
    expect(totals.workSets).toBe(5);
    const bench = 61.23 * 8 + 60 * 6;
    const curlPounds = 99.21 * 12 + 140 * 10 + 63.93 * 15;
    const expected = bench + curlPounds * KILOGRAMS_PER_POUND;
    expect(Math.abs(totals.volumeKilograms - expected)).toBeLessThan(1e-6);
    expect(totals.firstDate).toBe('2024-01-01T10:00:00.000Z');
    expect(totals.lastDate).toBe('2024-01-08T10:00:00.000Z');
  });

  test('Newer layout: notes attach to the exercise; rest timers are skipped', () => {
    const result = plan(NEWER_LAYOUT);
    const pulldown = entry(result, 0, 0);
    expect(pulldown.sets).toHaveLength(2);
    expect(pulldown.notes).toBe('Use the wide bar');
    expect(result.totals.skippedRestTimerRows).toBe(1);
  });

  test('A typo is flagged; correcting or confirming it removes the flag', () => {
    const text = squatHistoryWithTypo();
    const flagged = plan(text);
    const finding = flagged.findings[0];
    expect(flagged.findings).toHaveLength(1);
    expect(finding?.suggestion).toBe(100);
    const line = finding?.id ?? -1;

    const corrected = plan(text, makeImportOptions({ corrections: new Map([[line, { weightKilograms: 100 }]]) }));
    expect(corrected.findings).toEqual([]);
    const set = corrected.workouts
      .flatMap((workout) => workout.exercises)
      .flatMap((exercise) => exercise.sets)
      .find((s) => s.line === line);
    expect(set?.weightKilograms).toBe(100);
    expect(set?.isCorrected).toBe(true);

    expect(plan(text, makeImportOptions({ confirmedLines: new Set([line]) })).findings).toEqual([]);
  });
});

describe('Import plan details beyond the native tests', () => {
  const HEADER =
    'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE';

  test('A rep correction replaces the reps and keeps the weight', () => {
    const result = plan(OLDER_LAYOUT, makeImportOptions({ corrections: new Map([[3, { reps: 5 }]]) }));
    expect(setAt(result, 0, 0, 1)).toMatchObject({ reps: 5, weightKilograms: 61.23, isCorrected: true });
  });

  test('setsByLine finds every set with its workout and exercise', () => {
    const result = plan();
    expect(result.setsByLine.size).toBe(6);
    expect(result.setsByLine.get(3)).toMatchObject({
      workoutName: 'Push, heavy',
      exerciseName: 'Bench Press (Barbell)',
      workoutStartedAt: '2024-01-01T10:00:00.000Z',
    });
  });

  test('Exercise overviews list sets and dates, most sets first, ties in order of first appearance', () => {
    const result = plan();
    expect(result.exercises.map((exercise) => [exercise.name, exercise.setCount])).toEqual([
      ['Bench Press (Barbell)', 3],
      ['Seated Leg Curl (Machine)', 3],
    ]);
    expect(result.exercises[1]).toMatchObject({
      firstDate: '2024-01-01T10:00:00.000Z',
      lastDate: '2024-01-08T10:00:00.000Z',
      isOverridden: false,
    });
    expect(result.exercises[1]?.verdict.poundVotes).toBe(2);
  });

  test('RPE outside 1 to 10 is dropped; a workout without a duration has no end', () => {
    const result = plan(
      `${HEADER}\n2024-01-01 10:00:00,A,,B,1,50,5,0,0,,,0.5\n2024-01-01 10:00:00,A,,B,2,50,5,0,0,,,10.5\n2024-01-01 10:00:00,A,,B,3,50,5,0,0,,,1\n2024-01-01 10:00:00,A,,B,4,50,5,0,0,,,10`,
    );
    expect(entry(result, 0, 0).sets.map((set) => set.rpe)).toEqual([null, null, 1, 10]);
    expect(result.workouts[0]?.endedAt).toBeNull();
  });

  test('Two note rows join with a line break; a note-only entry is kept and an empty one is dropped', () => {
    const result = plan(
      [
        'Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Notes',
        '2024-01-01 10:00:00,A,Curl,Note,,,first',
        '2024-01-01 10:00:00,A,Curl,Note,,,second',
        '2024-01-01 10:00:00,A,Row,Note,,,',
        '2024-01-01 10:00:00,A,Press,1,20,5,',
      ].join('\n'),
    );
    expect(result.workouts[0]?.exercises.map((exercise) => [exercise.name, exercise.position, exercise.notes])).toEqual(
      [
        ['Curl', 0, 'first\nsecond'],
        ['Press', 2, null],
      ],
    );
  });

  test('The same exercise twice in a row is one entry; after another exercise it is a new entry', () => {
    const result = plan(
      [
        'Date,Workout Name,Exercise Name,Set Order,Weight,Reps',
        '2024-01-01 10:00:00,A,Curl,1,20,5',
        '2024-01-01 10:00:00,A,Curl,2,20,5',
        '2024-01-01 10:00:00,A,Row,1,20,5',
        '2024-01-01 10:00:00,A,Curl,3,20,5',
      ].join('\n'),
    );
    expect(result.workouts[0]?.exercises.map((exercise) => [exercise.name, exercise.sets.length])).toEqual([
      ['Curl', 2],
      ['Row', 1],
      ['Curl', 1],
    ]);
  });

  test("Rest-timer rows between a workout's rows do not split it or add exercises", () => {
    const result = plan(NEWER_LAYOUT);
    expect(result.workouts).toHaveLength(1);
    expect(result.workouts[0]?.exercises).toHaveLength(1);
  });

  test('Lower-case set orders count as the same kinds', () => {
    const result = plan(
      'Date,Workout Name,Exercise Name,Set Order,Weight,Reps\n2024-01-01 10:00:00,A,Curl,w,20,5\n2024-01-01 10:00:00,A,Curl,d,20,5\n2024-01-01 10:00:00,A,Curl,f,20,5',
    );
    expect(entry(result, 0, 0).sets.map((set) => set.kind)).toEqual(['warmup', 'drop', 'failure']);
  });

  test('An empty export gives an empty plan', () => {
    const result = makeStrongImportPlan([]);
    expect(result.workouts).toEqual([]);
    expect(result.totals).toEqual({
      workouts: 0,
      sets: 0,
      workSets: 0,
      volumeKilograms: 0,
      firstDate: null,
      lastDate: null,
      skippedRestTimerRows: 0,
    });
  });
});
