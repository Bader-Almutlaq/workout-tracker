import { describe, expect, test, vi } from 'vitest';
import { BodyMeasurementSite } from '../models/BodyMeasurement';
import { CsvTable } from './CsvTable';
import { expectImportError } from './fixtures/expectImportError';
import { OLDER_LAYOUT, WAIST } from './fixtures/StrongFixtures';
import {
  isStrongMeasurementsFile,
  measurementSiteSlug,
  normaliseMeasurement,
  parseStrongMeasurementsFile,
} from './StrongMeasurementsFile';

vi.stubEnv('TZ', 'UTC');

describe('Strong measurements file', () => {
  test('Measurements: site slugs and inches converted to centimetres', () => {
    const values = parseStrongMeasurementsFile(WAIST);
    expect(values.map((value) => value.site)).toEqual(['waist', 'waist']);
    expect(values[0]?.value).toBe(78);
    expect(Math.abs((values[1]?.value ?? 0) - 78.74)).toBeLessThan(1e-9);
    expect(measurementSiteSlug('Left Bicep')).toBe('left-bicep');
    expect(measurementSiteSlug('Body Weight')).toBe(BodyMeasurementSite.bodyweight);
  });

  test('Rows carry the local time as UTC and the Strong source', () => {
    const values = parseStrongMeasurementsFile(WAIST);
    expect(values[0]).toEqual({ takenAt: '2026-02-18T09:13:35.000Z', site: 'waist', value: 78, source: 'strong' });
  });

  test('Every bodyweight label maps to the bodyweight site', () => {
    for (const label of ['Weight', 'weight', 'Bodyweight', 'Body Weight', ' body weight (kg)']) {
      expect(measurementSiteSlug(label)).toBe(BodyMeasurementSite.bodyweight);
    }
  });

  test('Site slugs split on anything that is not a letter or digit', () => {
    expect(measurementSiteSlug('  Upper  Abs ')).toBe('upper-abs');
    expect(measurementSiteSlug('Left Forearm (relaxed)')).toBe('left-forearm-relaxed');
    expect(measurementSiteSlug('Hips')).toBe('hips');
  });

  test('Units are normalised to centimetres or kilograms', () => {
    expect(normaliseMeasurement(10, 'in')).toBe(25.4);
    expect(normaliseMeasurement(10, 'inches')).toBe(25.4);
    expect(normaliseMeasurement(10, 'inch')).toBe(25.4);
    expect(normaliseMeasurement(100, 'lb')).toBeCloseTo(45.359237, 9);
    expect(normaliseMeasurement(100, 'lbs')).toBeCloseTo(45.359237, 9);
    expect(normaliseMeasurement(80, 'cm')).toBe(80);
    expect(normaliseMeasurement(80, 'kg')).toBe(80);
  });

  test('A file without a Unit column is read as centimetres; a decimal comma is accepted', () => {
    const [value] = parseStrongMeasurementsFile('Date,Measurement Type,Value\n2026-02-18 09:13:35,Neck,"38,5"');
    expect(value?.value).toBe(38.5);
  });

  test('Measurement files are told apart from workout files', () => {
    expect(isStrongMeasurementsFile(CsvTable.parse(WAIST))).toBe(true);
    expect(isStrongMeasurementsFile(CsvTable.parse(OLDER_LAYOUT))).toBe(false);
  });

  test('Missing columns, bad dates and bad values are reported with their line', () => {
    expectImportError(() => parseStrongMeasurementsFile('Date,Value\n'), {
      kind: 'missingColumn',
      column: 'Measurement Type',
    });
    expectImportError(() => parseStrongMeasurementsFile('Measurement Type,Value\n'), {
      kind: 'missingColumn',
      column: 'Date',
    });
    expectImportError(() => parseStrongMeasurementsFile('Date,Measurement Type\n'), {
      kind: 'missingColumn',
      column: 'Value',
    });
    expectImportError(() => parseStrongMeasurementsFile('Date,Measurement Type,Value\nyesterday,Neck,38'), {
      kind: 'invalidValue',
      column: 'Date',
      value: 'yesterday',
      line: 2,
    });
    expectImportError(() => parseStrongMeasurementsFile('Date,Measurement Type,Value\n2026-02-18 09:13:35,Neck,wide'), {
      kind: 'invalidValue',
      column: 'Value',
      value: 'wide',
      line: 2,
    });
  });
});
