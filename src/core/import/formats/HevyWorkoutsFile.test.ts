import { afterEach, describe, expect, test, vi } from 'vitest';
import { parseHevyWorkoutsFile } from './HevyWorkoutsFile';
import { WorkoutFileFixtures } from './fixtures/WorkoutFileFixtures';
import { makeStrongImportPlan } from '../StrongImportPlan';

vi.stubEnv('TZ', 'UTC');
afterEach(() => vi.unstubAllEnvs());

describe('Hevy adapter', () => {
  test('kinds, units, quoting, workout notes, deduplicated exercise notes and end time', () => {
    vi.stubEnv('TZ', 'UTC');
    const rows = parseHevyWorkoutsFile(WorkoutFileFixtures.hevy);
    expect(rows).toHaveLength(5);
    const plan = makeStrongImportPlan(rows);
    const workout = plan.workouts[0];
    expect(workout).toMatchObject({
      name: 'Push, heavy',
      notes: 'Good session',
      sourceKey: 'hevy:26 Oct 2024, 18:00',
      startedAt: '2024-10-26T18:00:00.000Z',
      endedAt: '2024-10-26T19:00:00.000Z',
    });
    expect(workout?.exercises[0]?.notes).toBe('Wide grip, pause');
    const sets = workout?.exercises[0]?.sets ?? [];
    expect(sets.map((set) => set.kind)).toEqual(['warmup', 'working', 'drop', 'failure']);
    expect(sets[1]).toMatchObject({ line: 3, entryUnit: 'lb', reps: 5, rpe: 8 });
    expect(sets[1]?.weightKilograms).toBeCloseTo(61.23496995);
    expect(sets[3]).toMatchObject({ distanceMeters: 1609.344, durationSeconds: 65 });
  });

  test('case-insensitive reordered headers, kg precedence and literal kg entry units', () => {
    const rows = parseHevyWorkoutsFile(
      'EXERCISE_TITLE,TITLE,START_TIME,weight_lbs,WEIGHT_KG,reps\nCurl,Push,2024-01-01T10:00:00,99,61.23,8',
    );
    const plan = makeStrongImportPlan(rows);
    expect(plan.workouts[0]?.exercises[0]?.sets[0]).toMatchObject({ weightKilograms: 61.23, entryUnit: 'kg' });
  });

  test('ISO offsets and local DST gaps/folds use explicit calendar parsing', () => {
    vi.stubEnv('TZ', 'America/New_York');
    const parse = (date: string) =>
      parseHevyWorkoutsFile(`title,start_time,exercise_title\nPush,"${date}",Bench`)[0]?.startedAt;
    expect(parse('10 Mar 2024, 02:30')).toBe('2024-03-10T07:30:00.000Z');
    expect(parse('03 Nov 2024, 01:30')).toBe('2024-11-03T05:30:00.000Z');
    expect(parse('2024-11-03T01:30:00-05:00')).toBe('2024-11-03T06:30:00.000Z');
  });

  test.each(['title', 'start_time', 'exercise_title'])('names missing %s', (column) => {
    const header = ['title', 'start_time', 'exercise_title'].filter((name) => name !== column).join(',');
    expect(() => parseHevyWorkoutsFile(header)).toThrow(`"${column}" column`);
  });

  test.each(['31 Feb 2024, 18:00', '2024-02-30T12:00:00Z', '2024-01-01T25:00:00', 'not a date'])(
    'rejects malformed date %s',
    (date) => {
      expect(() => parseHevyWorkoutsFile(`title,start_time,exercise_title\nA,"${date}",Bench`)).toThrow('start_time');
    },
  );

  test('invalid optional numeric values and end times do not silently vanish', () => {
    expect(() => parseHevyWorkoutsFile('title,start_time,exercise_title,weight_kg\nA,2024-01-01,Bench,wat')).toThrow(
      'weight_kg',
    );
    expect(() =>
      parseHevyWorkoutsFile('title,start_time,exercise_title,end_time\nA,2024-01-02,Bench,2024-01-01'),
    ).toThrow('end_time');
  });

  test('kilometers and doubled quotes in multiline notes are preserved', () => {
    const rows = parseHevyWorkoutsFile(
      'title,start_time,exercise_title,exercise_notes,distance_km\nRun,2024-01-01,Run,"Say ""go""\nAgain",2.5',
    );
    expect(rows[0]?.notes).toBe('Say "go"\nAgain');
    expect(rows[1]?.distanceMeters).toBe(2500);
  });
});
