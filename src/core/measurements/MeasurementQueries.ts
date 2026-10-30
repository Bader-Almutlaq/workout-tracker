import type { Database } from '../db/Database';
import { fromBodyMeasurementRow, type BodyMeasurement, type BodyMeasurementRow } from '../models/BodyMeasurement';
import { measurementChange, type MeasurementChange } from './MeasurementChange';
import { fromMeasurementSiteRow, type MeasurementSite, type MeasurementSiteRow } from './MeasurementSite';

/** A site and independent relaxed/flexed summaries, in stored cm/kg. */
export interface MeasurementSiteSummary {
  readonly site: MeasurementSite;
  readonly relaxed: MeasurementChange;
  readonly flexed: MeasurementChange;
}

/** One ordered group; left and right sites remain separate selectable histories. */
export interface MeasurementGroup {
  readonly key: string;
  readonly name: string;
  readonly sites: readonly MeasurementSiteSummary[];
}

/** A site's complete chronological history and state-specific changes. */
export interface MeasurementDetail extends MeasurementSiteSummary {
  readonly entries: readonly BodyMeasurement[];
}

function history(db: Database, key: string): BodyMeasurement[] {
  return db
    .all<BodyMeasurementRow>(
      `
    SELECT id, takenAt, site, value, source, state, entryUnit FROM bodyMeasurement
    WHERE site = ? ORDER BY takenAt, id
  `,
      [key],
    )
    .map(fromBodyMeasurementRow);
}

function summary(site: MeasurementSite, entries: readonly BodyMeasurement[]): MeasurementSiteSummary {
  return { site, relaxed: measurementChange(entries, 'relaxed'), flexed: measurementChange(entries, 'flexed') };
}

/** Read-only site groups and history; UI and worker never calculate measurement changes. */
export const MeasurementQueries = {
  /** Groups in stored order, with left before right; includes sites with no entries. */
  list(db: Database): readonly MeasurementGroup[] {
    const sites = db
      .all<MeasurementSiteRow>(
        `
      SELECT * FROM measurementSite ORDER BY position, CASE side WHEN 'left' THEN 0 ELSE 1 END, key
    `,
      )
      .map(fromMeasurementSiteRow);
    const groups = new Map<string, { key: string; name: string; sites: MeasurementSiteSummary[] }>();
    for (const site of sites) {
      let group = groups.get(site.groupKey);
      if (group === undefined) {
        const name = site.side === null ? site.name : site.groupKey.charAt(0).toUpperCase() + site.groupKey.slice(1);
        group = { key: site.groupKey, name, sites: [] };
        groups.set(site.groupKey, group);
      }
      group.sites.push(summary(site, history(db, site.key)));
    }
    return [...groups.values()];
  },

  /** Returns null for a missing site; otherwise includes every entry, oldest first. */
  detail(db: Database, key: string): MeasurementDetail | null {
    const row = db.get<MeasurementSiteRow>('SELECT * FROM measurementSite WHERE key = ?', [key]);
    if (row === undefined) return null;
    const entries = history(db, key);
    return { ...summary(fromMeasurementSiteRow(row), entries), entries };
  },
};
