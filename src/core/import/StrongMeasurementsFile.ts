import { BodyMeasurementSite, type BodyMeasurement } from '../models/BodyMeasurement';
import { toKilograms } from '../units/Weight';
import { CsvTable } from './CsvTable';
import { ImportError } from './ImportError';
import { parseDecimal } from './parseDecimal';
import { parseStrongTimestamp } from './StrongTimestamp';
import { trimWhitespace } from './trimWhitespace';

/** A measurement read from a Strong export, ready to store (the database assigns the `id`). */
export type PlannedMeasurement = Omit<BodyMeasurement, 'id'>;

/** Unit conversions for measurement files. */
export const MeasurementConversion = {
  /** Exact, by international definition (1959). */
  centimetresPerInch: 2.54,
} as const;

/** Whether `table` looks like a measurements export (used to sort picked files). */
export function isStrongMeasurementsFile(table: CsvTable): boolean {
  return table.columnIndex('Measurement Type') !== undefined && table.columnIndex('Value') !== undefined;
}

/**
 * Reads one Strong body-measurement export (e.g. `strong_waist.csv`).
 *
 * Header: `Date,Measurement Type,Value,Unit,Source`. Strong writes one file per measurement site.
 * Circumferences are stored in centimetres; a bodyweight file is stored in kilograms under
 * `BodyMeasurementSite.bodyweight`. Timestamps are local time, read in the device's time zone.
 *
 * @throws ImportError if a required column is missing or a value is malformed.
 */
export function parseStrongMeasurementsFile(text: string): PlannedMeasurement[] {
  const table = CsvTable.parse(text);
  const requiredColumn = (name: string): number => {
    const index = table.columnIndex(name);
    if (index === undefined) throw new ImportError({ kind: 'missingColumn', column: name });
    return index;
  };
  const date = requiredColumn('Date');
  const type = requiredColumn('Measurement Type');
  const value = requiredColumn('Value');
  const unit = table.columnIndex('Unit');

  return table.rows.map((fields, index): PlannedMeasurement => {
    const line = index + 2;
    const dateText = fields[date] ?? '';
    const takenAt = parseStrongTimestamp(dateText);
    if (takenAt === undefined) throw new ImportError({ kind: 'invalidValue', column: 'Date', value: dateText, line });
    const valueText = fields[value] ?? '';
    const number = parseDecimal(valueText.replaceAll(',', '.'));
    if (number === undefined) throw new ImportError({ kind: 'invalidValue', column: 'Value', value: valueText, line });
    const unitText = unit === undefined ? 'cm' : (fields[unit] ?? '').toLowerCase();
    return {
      takenAt,
      site: measurementSiteSlug(fields[type] ?? ''),
      value: normaliseMeasurement(number, unitText),
      source: 'strong',
    };
  });
}

/** "Left Bicep" → "left-bicep"; any bodyweight label → `BodyMeasurementSite.bodyweight`. */
export function measurementSiteSlug(type: string): string {
  const lowered = trimWhitespace(type.toLowerCase());
  if (lowered === 'weight' || lowered.includes('body weight') || lowered === 'bodyweight') {
    return BodyMeasurementSite.bodyweight;
  }
  return lowered
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((word) => word !== '')
    .join('-');
}

/** Converts to the stored unit: cm for circumferences, kg for bodyweight. */
export function normaliseMeasurement(value: number, unit: string): number {
  switch (unit) {
    case 'in':
    case 'inch':
    case 'inches':
      return value * MeasurementConversion.centimetresPerInch;
    case 'lb':
    case 'lbs':
      return toKilograms(value, 'lb');
    default:
      return value;
  }
}
