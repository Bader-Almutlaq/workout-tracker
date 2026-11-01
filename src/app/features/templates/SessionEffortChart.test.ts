import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { SessionEffortChart } from './SessionEffortChart';

vi.mock('react', async (importOriginal) => {
  const original = await importOriginal<typeof import('react')>();
  return {
    ...original,
    useState: (initial: unknown) => [initial === false ? true : initial, () => undefined],
  };
});

test('the table contains each session date and value for both measures', () => {
  const sessions = [{ date: '2026-01-05T12:00:00Z', workoutId: 1, isDeload: true, hardSets: 3, averageRir: 2 }];
  for (const effort of [false, true]) {
    const html = renderToStaticMarkup(createElement(SessionEffortChart, { sessions, effort }));
    expect(html).toContain('<table>');
    expect(html).toContain('Jan');
    expect(html).toContain(effort ? '2.0 RIR' : '3 sets');
    expect(html).toContain('Deload');
  }
});
