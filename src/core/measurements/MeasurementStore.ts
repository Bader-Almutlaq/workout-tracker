import type { Database } from '../db/Database';
import type { MeasurementKind, MeasurementState, MeasurementUnit } from './MeasurementSite';
import type { MeasurementUnits } from './MeasurementUnits';
import { storedMeasurementValue } from './MeasurementUnits';

/** A typed measurement; omission of takenAt means now, and omission of id means insert. */
export interface MeasurementDraft {
  readonly id?: number;
  readonly site: string;
  readonly state: MeasurementState;
  readonly value: number;
  readonly unit: MeasurementUnit;
  readonly takenAt?: string;
}

/** A new unpaired site; the store assigns its stable key and list position. */
export interface MeasurementSiteDraft {
  readonly name: string;
  readonly kind: MeasurementKind;
  readonly supportsFlexed: boolean;
  readonly guide: string;
}

/** Owner-readable measurement validation/conflict error. No write is applied on failure. */
export class MeasurementStoreError extends Error {
  override readonly name = 'MeasurementStoreError';
  readonly kind = 'invalidMeasurement';
}

/** Bookkeeping writes for measurements and their sites; every validation happens before mutation. */
export const MeasurementStore = {
  /** Logs or edits an entry, storing unrounded cm/kg and the typed unit. Duplicate time/site/state is refused. */
  save(db: Database, draft: MeasurementDraft, now: Date = new Date()): number {
    const site = db.get<{ kind: MeasurementKind; supportsFlexed: number }>(
      'SELECT kind, supportsFlexed FROM measurementSite WHERE key = ?',
      [draft.site],
    );
    if (site === undefined) throw new MeasurementStoreError('Choose an existing measurement site.');
    if (draft.state !== 'relaxed' && draft.state !== 'flexed')
      throw new MeasurementStoreError('Choose relaxed or flexed.');
    if (draft.state === 'flexed' && site.supportsFlexed !== 1)
      throw new MeasurementStoreError('This site does not support flexed measurements.');
    const lengthUnit = draft.unit === 'cm' || draft.unit === 'in';
    const massUnit = draft.unit === 'kg' || draft.unit === 'lb';
    if ((site.kind === 'length' && !lengthUnit) || (site.kind === 'mass' && !massUnit)) {
      throw new MeasurementStoreError('Choose a unit that matches this site.');
    }
    const value = storedMeasurementValue(draft.value, draft.unit);
    if (!Number.isFinite(value) || value <= 0)
      throw new MeasurementStoreError('Enter a finite value greater than zero.');
    const date = draft.takenAt === undefined ? now : new Date(draft.takenAt);
    if (!Number.isFinite(date.getTime())) throw new MeasurementStoreError('Enter a valid date and time.');
    const takenAt = date.toISOString();
    if (draft.id !== undefined && db.value('SELECT id FROM bodyMeasurement WHERE id = ?', [draft.id]) === undefined) {
      throw new MeasurementStoreError('This measurement no longer exists.');
    }
    const duplicate = db.value<number>(
      `
      SELECT id FROM bodyMeasurement WHERE takenAt = ? AND site = ? AND state = ? AND id != ?
    `,
      [takenAt, draft.site, draft.state, draft.id ?? -1],
    );
    if (duplicate !== undefined)
      throw new MeasurementStoreError(
        'A measurement already exists for this site, state and time. Edit that entry or choose another time.',
      );
    if (draft.id === undefined) {
      return db.run(
        `
        INSERT INTO bodyMeasurement (takenAt, site, value, source, state, entryUnit)
        VALUES (?, ?, ?, 'app', ?, ?)
      `,
        [takenAt, draft.site, value, draft.state, draft.unit],
      ).lastInsertRowId;
    }
    db.run(
      `
      UPDATE bodyMeasurement SET takenAt = ?, site = ?, value = ?, state = ?, entryUnit = ? WHERE id = ?
    `,
      [takenAt, draft.site, value, draft.state, draft.unit, draft.id],
    );
    return draft.id;
  },

  /** Deletes a measurement; a stale id is refused. */
  delete(db: Database, id: number): void {
    if (db.run('DELETE FROM bodyMeasurement WHERE id = ?', [id]).changes === 0) {
      throw new MeasurementStoreError('This measurement no longer exists.');
    }
  },

  /** Saves the how-to note verbatim, including an intentionally empty note. */
  updateGuide(db: Database, key: string, guide: string): void {
    if (db.run('UPDATE measurementSite SET guide = ? WHERE key = ?', [guide, key]).changes === 0) {
      throw new MeasurementStoreError('This measurement site no longer exists.');
    }
  },

  /** Adds a custom length or mass site after existing sites, without colliding with imported slugs. */
  addSite(db: Database, draft: MeasurementSiteDraft): string {
    const name = draft.name.trim();
    if (name === '') throw new MeasurementStoreError('Enter a site name.');
    if (draft.kind !== 'length' && draft.kind !== 'mass') throw new MeasurementStoreError('Choose length or mass.');
    const position = (db.value<number>('SELECT MAX(position) FROM measurementSite') ?? -1) + 1;
    let key = `custom-${position}`;
    while (db.value('SELECT key FROM measurementSite WHERE key = ?', [key]) !== undefined) key += '-custom';
    db.run(
      `
      INSERT INTO measurementSite (key, name, kind, groupKey, side, supportsFlexed, guide, position, isCustom)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 1)
    `,
      [key, name, draft.kind, key, draft.supportsFlexed ? 1 : 0, draft.guide, position],
    );
    return key;
  },

  /** Persists display choices in appSetting; conversions never alter historical values. */
  setUnits(db: Database, units: MeasurementUnits): void {
    if (
      (units.lengthUnit !== 'cm' && units.lengthUnit !== 'in') ||
      (units.weightUnit !== 'kg' && units.weightUnit !== 'lb')
    ) {
      throw new MeasurementStoreError('Choose cm/in and kg/lb.');
    }
    db.transaction(() => {
      for (const [key, value] of [
        ['lengthUnit', units.lengthUnit],
        ['weightUnit', units.weightUnit],
      ] as const) {
        db.run(
          `
          INSERT INTO appSetting (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `,
          [key, value],
        );
      }
    });
  },
};
