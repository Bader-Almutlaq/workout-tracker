import type { RecordSource } from './RecordSource';

/** Well-known values of `BodyMeasurement.site`. */
export const BodyMeasurementSite = {
  /** The `site` value used for bodyweight entries, whose `value` is in kilograms. */
  bodyweight: 'bodyweight',
} as const;

/** A body measurement at a point in time. Table `bodyMeasurement`. */
export interface BodyMeasurement {
  readonly id: number;
  /** UTC ISO 8601 timestamp. */
  readonly takenAt: string;
  /** Slug such as "waist", "left-bicep" or "bodyweight". */
  readonly site: string;
  /** Centimetres for circumferences; kilograms when `site` is `BodyMeasurementSite.bodyweight`. */
  readonly value: number;
  /** `app` or `strong`. */
  readonly source: RecordSource;
}

/** A raw `bodyMeasurement` row as SQLite returns it. */
export type BodyMeasurementRow = BodyMeasurement;

/** Converts a raw `bodyMeasurement` row to a `BodyMeasurement`. */
export function fromBodyMeasurementRow(row: BodyMeasurementRow): BodyMeasurement {
  return { id: row.id, takenAt: row.takenAt, site: row.site, value: row.value, source: row.source };
}
