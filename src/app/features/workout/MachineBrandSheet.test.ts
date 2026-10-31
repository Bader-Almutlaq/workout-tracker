import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { MachineBrandSheet } from './MachineBrandSheet';

vi.mock('../../data/database', () => ({
  database: {},
  messageOf: (error: Error) => error.message,
  useDatabaseQuery: () => ({ status: 'ready', value: ['Panatta', 'Custom'] }),
}));

test('the picker puts recent names first, deduplicates the list and offers clearing and custom entry', () => {
  const html = renderToStaticMarkup(
    createElement(MachineBrandSheet, { value: 'Panatta', onSave: vi.fn(), onClose: vi.fn() }),
  );
  expect(html.indexOf('Panatta')).toBeLessThan(html.indexOf('Custom'));
  expect(html.indexOf('Custom')).toBeLessThan(html.indexOf('Arsenal Strength'));
  expect(html.match(/Panatta/g)).toHaveLength(1);
  expect(html).toContain('None');
  expect(html).toContain('Other…');
});
