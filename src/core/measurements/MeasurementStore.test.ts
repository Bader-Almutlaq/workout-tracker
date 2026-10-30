import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { MeasurementStore } from './MeasurementStore';
import { MeasurementQueries } from './MeasurementQueries';
import { measurementUnits, measurementValueIn, storedMeasurementValue } from './MeasurementUnits';

let db: Database;
const now = new Date('2026-10-31T10:00:00.123Z');
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
});
afterEach(() => db.close());

describe('MeasurementStore and queries', () => {
  test('log/edit/delete in converted entry units with default now', () => {
    const id = MeasurementStore.save(db, { site: 'waist', state: 'relaxed', value: 31, unit: 'in' }, now);
    expect(MeasurementQueries.detail(db, 'waist')?.entries).toEqual([
      { id, site: 'waist', state: 'relaxed', value: 78.74, entryUnit: 'in', source: 'app', takenAt: now.toISOString() },
    ]);
    MeasurementStore.save(db, {
      id,
      site: 'waist',
      state: 'relaxed',
      value: 80.125,
      unit: 'cm',
      takenAt: '2026-10-30T12:00:00+02:00',
    });
    expect(MeasurementQueries.detail(db, 'waist')?.relaxed.latest).toMatchObject({
      id,
      value: 80.125,
      entryUnit: 'cm',
      takenAt: '2026-10-30T10:00:00.000Z',
    });
    MeasurementStore.delete(db, id);
    expect(MeasurementQueries.detail(db, 'waist')?.entries).toEqual([]);
  });
  test('same time permits both states, but duplicate state is refused without overwriting', () => {
    const draft = { site: 'left-bicep', state: 'relaxed', value: 38, unit: 'cm' } as const;
    MeasurementStore.save(db, draft, now);
    MeasurementStore.save(db, { ...draft, state: 'flexed', value: 40 }, now);
    expect(() => MeasurementStore.save(db, { ...draft, value: 90 }, now)).toThrow('already exists');
    const detail = MeasurementQueries.detail(db, draft.site);
    expect(detail?.relaxed.latest?.value).toBe(38);
    expect(detail?.flexed.latest?.value).toBe(40);
  });
  test('failed edit leaves both measurements intact and imported provenance survives editing', () => {
    db.run(`INSERT INTO bodyMeasurement (takenAt, site, value, source) VALUES (?, 'waist', 80, 'strong')`, [
      now.toISOString(),
    ]);
    const id = MeasurementStore.save(db, {
      site: 'waist',
      state: 'relaxed',
      value: 90,
      unit: 'cm',
      takenAt: '2026-10-30',
    });
    const before = MeasurementQueries.detail(db, 'waist');
    expect(() =>
      MeasurementStore.save(db, { id, site: 'waist', state: 'relaxed', value: 91, unit: 'cm' }, now),
    ).toThrow('already exists');
    expect(MeasurementQueries.detail(db, 'waist')).toEqual(before);
    MeasurementStore.save(db, { id: 1, site: 'waist', state: 'relaxed', value: 81, unit: 'cm' }, now);
    expect(MeasurementQueries.detail(db, 'waist')?.relaxed.latest?.source).toBe('strong');
  });
  test('unsupported flexed, wrong dimension, stale ids and invalid dates/values are refused', () => {
    const draft = { site: 'waist', state: 'relaxed', value: 80, unit: 'cm' } as const;
    expect(() => MeasurementStore.save(db, { ...draft, state: 'flexed' })).toThrow('does not support');
    expect(() => MeasurementStore.save(db, { ...draft, unit: 'kg' })).toThrow('matches');
    expect(() => MeasurementStore.save(db, { ...draft, site: 'missing' })).toThrow('existing');
    expect(() => MeasurementStore.save(db, { ...draft, id: 900 })).toThrow('no longer');
    expect(() => MeasurementStore.save(db, { ...draft, takenAt: 'bad' })).toThrow('date');
    for (const value of [0, -1, NaN, Infinity, 1e308]) {
      expect(() => MeasurementStore.save(db, { ...draft, value, unit: 'in' })).toThrow('finite value');
    }
    expect(() => MeasurementStore.delete(db, 900)).toThrow('no longer');
    expect(MeasurementQueries.detail(db, 'waist')?.entries).toHaveLength(0);
  });
  test('custom sites, notes, ordered left/right groups and empty history', () => {
    const key = MeasurementStore.addSite(db, {
      name: '  Wrist α  ',
      kind: 'length',
      supportsFlexed: true,
      guide: 'Keep\nthis note',
    });
    MeasurementStore.updateGuide(db, key, '  Edited\nnote  ');
    const detail = MeasurementQueries.detail(db, key);
    expect(detail?.site).toMatchObject({
      name: 'Wrist α',
      isCustom: true,
      guide: '  Edited\nnote  ',
      supportsFlexed: true,
    });
    const groups = MeasurementQueries.list(db);
    expect(groups.at(-1)?.key).toBe(key);
    expect(groups.find((group) => group.key === 'biceps')?.sites.map((site) => site.site.key)).toEqual([
      'left-bicep',
      'right-bicep',
    ]);
    expect(groups.find((group) => group.key === 'biceps')?.sites[0]?.relaxed.latest).toBeNull();
    expect(MeasurementQueries.detail(db, 'missing')).toBeNull();
    expect(() => MeasurementStore.updateGuide(db, 'missing', '')).toThrow('no longer');
    expect(() => MeasurementStore.addSite(db, { name: ' ', kind: 'length', supportsFlexed: false, guide: '' })).toThrow(
      'name',
    );
    const massKey = MeasurementStore.addSite(db, {
      name: 'Custom mass',
      kind: 'mass',
      supportsFlexed: true,
      guide: '',
    });
    MeasurementStore.save(db, { site: massKey, state: 'flexed', value: 20, unit: 'lb' }, now);
    expect(MeasurementQueries.detail(db, massKey)?.flexed.latest?.value).toBe(20 * 0.45359237);
  });
  test('latest per-state summaries include four-week changes', () => {
    MeasurementStore.save(db, { site: 'left-bicep', state: 'relaxed', value: 38, unit: 'cm', takenAt: '2026-10-01' });
    MeasurementStore.save(db, { site: 'left-bicep', state: 'relaxed', value: 38.5, unit: 'cm', takenAt: '2026-10-29' });
    const summary = MeasurementQueries.list(db).find((group) => group.key === 'biceps')?.sites[0];
    expect(summary?.relaxed.fourWeeks).toBe(0.5);
    expect(summary?.flexed.fourWeeks).toBeNull();
  });
  test('exact cm/in and kg/lb conversions do not display-snap or round storage', () => {
    expect(storedMeasurementValue(31, 'in')).toBe(31 * 2.54);
    expect(measurementValueIn(78.74, 'in')).toBeCloseTo(31, 12);
    expect(storedMeasurementValue(81.123456789, 'cm')).toBe(81.123456789);
    expect(storedMeasurementValue(135, 'lb')).toBe(135 * 0.45359237);
    expect(measurementValueIn(135 * 0.45359237, 'lb')).toBeCloseTo(135, 12);
    const id = MeasurementStore.save(db, { site: 'bodyweight', state: 'relaxed', value: 135, unit: 'lb' }, now);
    expect(db.get('SELECT value, entryUnit FROM bodyMeasurement WHERE id = ?', [id])).toEqual({
      value: 135 * 0.45359237,
      entryUnit: 'lb',
    });
  });
  test('units default to cm/kg, persist and never rewrite data', () => {
    expect(measurementUnits(db)).toEqual({ lengthUnit: 'cm', weightUnit: 'kg' });
    MeasurementStore.save(db, { site: 'waist', state: 'relaxed', value: 80.1234, unit: 'cm' }, now);
    const before = MeasurementQueries.detail(db, 'waist');
    MeasurementStore.setUnits(db, { lengthUnit: 'in', weightUnit: 'lb' });
    expect(measurementUnits(db)).toEqual({ lengthUnit: 'in', weightUnit: 'lb' });
    expect(MeasurementQueries.detail(db, 'waist')).toEqual(before);
  });
});
