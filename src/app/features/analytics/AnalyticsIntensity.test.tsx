import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { RepRangeBars } from './RepRangeBars';
import { IntensityVolumeMap } from './IntensityVolumeMap';

describe('intensity components', () => {
  test('offers tables and plain empty states', () => {
    expect(renderToStaticMarkup(<RepRangeBars buckets={[]} />)).toContain('No hard sets');
    expect(renderToStaticMarkup(<RepRangeBars buckets={[{ label: '1–5', count: 1, percent: 100 }]} />)).toContain(
      'Show as table',
    );
    expect(renderToStaticMarkup(<IntensityVolumeMap points={[]} />)).toContain('No qualifying intensity data');
  });
});
