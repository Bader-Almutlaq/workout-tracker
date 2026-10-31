import { jsx as _jsx } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
vi.mock('../../data/database', () => ({ database: {}, messageOf: String }));
import { measurementChange } from '../../../core/measurements/MeasurementChange';
import { MeasurementHistory } from './MeasurementHistory';
import { MeasurementChangeFigures } from './MeasurementChangeFigures';
import { MeasurementLogSheet } from './MeasurementLogSheet';
const site = {
  key: 'waist',
  name: 'Waist',
  kind: 'length' as const,
  groupKey: 'waist',
  side: null,
  supportsFlexed: false,
  guide: '',
  position: 0,
  isCustom: false,
};
const entry = {
  id: 1,
  takenAt: '2026-01-01T12:30:45.123Z',
  site: 'waist',
  value: 80,
  state: 'relaxed' as const,
  entryUnit: 'cm' as const,
  source: 'app' as const,
};
test('empty history and a single entry explain their states', () => {
  expect(
    renderToStaticMarkup(
      _jsx(MeasurementHistory, { entries: [], unit: 'cm', sites: [site], onEdit: () => {}, onDelete: () => {} }),
    ),
  ).toContain('No measurements yet.');
  const change = measurementChange([entry], 'relaxed');
  const html = renderToStaticMarkup(
    _jsx(MeasurementChangeFigures, {
      detail: { site, entries: [entry], relaxed: change, flexed: measurementChange([], 'flexed') },
      state: 'relaxed',
      unit: 'cm',
    }),
  );
  expect(html).toContain('Changes appear after two entries.');
  expect(html).not.toContain('4 weeks');
});
test('the edit sheet offers deletion and minute precision', () => {
  const html = renderToStaticMarkup(
    _jsx(MeasurementLogSheet, {
      sites: [site],
      units: { lengthUnit: 'cm', weightUnit: 'kg' },
      entry: entry,
      onClose: () => {},
      onDelete: () => {},
    }),
  );
  expect(html).toContain('Delete measurement');
  expect(html).toContain('step="60"');
});
