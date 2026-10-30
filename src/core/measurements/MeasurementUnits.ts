import type { Database } from '../db/Database';
import { toKilograms, valueIn } from '../units/Weight';
import type { WeightUnit } from '../units/WeightUnit';
import type { MeasurementUnit } from './MeasurementSite';

/** Exact international inch definition (1959); no rounding in either direction. */
export const MeasurementConversion = Object.freeze({ centimetresPerInch: 2.54 });

/** Body display preferences. Missing/invalid settings fall back to cm and kg. */
export interface MeasurementUnits {
  readonly lengthUnit: 'cm' | 'in';
  readonly weightUnit: WeightUnit;
}

/** Reads persisted app settings without changing stored measurement values. */
export function measurementUnits(db: Database): MeasurementUnits {
  return {
    lengthUnit: db.value("SELECT value FROM appSetting WHERE key = 'lengthUnit'") === 'in' ? 'in' : 'cm',
    weightUnit: db.value("SELECT value FROM appSetting WHERE key = 'weightUnit'") === 'lb' ? 'lb' : 'kg',
  };
}

/** Converts a typed number to cm/kg, exactly; validation belongs to MeasurementStore. */
export function storedMeasurementValue(value: number, unit: MeasurementUnit): number {
  if (unit === 'in') return value * MeasurementConversion.centimetresPerInch;
  return unit === 'cm' ? value : toKilograms(value, unit);
}

/** Converts cm/kg to the matching display unit, without rounding. */
export function measurementValueIn(value: number, unit: MeasurementUnit): number {
  if (unit === 'in') return value / MeasurementConversion.centimetresPerInch;
  return unit === 'cm' ? value : valueIn(value, unit);
}
