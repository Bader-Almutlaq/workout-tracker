import { describe, expect, test, vi } from 'vitest';
import type { MeasurementGroup } from '../../../core/measurements/MeasurementQueries';
import { measurementChange } from '../../../core/measurements/MeasurementChange';
import {
  groupValues,
  measurementChangeText,
  measurementDateInput,
  measurementText,
  partitionMeasurementGroups,
  siteUnit,
} from './measurementText';

const units = { lengthUnit: 'cm', weightUnit: 'kg' } as const;

describe('measurement screen helpers', () => {
  test('readable values and converted signed changes, including missing data and negative zero', () => {
    expect(measurementText(null, 'cm')).toBe('—');
    expect(measurementText(78.74, 'in')).toBe('31 in');
    expect(measurementText(135 * 0.45359237, 'lb')).toBe('135 lb');
    const reference = '2026-09-01T12:00:00Z';
    const first = '2026-08-01T12:00:00Z';
    expect(measurementChangeText(0.5, 'cm', reference, first)).toBe('+0.5 cm since Sep 1, 2026');
    expect(measurementChangeText(-2.54, 'in', reference, first)).toBe('−1 in since Sep 1, 2026');
    expect(measurementChangeText(-0.001, 'cm', reference, first)).toBe('+0 cm since Sep 1, 2026');
    expect(measurementChangeText(null, 'cm', null, first)).toBe('first entry Aug 1, 2026');
    expect(measurementChangeText(null, 'cm', null, null)).toBe('No entries');
  });
  test('paired values keep their side labels and states separate', () => {
    const empty = measurementChange([], 'relaxed');
    const group: MeasurementGroup = {
      key: 'biceps',
      name: 'Biceps',
      sites: ['left', 'right'].map((side, index) => ({
        site: {
          key: `${side}-bicep`,
          name: `${side} bicep`,
          kind: 'length',
          groupKey: 'biceps',
          side: side === 'left' ? 'left' : 'right',
          supportsFlexed: true,
          guide: '',
          position: 0,
          isCustom: false,
        },
        relaxed: {
          ...empty,
          latest: {
            id: index,
            site: `${side}-bicep`,
            state: 'relaxed',
            takenAt: '2026-01-01',
            value: 38.5 - index * 0.5,
            source: 'app',
            entryUnit: 'cm',
          },
        },
        flexed: empty,
      })),
    };
    const emptyGroup = {
      ...group,
      key: 'empty',
      sites: group.sites.map((summary) => ({ ...summary, relaxed: empty })),
    };
    expect(partitionMeasurementGroups([emptyGroup, group])).toEqual({ measured: [group], unmeasured: [emptyGroup] });
    expect(
      partitionMeasurementGroups([
        {
          ...emptyGroup,
          sites: emptyGroup.sites.map((summary) => ({ ...summary, flexed: group.sites[0]?.relaxed ?? empty })),
        },
      ]).measured,
    ).toHaveLength(1);
    expect(groupValues(group, 'relaxed', units)).toBe('L 38.5 · R 38 cm');
    expect(groupValues(group, 'flexed', units)).toBe('—');
    const site = group.sites[0]?.site;
    if (site === undefined) throw new Error('Missing fixture');
    expect(siteUnit(site, units)).toBe('cm');
    expect(siteUnit({ ...site, kind: 'mass' }, { lengthUnit: 'in', weightUnit: 'lb' })).toBe('lb');
  });
  test.each(['UTC', 'Asia/Riyadh', 'America/New_York'])('local datetime editing shows local minutes in %s', (zone) => {
    vi.stubEnv('TZ', zone);
    try {
      const iso = '2026-10-31T10:15:43.123Z';
      expect(new Date(measurementDateInput(iso)).toISOString()).toBe('2026-10-31T10:15:00.000Z');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
