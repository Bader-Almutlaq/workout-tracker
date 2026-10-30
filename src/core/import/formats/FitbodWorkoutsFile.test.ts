import { afterEach, describe, expect, test, vi } from 'vitest';
import { parseFitbodWorkoutsFile } from './FitbodWorkoutsFile';
import { WorkoutFileFixtures } from './fixtures/WorkoutFileFixtures';
import { makeStrongImportPlan } from '../StrongImportPlan';

afterEach(() => vi.unstubAllEnvs());

describe('Fitbod adapter', () => {
  test('groups by start minute, retains notes and units, ignores dumbbell multiplier', () => {
    vi.stubEnv('TZ', 'UTC');
    const rows = parseFitbodWorkoutsFile(WorkoutFileFixtures.fitbod);
    expect(rows[0]).toMatchObject({ weightValue: 20, exportUnit: 'lb', notes: 'Pause, lift' });
    const plan = makeStrongImportPlan(rows);
    expect(plan.workouts).toHaveLength(3);
    expect(plan.workouts[0]?.exercises[0]?.sets.map((set) => set.kind)).toEqual(['warmup', 'working']);
    expect(plan.workouts[0]?.exercises[0]?.sets[1]?.notes).toBe('Keep "steady"');
    expect(plan.workouts[0]?.exercises[0]?.sets[0]?.weightKilograms).toBeCloseTo(9.0718474);
    expect(plan.workouts[1]?.exercises[0]?.sets[0]).toMatchObject({ durationSeconds: 65, distanceMeters: 400 });
    expect(plan.workouts[2]).toMatchObject({ sourceKey: 'fitbod:2024-11-04', startedAt: '2024-11-04T12:00:00.000Z' });
  });

  test('DST fold/gap and explicit ISO offset are read as local/explicit instants', () => {
    vi.stubEnv('TZ', 'America/New_York');
    const parse = (date: string) => parseFitbodWorkoutsFile(`Date,Exercise\n${date},Curl`)[0]?.startedAt;
    expect(parse('2024-03-10 02:30:15')).toBe('2024-03-10T07:30:00.000Z');
    expect(parse('2024-11-03 01:30:15')).toBe('2024-11-03T05:30:00.000Z');
    expect(parse('2024-11-03T01:30:15.123-05:00')).toBe('2024-11-03T06:30:00.000Z');
  });

  test('reordered case-insensitive kg header and numeric warmup flags', () => {
    const rows = parseFitbodWorkoutsFile(
      'EXERCISE,Weight(kg),DATE,isWarmup\nCurl,61.23,2024-01-01,1\nCurl,20,2024-01-01,0',
    );
    const sets = makeStrongImportPlan(rows).workouts[0]?.exercises[0]?.sets;
    expect(sets?.[0]).toMatchObject({ kind: 'warmup', weightKilograms: 61.23, entryUnit: 'kg' });
    expect(sets?.[1]?.kind).toBe('working');
  });

  test.each(['Date', 'Exercise'])('names missing %s', (column) => {
    expect(() => parseFitbodWorkoutsFile(column === 'Date' ? 'Exercise,isWarmup' : 'Date,isWarmup')).toThrow(
      `"${column}" column`,
    );
  });

  test.each([
    ['2023-02-29', '', 'Date'],
    ['2024-01-01', 'perhaps', 'isWarmup'],
  ])('refuses malformed date/flag: %s %s', (date, warmup, column) => {
    expect(() => parseFitbodWorkoutsFile(`Date,Exercise,isWarmup\n${date},Curl,${warmup}`)).toThrow(column);
  });

  test('bad numeric values and negative durations are rejected', () => {
    expect(() => parseFitbodWorkoutsFile('Date,Exercise,Duration(s)\n2024-01-01,Curl,-5')).toThrow('Duration(s)');
    expect(() => parseFitbodWorkoutsFile('Date,Exercise,Weight(lb)\n2024-01-01,Curl,Infinity')).toThrow('Weight(lb)');
  });
});
