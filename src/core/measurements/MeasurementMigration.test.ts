import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { MIGRATIONS, migrate } from '../db/migrations';
import { validateBackup } from '../backup/BackupValidation';
import { restoreBackup, type LiveDatabaseStorage } from '../backup/BackupRestore';
import { importStrongPlan } from '../import/StrongImporter';
import { makeStrongImportPlan } from '../import/StrongImportPlan';
import { parseStrongMeasurementsFile } from '../import/StrongMeasurementsFile';
import { MeasurementQueries } from './MeasurementQueries';

const v3 = MIGRATIONS.slice(0, 3);

async function oldDatabase(): Promise<Database> {
  const db = await Database.openInMemory();
  migrate(db, new Date(), v3);
  db.exec(`
    INSERT INTO bodyMeasurement (id, takenAt, site, value, source) VALUES
      (1, '2026-01-01T01:02:03.456Z', 'waist', 83.12345678901234, 'strong'),
      (7, '2026-01-02T01:02:03.456Z', 'unknown-α', 1.2345678901234567, 'app'),
      (8, '2026-01-03T01:02:03.456Z', 'bodyweight', 61.234970000000004, 'strong'),
      (99, 'deleted', 'waist', 1, 'app');
    DELETE FROM bodyMeasurement WHERE id = 99;
  `);
  return db;
}

function originalRows(db: Database) {
  return db.all<{ id: number; takenAt: string; site: string; value: number; source: string }>(`
    SELECT id, takenAt, site, value, source FROM bodyMeasurement ORDER BY id
  `);
}

function floatBytes(value: number): number[] {
  return [...new Uint8Array(new Float64Array([value]).buffer)];
}

describe('v4 measurement migration', () => {
  test('all original rows, string bytes, float bytes and id high-water mark survive', async () => {
    const db = await oldDatabase();
    const before = originalRows(db);
    expect(migrate(db)).toContain('v4-measurement-sites');
    const after = originalRows(db);
    expect(after).toEqual(before);
    expect(after.map((row) => floatBytes(row.value))).toEqual(before.map((row) => floatBytes(row.value)));
    expect(db.all('SELECT state, entryUnit FROM bodyMeasurement')).toEqual(
      before.map(() => ({ state: 'relaxed', entryUnit: null })),
    );
    expect(MeasurementQueries.detail(db, 'unknown-α')?.site).toMatchObject({
      name: 'unknown-α',
      kind: 'length',
      isCustom: true,
    });
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    const next = db.run(
      `INSERT INTO bodyMeasurement (takenAt, site, value, source) VALUES ('next', 'waist', 1, 'app')`,
    );
    expect(next.lastInsertRowId).toBe(100);
    db.close();
  });
  test('an empty legacy table still retains the deleted-id high-water mark', async () => {
    const db = await oldDatabase();
    db.exec('DELETE FROM bodyMeasurement');
    migrate(db);
    const next = db.run(
      `INSERT INTO bodyMeasurement (takenAt, site, value, source) VALUES ('next', 'waist', 1, 'app')`,
    );
    expect(next.lastInsertRowId).toBe(100);
    db.close();
  });
  test('sixteen frozen sites include eight flex-capable paired muscle sites, all with guides', async () => {
    const db = await Database.openInMemory();
    migrate(db);
    expect(db.value('SELECT COUNT(*) FROM measurementSite')).toBe(16);
    expect(db.value('SELECT COUNT(*) FROM measurementSite WHERE supportsFlexed = 1')).toBe(8);
    expect(db.value("SELECT COUNT(*) FROM measurementSite WHERE guide = ''")).toBe(0);
    db.close();
  });
  test('uniqueness includes state; invalid states and orphaned sites are refused', async () => {
    const db = await oldDatabase();
    migrate(db);
    db.exec(`INSERT INTO bodyMeasurement (takenAt, site, value, source, state)
      SELECT takenAt, site, value, source, 'flexed' FROM bodyMeasurement WHERE id = 1`);
    expect(() =>
      db.exec(`INSERT INTO bodyMeasurement (takenAt, site, value, source)
      SELECT takenAt, site, value, source FROM bodyMeasurement WHERE id = 1`),
    ).toThrow();
    expect(() =>
      db.exec(
        `INSERT INTO bodyMeasurement (takenAt, site, value, source, state) VALUES ('x', 'waist', 1, 'app', 'bad')`,
      ),
    ).toThrow();
    expect(() =>
      db.exec(`INSERT INTO bodyMeasurement (takenAt, site, value, source) VALUES ('x', 'missing', 1, 'app')`),
    ).toThrow();
    db.close();
  });
  test('table rebuild rolls back atomically on a later failure', async () => {
    const db = await oldDatabase();
    const before = db.exportBytes();
    const migration = MIGRATIONS.find((item) => item.id === 'v4-measurement-sites');
    if (migration === undefined) throw new Error('Missing v4');
    expect(() =>
      migrate(db, new Date(), [...v3, { ...migration, sql: migration.sql + 'SELECT * FROM missing;' }]),
    ).toThrow();
    expect(db.exportBytes()).toEqual(before);
    db.close();
  });
  test('v3 backup validates and restores through the real restore path with a safety snapshot', async () => {
    const source = await oldDatabase();
    const expected = originalRows(source);
    const bytes = source.exportBytes();
    await validateBackup(bytes);
    let connection = await Database.openInMemory();
    migrate(connection);
    const previous = connection.exportBytes();
    let file = previous;
    let snapshot: Uint8Array | undefined;
    const storage: LiveDatabaseStorage = {
      async saveSnapshot(value) {
        snapshot = value;
        return 'snapshot';
      },
      closeLive() {
        connection.close();
      },
      async replaceLive(value) {
        file = value;
      },
      async openLive() {
        connection = await Database.fromBytes(file);
        return connection;
      },
    };
    const report = await restoreBackup(storage, connection, bytes);
    expect(report.appliedMigrations).toContain('v4-measurement-sites');
    expect(snapshot).toEqual(previous);
    expect(originalRows(connection)).toEqual(expected);
    await validateBackup(connection.exportBytes());
    expect(source.exportBytes()).toEqual(bytes);
    source.close();
    connection.close();
  });
  test('Strong reimport stays idempotent after v4, including an unknown new slug and flexed sibling', async () => {
    const db = await oldDatabase();
    migrate(db);
    const measurements = parseStrongMeasurementsFile(
      'Date,Measurement Type,Value,Unit\n2026-01-01 01:02:03,Waist,80,cm\n2026-02-01 00:00:00,Wrist,7,in',
    );
    const legacy = originalRows(db)[0];
    if (legacy === undefined) throw new Error('Missing legacy measurement');
    const legacyPlan = makeStrongImportPlan(
      [],
      [
        {
          takenAt: legacy.takenAt,
          site: legacy.site,
          value: legacy.value,
          source: 'strong',
        },
      ],
    );
    expect(importStrongPlan(db, legacyPlan, new Date()).measurementsAdded).toBe(0);
    const plan = makeStrongImportPlan([], measurements);
    expect(importStrongPlan(db, plan, new Date()).measurementsAdded).toBe(2);
    db.exec(`INSERT INTO bodyMeasurement (takenAt, site, value, source, state)
      SELECT takenAt, site, value + 1, source, 'flexed' FROM bodyMeasurement WHERE site = 'waist' ORDER BY id DESC LIMIT 1`);
    const before = db.all('SELECT * FROM bodyMeasurement ORDER BY id');
    expect(importStrongPlan(db, plan, new Date()).measurementsAdded).toBe(0);
    expect(db.all('SELECT * FROM bodyMeasurement ORDER BY id')).toEqual(before);
    expect(MeasurementQueries.detail(db, 'wrist')?.site.isCustom).toBe(true);
    db.close();
  });
});
