/** A site's stored dimension; lengths use cm, masses use kg. */
export type MeasurementKind = 'length' | 'mass';

/** Circumference state, stored independently at the same time and site. */
export type MeasurementState = 'relaxed' | 'flexed';

/** A supported entry or display unit. Values in storage are never display-rounded. */
export type MeasurementUnit = 'cm' | 'in' | 'kg' | 'lb';

/** A tape-measure or scale site, including its editable how-to guide and stable grouping. */
export interface MeasurementSite {
  readonly key: string;
  readonly name: string;
  readonly kind: MeasurementKind;
  readonly groupKey: string;
  readonly side: 'left' | 'right' | null;
  readonly supportsFlexed: boolean;
  readonly guide: string;
  readonly position: number;
  readonly isCustom: boolean;
}

/** SQLite's boolean representation of a site. */
export interface MeasurementSiteRow extends Omit<MeasurementSite, 'supportsFlexed' | 'isCustom'> {
  readonly supportsFlexed: number;
  readonly isCustom: number;
}

/** Converts SQLite boolean integers without changing the stored guide. */
export function fromMeasurementSiteRow(row: MeasurementSiteRow): MeasurementSite {
  return { ...row, supportsFlexed: row.supportsFlexed === 1, isCustom: row.isCustom === 1 };
}
