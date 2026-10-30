import { expect, test, vi } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { exportMeasurementsCsv } from './MeasurementsCsvExport';

vi.stubEnv('TZ', 'UTC');

test('uses Strong labels and stored units, and includes state only for flexed entries', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.run(
    `INSERT INTO bodyMeasurement (takenAt, site, value, source) VALUES ('2024-01-01T10:00:00.000Z', 'bodyweight', 75, 'app')`,
  );
  expect(exportMeasurementsCsv(db)).toContain('2024-01-01 10:00:00,Weight,75,kg');
  expect(exportMeasurementsCsv(db)).not.toContain('State');
  db.run(
    `INSERT INTO bodyMeasurement (takenAt, site, value, source, state) VALUES ('2024-01-01T10:00:00.000Z', 'left-bicep', 40, 'app', 'flexed')`,
  );
  expect(exportMeasurementsCsv(db)).toContain('Date,Measurement Type,Value,Unit,State');
  expect(exportMeasurementsCsv(db)).toContain('Left Bicep,40,cm,flexed');
  db.close();
});
