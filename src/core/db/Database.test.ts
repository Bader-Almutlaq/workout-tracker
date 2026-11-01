import { describe, expect, test } from 'vitest';
import { Database } from './Database';
import { DataSafetyFixture } from './fixtures/DataSafetyFixture';
import { DatabaseError } from './DatabaseError';
import { MIGRATIONS, migrate, pendingMigrationIds } from './migrations';

async function migratedDatabase(): Promise<Database> {
  const db = await Database.openInMemory();
  migrate(db);
  return db;
}

describe('migrations', () => {
  test('a new database gets every table and all 28 muscles', async () => {
    const db = await migratedDatabase();
    const tables = db
      .all<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .map((row) => row.name);
    expect(tables).toEqual([
      'appSetting',
      'bodyMeasurement',
      'exercise',
      'exerciseAlias',
      'exerciseMuscle',
      'measurementSite',
      'migration',
      'muscle',
      'pinnedExercise',
      'template',
      'templateExercise',
      'templateFolder',
      'templateSet',
      'workout',
      'workoutExercise',
      'workoutSet',
    ]);
    expect(db.value('SELECT count(*) FROM muscle')).toBe(28);
  });

  test('running again applies nothing', async () => {
    const db = await migratedDatabase();
    expect(pendingMigrationIds(db)).toEqual([]);
    expect(migrate(db)).toEqual([]);
  });

  test('a database from a newer app version is refused', async () => {
    const db = await migratedDatabase();
    db.run("INSERT INTO migration (id, appliedAt) VALUES ('v99-future', '2030-01-01T00:00:00.000Z')");
    expect(() => pendingMigrationIds(db)).toThrow(DatabaseError);
  });

  test('a failing migration leaves no trace', async () => {
    const db = await Database.openInMemory();
    const broken = [...MIGRATIONS, { id: 'v2-broken', sql: 'CREATE TABLE extra (a); SELECT * FROM missing;' }];
    expect(() => migrate(db, new Date(), broken)).toThrow(DatabaseError);
    expect(pendingMigrationIds(db, broken)).toEqual(['v2-broken']);
    expect(db.value("SELECT count(*) FROM sqlite_master WHERE name = 'extra'")).toBe(0);
  });

  test('foreign keys are enforced', async () => {
    const db = await migratedDatabase();
    expect(() => db.run('INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (999, 999, 0)')).toThrow(
      DatabaseError,
    );
  });

  test('only one workout can be in progress', async () => {
    const db = await migratedDatabase();
    const insert =
      "INSERT INTO workout (startedAt, name, source, isInProgress) VALUES ('2026-10-30T10:00:00.000Z', 'A', 'app', 1)";
    db.run(insert);
    expect(() => db.run(insert)).toThrow(DatabaseError);
  });
});

describe('Database', () => {
  test('a failed transaction rolls back, and nested ones roll back only themselves', async () => {
    const db = await migratedDatabase();
    const setting = (key: string) => db.value<string>('SELECT value FROM appSetting WHERE key = ?', [key]);

    expect(() =>
      db.transaction(() => {
        db.run("INSERT INTO appSetting VALUES ('a', '1')");
        throw new Error('stop');
      }),
    ).toThrow('stop');
    expect(setting('a')).toBeUndefined();

    db.transaction(() => {
      db.run("INSERT INTO appSetting VALUES ('outer', '1')");
      expect(() =>
        db.transaction(() => {
          db.run("INSERT INTO appSetting VALUES ('inner', '1')");
          throw new Error('inner fails');
        }),
      ).toThrow('inner fails');
    });
    expect(setting('outer')).toBe('1');
    expect(setting('inner')).toBeUndefined();
  });

  test('exported bytes reopen as the same data', async () => {
    const db = await migratedDatabase();
    db.run("INSERT INTO appSetting VALUES ('k', 'v')");
    const copy = await Database.fromBytes(db.exportBytes());
    expect(copy.value('SELECT value FROM appSetting WHERE key = ?', ['k'])).toBe('v');
    expect(pendingMigrationIds(copy)).toEqual([]);
  });

  test('bytes that are not SQLite are refused', async () => {
    const notSqlite = Uint8Array.from({ length: 4096 }, (_, index) => index % 251);
    await expect(Database.fromBytes(notSqlite)).rejects.toThrow(DatabaseError);
  });
});

describe('populated migration safety audit', () => {
  test('v1 to current preserves every old table, row and column, and rerunning is byte-for-byte unchanged', async () => {
    const current = await migratedDatabase();
    DataSafetyFixture.seed(current);
    const original = DataSafetyFixture.read(current);
    const legacy = await Database.openInMemory();
    migrate(legacy, new Date('2026-01-01T00:00:00Z'), MIGRATIONS.slice(0, 1));
    const tables = legacy.all<{ name: string }>(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT IN ('migration', 'sqlite_sequence', 'muscle')
    `);
    for (const { name } of tables) {
      const columns = legacy.all<{ name: string }>(`PRAGMA table_info("${name}")`).map((row) => row.name);
      for (const row of original[name] ?? []) {
        legacy.run(
          `INSERT INTO "${name}" (${columns.map((column) => `"${column}"`).join(', ')})
           VALUES (${columns.map(() => '?').join(', ')})`,
          columns.map((column) => row[column] ?? null),
        );
      }
    }
    const before = DataSafetyFixture.read(legacy);
    const snapshot = legacy.exportBytes();
    expect(migrate(legacy)).toEqual(MIGRATIONS.slice(1).map(({ id }) => id));
    const after = DataSafetyFixture.read(legacy);
    for (const [name, rows] of Object.entries(before)) {
      if (name === 'migration') continue;
      if (name !== 'muscle') expect(after[name]).toHaveLength(rows.length);
      expect(
        after[name]
          ?.slice(0, rows.length)
          .map((row) => Object.fromEntries(Object.keys(rows[0] ?? {}).map((key) => [key, row[key]]))),
      ).toEqual(rows);
    }
    const unchanged = legacy.exportBytes();
    expect(migrate(legacy)).toEqual([]);
    expect(legacy.exportBytes()).toEqual(unchanged);
    const restoredSnapshot = await Database.fromBytes(snapshot);
    expect(DataSafetyFixture.read(restoredSnapshot)).toEqual(before);
    current.close();
    legacy.close();
    restoredSnapshot.close();
  });

  test('a failing pending migration leaves populated data and its snapshot unchanged', async () => {
    const db = await migratedDatabase();
    DataSafetyFixture.seed(db);
    const before = DataSafetyFixture.read(db);
    const snapshot = db.exportBytes();
    expect(() =>
      migrate(db, new Date(), [
        ...MIGRATIONS,
        {
          id: 'audit-failing',
          sql: `
        UPDATE workoutSet SET notes = 'Must roll back';
        DELETE FROM bodyMeasurement;
        CREATE TABLE partial_migration (value TEXT);
        SELECT * FROM nonexistent_table;
      `,
        },
      ]),
    ).toThrow(DatabaseError);
    expect(DataSafetyFixture.read(db)).toEqual(before);
    const recovered = await Database.fromBytes(snapshot);
    expect(DataSafetyFixture.read(recovered)).toEqual(before);
    db.close();
    recovered.close();
  });
});
