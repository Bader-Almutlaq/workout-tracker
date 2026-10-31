import { expect, test } from 'vitest';
import { Database } from './Database';
import { DataSafetyFixture } from './fixtures/DataSafetyFixture';
import { validateBackup } from '../backup/BackupValidation';
import { MIGRATIONS, migrate } from './migrations';

test('v4 → v5 preserves every existing row and column and initializes nullable loading settings', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date('2026-01-01'), MIGRATIONS.slice(0, 4));
    DataSafetyFixture.seed(db);
    const before = DataSafetyFixture.read(db);
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 5))).toEqual(['v5-exercise-load-settings']);
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
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 5))).toEqual([]);
    expect(db.exportBytes()).toEqual(bytes);
    expect(() => db.run('UPDATE exercise SET warmupSetCount = 5')).toThrow();
    expect(() => db.run('UPDATE exercise SET warmupSetCount = -1')).toThrow();
  } finally {
    db.close();
  }
});

test('v5 → v6 preserves every row and column, adds nullable details and frozen muscles, and validates backups', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date('2026-01-01'), MIGRATIONS.slice(0, 5));
    DataSafetyFixture.seed(db);
    db.run('UPDATE exercise SET loadStepKilograms = 1.25, barWeightKilograms = 15, warmupSetCount = 3');
    const before = DataSafetyFixture.read(db);
    const oldBytes = db.exportBytes();
    await expect(validateBackup(oldBytes)).resolves.toBeUndefined();
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 6))).toEqual(['v6-library-details']);
    const after = DataSafetyFixture.read(db);
    for (const [table, records] of Object.entries(before)) {
      if (table === 'migration') continue;
      expect(
        after[table]
          ?.slice(0, records.length)
          .map((row) => Object.fromEntries(Object.keys(records[0] ?? {}).map((key) => [key, row[key]]))),
      ).toEqual(records);
    }
    expect(db.all('SELECT instructions, imageKeys FROM exercise')).toEqual([
      { instructions: null, imageKeys: null },
      { instructions: null, imageKeys: null },
    ]);
    expect(db.value('SELECT count(*) FROM muscle')).toBe(28);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 6))).toEqual([]);
  } finally {
    db.close();
  }
});

test('v7 → v8 preserves every row, defaults progression to NULL, and validates old/new backups', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date('2026-01-01'), MIGRATIONS.slice(0, 7));
    DataSafetyFixture.seed(db);
    const before = DataSafetyFixture.read(db);
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    expect(migrate(db)).toEqual(['v8-template-progression']);
    const after = DataSafetyFixture.read(db);
    for (const [table, records] of Object.entries(before)) {
      if (table === 'migration') continue;
      expect(
        after[table]?.map((row) => Object.fromEntries(Object.keys(records[0] ?? {}).map((key) => [key, row[key]]))),
      ).toEqual(records);
    }
    expect(db.all('SELECT progression FROM templateExercise')).toEqual([{ progression: null }]);
    expect(() => db.run("UPDATE templateExercise SET progression = 'automatic'")).toThrow();
    db.run("UPDATE templateExercise SET progression = 'double'");
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    expect(migrate(db)).toEqual([]);
  } finally {
    db.close();
  }
});
