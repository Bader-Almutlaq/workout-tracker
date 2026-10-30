import { expect, test, vi } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { makeImportOptions } from '../import/StrongImportOptions';
import { makeStrongImportPlan } from '../import/StrongImportPlan';
import { importStrongPlan } from '../import/StrongImporter';
import { parseStrongWorkoutsFile } from '../import/StrongWorkoutsFile';
import { parseStrongMeasurementsFile } from '../import/StrongMeasurementsFile';
import { exportMeasurementsCsv } from './MeasurementsCsvExport';
import { csvRecord, exportStrongCsv, strongDuration, StrongCsvRoundTripLosses } from './StrongCsvExport';

vi.stubEnv('TZ', 'UTC');

test('formats durations and RFC 4180 quoting', () => {
  expect(strongDuration('2024-01-01T23:30:00Z', '2024-01-02T00:37:01Z')).toBe('1h 7m 1s');
  expect(strongDuration('2024-01-01T00:00:00Z', '2024-01-01T00:59:00Z')).toBe('59m');
  expect(strongDuration('2024-01-01T00:00:00Z', null)).toBe('');
  expect(csvRecord(['a,b', 'a"b', 'a\nb', null])).toBe('"a,b","a""b","a\nb",');
});

test('exports completed sets and imports their supported data into a fresh database', async () => {
  const db = await Database.openInMemory();
  const copy = await Database.openInMemory();
  migrate(db);
  migrate(copy);
  db.run(`INSERT INTO exercise (id, name, source, createdAt) VALUES (10, 'Test (Machine)', 'custom', '2024-01-01')`);
  db.run(`INSERT INTO template (name, position, createdAt, updatedAt) VALUES ('Plan', 0, '2024-01-01', '2024-01-01')`);
  db.run(
    `INSERT INTO workout (id, templateId, startedAt, endedAt, name, notes, source) VALUES (10, 1, '2024-01-01T23:30:00.000Z', '2024-01-02T00:37:01.000Z', 'Night', 'workout, note', 'app')`,
  );
  db.run(
    `INSERT INTO workoutExercise (id, workoutId, exerciseId, position, supersetGroup, notes) VALUES (10, 10, 10, 0, 1, 'exercise note')`,
  );
  db.run(`INSERT INTO workoutSet (id, workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, durationSeconds, distanceMeters, notes) VALUES
    (10, 10, 0, 'warmup', 20, 'lb', 10, NULL, NULL, NULL, 'warm, "up"'),
    (11, 10, 1, 'working', 61.23496995, 'lb', 8, 8, 30, NULL, 'line one
line two'),
    (12, 10, 2, 'drop', 30, 'kg', 12, NULL, NULL, 100, NULL),
    (13, 10, 3, 'failure', 25, 'kg', 6, 10, NULL, NULL, NULL),
    (14, 10, 4, 'working', 25, 'kg', 6, NULL, NULL, NULL, NULL)`);
  db.run(
    `UPDATE workoutSet SET side = 'left', restBeforeSeconds = 90, completedAt = '2024-01-02T00:00:00.000Z' WHERE id = 10`,
  );
  db.run(
    `INSERT INTO bodyMeasurement (id, takenAt, site, value, source, state, entryUnit) VALUES (10, '2024-01-02T08:00:00.000Z', 'left-bicep', 40, 'app', 'flexed', 'in'), (11, '2024-01-02T08:00:00.000Z', 'left-bicep', 39, 'app', 'relaxed', 'cm')`,
  );
  const csv = exportStrongCsv(db);
  const rows = parseStrongWorkoutsFile(csv);
  expect(rows.map((row) => row.content)).toEqual(['W', '1', 'D', 'F', '4'].map((order) => ({ kind: 'set', order })));
  importStrongPlan(
    copy,
    makeStrongImportPlan(
      rows,
      parseStrongMeasurementsFile(exportMeasurementsCsv(db)),
      makeImportOptions({
        unitOverrides: new Map(rows.map((row) => [row.exerciseName, 'kg'])),
      }),
    ),
    new Date(),
  );
  const losses: string[] = [];
  for (const table of ['workout', 'workoutExercise', 'workoutSet', 'bodyMeasurement']) {
    const original = db.all<Record<string, string | number | null>>(`SELECT * FROM ${table} ORDER BY id`);
    const imported = copy.all<Record<string, string | number | null>>(`SELECT * FROM ${table} ORDER BY id`);
    expect(imported).toHaveLength(original.length);
    const columns = Object.keys(original[0] ?? {}).filter(
      (column) => !['workoutId', 'workoutExerciseId'].includes(column),
    );
    for (const column of columns) {
      const before = original.map((row) => row[column]);
      const after = imported.map((row) => row[column]);
      if (column === 'weightKilograms') {
        before.forEach((weight, index) => {
          expect(Math.abs(Number(weight) - Number(after[index]))).toBeLessThan(1e-9);
        });
      } else if (JSON.stringify(before) !== JSON.stringify(after)) {
        losses.push(`${table}.${column}`);
      }
    }
  }
  expect(losses.sort()).toEqual([...StrongCsvRoundTripLosses].sort());
  db.close();
  copy.close();
});
