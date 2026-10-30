import { expect, test } from 'vitest';
import { Database } from './Database';
import { DataSafetyFixture } from './fixtures/DataSafetyFixture';
import { MIGRATIONS, migrate } from './migrations';

test('v4 → v5 preserves every existing row and column and initializes nullable loading settings', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date('2026-01-01'), MIGRATIONS.slice(0, 4));
    DataSafetyFixture.seed(db);
    const before = DataSafetyFixture.read(db);
    expect(migrate(db)).toEqual(['v5-exercise-load-settings']);
    const after = DataSafetyFixture.read(db);
    for (const [table, records] of Object.entries(before)) {
      if (table === 'migration') continue;
      expect(
        after[table]?.map((row) => Object.fromEntries(Object.keys(records[0] ?? {}).map((key) => [key, row[key]]))),
      ).toEqual(records);
    }
    expect(db.all('SELECT loadStepKilograms, barWeightKilograms, warmupSetCount FROM exercise')).toEqual([
      { loadStepKilograms: null, barWeightKilograms: null, warmupSetCount: null },
      { loadStepKilograms: null, barWeightKilograms: null, warmupSetCount: null },
    ]);
    const bytes = db.exportBytes();
    expect(migrate(db)).toEqual([]);
    expect(db.exportBytes()).toEqual(bytes);
    expect(() => db.run('UPDATE exercise SET warmupSetCount = 5')).toThrow();
    expect(() => db.run('UPDATE exercise SET warmupSetCount = -1')).toThrow();
  } finally {
    db.close();
  }
});
