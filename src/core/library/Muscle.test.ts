import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { MUSCLE_DISPLAY_NAMES, MUSCLE_REGION_OF, MUSCLES, compareMuscles } from './Muscle';
import { MUSCLE_REGIONS } from './MuscleRegion';

interface MuscleRow {
  readonly id: string;
  readonly name: string;
  readonly region: string;
}

describe('muscle taxonomy', () => {
  test('lists the same 28 muscles, names and regions as the frozen v1/v6 rows', async () => {
    const db = await Database.openInMemory();
    migrate(db);
    const rows = db.all<MuscleRow>('SELECT id, name, region FROM muscle ORDER BY rowid');
    expect(rows).toHaveLength(28);
    expect(rows.map((row) => row.id)).toEqual([...MUSCLES]);
    expect(rows.map((row) => row.name)).toEqual(MUSCLES.map((muscle) => MUSCLE_DISPLAY_NAMES[muscle]));
    expect(rows.map((row) => row.region)).toEqual(MUSCLES.map((muscle) => MUSCLE_REGION_OF[muscle]));
  });

  test('every region has at least one muscle', () => {
    const used = new Set(MUSCLES.map((muscle) => MUSCLE_REGION_OF[muscle]));
    expect([...used].sort()).toEqual([...MUSCLE_REGIONS].sort());
  });

  test('muscles sort head to toe', () => {
    expect(compareMuscles('chest', 'neck')).toBeLessThan(0);
    expect(compareMuscles('neck', 'chest')).toBeGreaterThan(0);
    expect(compareMuscles('lats', 'lats')).toBe(0);
    expect((['calves', 'chest', 'biceps', 'side-delt'] as const).toSorted(compareMuscles)).toEqual([
      'chest',
      'side-delt',
      'biceps',
      'calves',
    ]);
  });
});
