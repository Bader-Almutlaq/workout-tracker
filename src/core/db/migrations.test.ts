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
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 8))).toEqual(['v8-template-progression']);
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
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 8))).toEqual([]);
  } finally {
    db.close();
  }
});

test('v8 → v9 preserves every row, defaults deload to NULL, constrains stages and validates backups', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date('2026-01-01'), MIGRATIONS.slice(0, 8));
    DataSafetyFixture.seed(db);
    const before = DataSafetyFixture.read(db);
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 9))).toEqual(['v9-deload']);
    const after = DataSafetyFixture.read(db);
    for (const [table, records] of Object.entries(before)) {
      if (table === 'migration') continue;
      expect(
        after[table]?.map((row) => Object.fromEntries(Object.keys(records[0] ?? {}).map((key) => [key, row[key]]))),
      ).toEqual(records);
    }
    expect(db.all('SELECT deloadStage FROM workoutExercise')).toEqual([{ deloadStage: null }, { deloadStage: null }]);
    for (const invalid of [0, 3, -1, 1.5, 'invalid']) {
      expect(() => db.run('UPDATE workoutExercise SET deloadStage = ?', [invalid])).toThrow();
    }
    for (const stage of [1, 2, null]) {
      db.run('UPDATE workoutExercise SET deloadStage = ?', [stage]);
      await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    }
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    const bytes = db.exportBytes();
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 9))).toEqual([]);
    expect(db.exportBytes()).toEqual(bytes);
  } finally {
    db.close();
  }
});

test('v9 → v10 preserves rows, defaults brands to NULL and validates backups', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date('2026-01-01'), MIGRATIONS.slice(0, 9));
    DataSafetyFixture.seed(db);
    const before = DataSafetyFixture.read(db);
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 10))).toEqual(['v10-machine-brand']);
    const after = DataSafetyFixture.read(db);
    for (const [table, records] of Object.entries(before)) {
      if (table === 'migration') continue;
      expect(
        after[table]?.map((row) => Object.fromEntries(Object.keys(records[0] ?? {}).map((key) => [key, row[key]]))),
      ).toEqual(records);
    }
    expect(db.all('SELECT machineBrand FROM workoutExercise')).toEqual([
      { machineBrand: null },
      { machineBrand: null },
    ]);
    expect(db.all('SELECT machineBrand FROM templateExercise')).toEqual([{ machineBrand: null }]);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
  } finally {
    db.close();
  }
});

test('v10 to v11 preserves rows, defaults weekday to null, and validates backups', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date(), MIGRATIONS.slice(0, 10));
    DataSafetyFixture.seed(db);
    const before = DataSafetyFixture.read(db);
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    expect(migrate(db, new Date(), MIGRATIONS.slice(0, 11))).toEqual(['v11-template-weekday']);
    const after = DataSafetyFixture.read(db);
    for (const [table, records] of Object.entries(before)) {
      if (table === 'migration') continue;
      expect(
        after[table]?.map((row) => Object.fromEntries(Object.keys(records[0] ?? {}).map((key) => [key, row[key]]))),
      ).toEqual(records);
    }
    expect(db.all('SELECT weekday FROM template')).toEqual([{ weekday: null }]);
    expect(() => db.run('UPDATE template SET weekday = 8')).toThrow();
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
  } finally {
    db.close();
  }
});

test('v11 to v12 preserves stage and nullable settings through a backup', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date(), MIGRATIONS.slice(0, 11));
    DataSafetyFixture.seed(db);
    db.run('UPDATE workoutExercise SET deloadStage = 1');
    expect(migrate(db)).toEqual(['v12-deload-settings']);
    expect(db.all('SELECT deloadStage, deloadMode, deloadLoadPercent, deloadSetPercent FROM workoutExercise')).toEqual([
      { deloadStage: 1, deloadMode: null, deloadLoadPercent: null, deloadSetPercent: null },
      { deloadStage: 1, deloadMode: null, deloadLoadPercent: null, deloadSetPercent: null },
    ]);
    db.run("UPDATE workoutExercise SET deloadMode = 'both', deloadLoadPercent = 15, deloadSetPercent = 33");
    await expect(validateBackup(db.exportBytes())).resolves.toBeUndefined();
    const restored = await Database.fromBytes(db.exportBytes());
    try {
      expect(restored.all('SELECT deloadMode, deloadLoadPercent, deloadSetPercent FROM workoutExercise')).toEqual([
        { deloadMode: 'both', deloadLoadPercent: 15, deloadSetPercent: 33 },
        { deloadMode: 'both', deloadLoadPercent: 15, deloadSetPercent: 33 },
      ]);
    } finally {
      restored.close();
    }
  } finally {
    db.close();
  }
});
