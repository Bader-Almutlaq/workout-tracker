import { describe, expect, test } from 'vitest';
import { Database } from './Database';
import { DatabaseError } from './DatabaseError';
import { MIGRATIONS, migrate, pendingMigrationIds } from './migrations';

async function migratedDatabase(): Promise<Database> {
  const db = await Database.openInMemory();
  migrate(db);
  return db;
}

describe('migrations', () => {
  test('a new database gets every table and all 23 muscles', async () => {
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
      'migration',
      'muscle',
      'template',
      'templateExercise',
      'templateFolder',
      'templateSet',
      'workout',
      'workoutExercise',
      'workoutSet',
    ]);
    expect(db.value('SELECT count(*) FROM muscle')).toBe(23);
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
