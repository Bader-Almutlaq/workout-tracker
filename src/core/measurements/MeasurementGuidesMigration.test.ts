import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate, MIGRATIONS } from '../db/migrations';

test('v7 updates only matching defaults, preserves edited guides and all measurement bytes, and is idempotent', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date(), MIGRATIONS.slice(0, 6));
    db.exec(`
      UPDATE measurementSite SET guide = 'My own tape position' WHERE key = 'waist';
      INSERT INTO bodyMeasurement (takenAt, site, value, source, state, entryUnit)
      VALUES ('2025-01-03T10:00:00.123Z', 'lower-abs', 81.123456789, 'app', 'relaxed', 'cm'),
        ('2025-02-03T11:00:00.456Z', 'bodyweight', 67.891234567, 'strong', 'relaxed', NULL);
    `);
    const before = db.all('SELECT * FROM bodyMeasurement ORDER BY id');
    const sites = db.all<{ key: string; guide: string }>('SELECT key, guide FROM measurementSite ORDER BY key');
    // Later migrations may also run; this test only needs v7 to be among them.
    expect(migrate(db)).toContain('v7-measurement-ab-guides');
    expect(db.all('SELECT * FROM bodyMeasurement ORDER BY id')).toEqual(before);
    expect(db.value("SELECT guide FROM measurementSite WHERE key = 'waist'")).toBe('My own tape position');
    expect(db.value("SELECT guide FROM measurementSite WHERE key = 'lower-abs'")).toBe(
      'Lower abs: at the hip bone, tape level, relaxed, after a normal exhale.',
    );
    expect(db.value("SELECT guide FROM measurementSite WHERE key = 'upper-abs'")).toBe(
      'Upper abs: above the belly button, below the ribs, relaxed, after a normal exhale.',
    );
    expect(
      db.all("SELECT key, guide FROM measurementSite WHERE key NOT IN ('lower-abs', 'upper-abs') ORDER BY key"),
    ).toEqual(sites.filter((site) => !['lower-abs', 'upper-abs'].includes(site.key)));
    expect(migrate(db)).toEqual([]);
  } finally {
    db.close();
  }
});

test('v7 updates the default waist note and preserves deliberately empty ab notes', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db, new Date(), MIGRATIONS.slice(0, 6));
    db.run("UPDATE measurementSite SET guide = '' WHERE key = ?", ['upper-abs']);
    migrate(db);
    expect(db.value("SELECT guide FROM measurementSite WHERE key = 'waist'")).toBe(
      'Waist: at the belly button, tape level and snug, relaxed, after a normal exhale.',
    );
    expect(db.value("SELECT guide FROM measurementSite WHERE key = 'upper-abs'")).toBe('');
  } finally {
    db.close();
  }
});
