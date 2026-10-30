import { afterEach, describe, expect, test, vi } from 'vitest';
import { parseFitNotesWorkoutsFile } from './FitNotesWorkoutsFile';
import { WorkoutFileFixtures } from './fixtures/WorkoutFileFixtures';
import { makeStrongImportPlan } from '../StrongImportPlan';

afterEach(() => vi.unstubAllEnvs());

describe('FitNotes adapter', () => {
  test('one workout per date even for noncontiguous rows, kinds, units, time and quoted notes', () => {
    vi.stubEnv('TZ', 'UTC');
    const plan = makeStrongImportPlan(parseFitNotesWorkoutsFile(WorkoutFileFixtures.fitnotes));
    expect(plan.workouts).toHaveLength(2);
    expect(plan.workouts[0]).toMatchObject({
      name: 'FitNotes workout',
      sourceKey: 'fitnotes:2024-03-10',
      startedAt: '2024-03-10T12:00:00.000Z',
    });
    expect(plan.workouts[0]?.exercises[0]?.sets.map((set) => set.reps)).toEqual([8, 6]);
    expect(plan.workouts[0]?.exercises[0]?.sets[0]).toMatchObject({
      kind: 'working',
      entryUnit: 'lb',
      notes: 'Pause, then lift',
    });
    expect(plan.workouts[1]?.exercises[0]?.sets[0]).toMatchObject({
      durationSeconds: 3723,
      distanceMeters: 1609.344,
      notes: 'Steady "pace"',
    });
  });

  test('noon stays local across DST rather than adding 12 hours to midnight', () => {
    vi.stubEnv('TZ', 'America/New_York');
    const rows = parseFitNotesWorkoutsFile('Date,Exercise\n2024-03-10,Curl\n2024-11-03,Curl');
    expect(rows.map((row) => row.startedAt)).toEqual(['2024-03-10T16:00:00.000Z', '2024-11-03T17:00:00.000Z']);
  });

  test('case-insensitive reordered columns, decimal comma kg, kilometers and missing optional values', () => {
    const rows = parseFitNotesWorkoutsFile(
      'EXERCISE;DATE;Weight (kgs);Distance;Distance Unit;Comment\nCurl;2024-01-01;61,23;2,5;km;"Two\nlines"',
    );
    expect(rows[0]).toMatchObject({
      exportUnit: 'kg',
      weightValue: 61.23,
      distanceMeters: 2500,
      reps: 0,
      seconds: null,
      notes: 'Two\nlines',
    });
  });

  test.each(['Date', 'Exercise'])('names missing %s', (column) => {
    expect(() => parseFitNotesWorkoutsFile(column === 'Date' ? 'Exercise,Category' : 'Date,Category')).toThrow(
      `"${column}" column`,
    );
  });

  test.each([
    ['Date,Exercise\n2024-02-30,Curl', 'Date'],
    ['Date,Exercise\n2024-01-01,', 'Exercise'],
    ['Date,Exercise,Time\n2024-01-01,Run,00:60:00', 'Time'],
    ['Date,Exercise,Distance,Distance Unit\n2024-01-01,Run,1,furlongs', 'Distance Unit'],
    ['Date,Exercise,Weight (kgs)\n2024-01-01,Curl,NaN', 'Weight (kgs)'],
  ])('refuses malformed values %s', (text, column) => {
    expect(() => parseFitNotesWorkoutsFile(text)).toThrow(column);
  });
});
