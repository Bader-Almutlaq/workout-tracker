import type { Database } from '../db/Database';
import { csvRecord, strongLocalTimestamp } from './StrongCsvExport';

interface MeasurementRow {
  takenAt: string;
  site: string;
  name: string;
  kind: string;
  isCustom: number;
  value: number;
  state: string;
}

/** Exports measurements in cm or kg; State is included only when flexed entries exist. */
export function exportMeasurementsCsv(db: Database): string {
  const rows = db.all<MeasurementRow>(`
    SELECT m.takenAt, m.site, s.name, s.kind, s.isCustom, m.value, m.state
    FROM bodyMeasurement m JOIN measurementSite s ON s.key = m.site
    ORDER BY m.takenAt, m.id
  `);
  const includeState = rows.some((row) => row.state === 'flexed');
  const records = [csvRecord(['Date', 'Measurement Type', 'Value', 'Unit', ...(includeState ? ['State'] : [])])];
  for (const row of rows) {
    const label =
      row.site === 'bodyweight'
        ? 'Weight'
        : row.isCustom
          ? row.name
          : row.name.replace(/\b\w/g, (letter) => letter.toUpperCase());
    records.push(
      csvRecord([
        strongLocalTimestamp(row.takenAt),
        label,
        row.value,
        row.kind === 'mass' ? 'kg' : 'cm',
        ...(includeState ? [row.state] : []),
      ]),
    );
  }
  return `${records.join('\r\n')}\r\n`;
}
